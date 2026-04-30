from fastapi import APIRouter, HTTPException, Request, Header
from typing import Optional
from datetime import datetime, timezone
import uuid
import random
from database import db
from models import GameStartRequest, GameSubmitRequest, ExamAttemptCreate
from auth import get_current_user, get_user_org_ids
from i18n_content import (
    get_quiz_qui_a_dit, get_quiz_vrai_faux, get_chrono_versets,
    get_mots_caches, get_anagrammes, get_labyrinthe_questions
)
from game_utils import generate_word_search_grid, generate_maze, calculate_score

router = APIRouter(prefix="/api")


# ═══════════════════════════════════════════════════════════════
# CERTIFICATIONS — Alias routes (pivot)
# ═══════════════════════════════════════════════════════════════

@router.post("/certifications/attempts")
async def create_exam_attempt(attempt: ExamAttemptCreate, request: Request, authorization: Optional[str] = Header(None)):
    user = await get_current_user(request, authorization)
    attempt_dict = attempt.model_dump()
    attempt_dict["attempt_id"] = str(uuid.uuid4())
    attempt_dict["user_id"] = user.user_id
    attempt_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    
    exam = await db.exams.find_one({"exam_id": attempt.exam_id})
    attempt_dict["exam_name"] = exam.get("name", "Examen Inconnu") if exam else "Examen Inconnu"
        
    await db.exam_attempts.insert_one(attempt_dict)
    return {"message": "Attempt saved", "attempt_id": attempt_dict["attempt_id"]}


@router.get("/certifications/attempts")
async def get_exam_attempts(request: Request, authorization: Optional[str] = Header(None)):
    user = await get_current_user(request, authorization)
    cursor = db.exam_attempts.find({"user_id": user.user_id}, {"_id": 0}).sort("created_at", -1)
    attempts = await cursor.to_list(100)
    return attempts


@router.get("/certifications/attempts/{attempt_id}")
async def get_exam_attempt_detail(attempt_id: str, request: Request, authorization: Optional[str] = Header(None)):
    user = await get_current_user(request, authorization)
    attempt = await db.exam_attempts.find_one({"attempt_id": attempt_id, "user_id": user.user_id}, {"_id": 0})
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
    return attempt


@router.get("/exams/history")
async def get_exam_history(request: Request, authorization: Optional[str] = Header(None)):
    """
    Retourne l'historique des examens de l'utilisateur.
    """
    user = await get_current_user(request, authorization)
    cursor = db.game_sessions.find(
        {"user_id": user.user_id, "completed": True},
        {"_id": 0}
    ).sort("completed_at", -1)
    
    sessions = await cursor.to_list(50)
    return sessions


@router.get("/certifications")
async def get_certifications(request: Request, authorization: Optional[str] = Header(None), domain: Optional[str] = None):
    """Returns all published exams for all users, ignoring organization filters."""
    # We still get the user for valid token check if needed, but not required to filter
    try:
        user = await get_current_user(request, authorization)
    except:
        pass # Public access allowed or handled by middleware if required
    
    exam_query: dict = {"is_published": True}
    if domain:
        exam_query["domain"] = domain  # use domain directly since exam schema uses domain

    new_exams = await db.exams.find(exam_query, {"_id": 0}).to_list(200)

    # Transform new exams to match the expected cert format
    for ex in new_exams:
        ex["mode_id"] = ex["exam_id"]
        ex["cert_id"] = ex["exam_id"]
        ex["domain"] = ex.get("domain", "Certification")
        ex.setdefault("available", True)
        ex.setdefault("question_count", ex.get("question_count", 0) or 0)
        ex.setdefault("pass_rate", None)
    
    return new_exams


@router.get("/certifications/domains")
async def get_certification_domains(request: Request, authorization: Optional[str] = Header(None)):
    """Returns unique domains from published exams."""
    try:
        user = await get_current_user(request, authorization)
    except:
        pass
    
    pipeline = [
        {"$match": {"is_published": True}},
        # Assuming the field is called "domain", if not "category" 
        {"$group": {"_id": {"$ifNull": ["$domain", "$category"]}, "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    domains = await db.exams.aggregate(pipeline).to_list(100)
    
    return [{"name": d["_id"] or "Certification", "count": d["count"]} for d in domains]
@router.post("/exam/start")
async def start_exam(request: Request, authorization: Optional[str] = Header(None)):
    """
    Démarre une session d'examen pour une certification.
    Body: { cert_id: str, difficulty?: str, num_questions?: int }
    Génère un pool mixte des 4 types : multiple_choice, single_choice, true_false, short_answer.
    """
    user = await get_current_user(request, authorization)
    body = await request.json()
    cert_id = body.get("cert_id")
    difficulty = body.get("difficulty")
    num_questions = min(body.get("num_questions", 20), 60)

    if not cert_id:
        raise HTTPException(status_code=400, detail="cert_id requis")

    org_ids = await get_user_org_ids(user.user_id)
    allowed_owners = ["system", user.user_id] + org_ids

    # 1. Look for the certification in new exams first
    cert = await db.exams.find_one(
        {"exam_id": cert_id, "owner_id": {"$in": allowed_owners}}, {"_id": 0}
    )
    is_new_exam = True

    if not cert:
        # Fallback to legacy game_modes
        cert = await db.game_modes.find_one(
            {"mode_id": cert_id, "owner_id": {"$in": allowed_owners}}, {"_id": 0}
        )
        is_new_exam = False

    if not cert:
        raise HTTPException(status_code=404, detail="Certification non trouvée")

    # Build question query
    all_questions = []
    if is_new_exam:
        # Fetch from exam_questions collection
        query = {"exam_id": cert_id, "owner_id": {"$in": allowed_owners}}
        all_questions = await db.exam_questions.find(query, {"_id": 0}).to_list(300)
    else:
        # Legacy logic
        q_ids = cert.get("selectedQuestions") or cert.get("question_ids") or []
        query: dict = {"owner_id": {"$in": allowed_owners}, "approved": True}
        if q_ids:
            query["question_id"] = {"$in": q_ids}
        else:
            sync_tags = cert.get("sync_tags", [])
            if sync_tags:
                query["tags"] = {"$in": sync_tags}
            else:
                cat = cert.get("category") or cert_id
                query["category"] = cat
            if difficulty:
                query["difficulty"] = difficulty
        all_questions = await db.questions.find(query, {"_id": 0}).to_list(300)
    random.shuffle(all_questions)

    # Bucket by type then take proportional mix
    buckets: dict = {}
    for q in all_questions:
        t = q.get("type", "single_choice")
        buckets.setdefault(t, []).append(q)

    TYPE_LABELS = {
        "multiple_choice": "QCM",
        "single_choice": "Choix unique",
        "true_false": "Vrai / Faux",
        "short_answer": "Réponse courte",
    }

    selected: list = []
    bucket_types = list(buckets.keys())
    per_type = max(1, num_questions // max(len(bucket_types), 1))
    for t in bucket_types:
        chunk = buckets[t][:per_type]
        for q in chunk:
            q["type_label"] = TYPE_LABELS.get(q.get("type"), q.get("type", ""))
        selected.extend(chunk)

    # Pad with any remaining questions if short
    if len(selected) < num_questions:
        remaining = [q for q in all_questions if q not in selected]
        selected.extend(remaining[: num_questions - len(selected)])

    random.shuffle(selected)
    selected = selected[:num_questions]

    session = {
        "session_id": f"exam_{uuid.uuid4().hex[:14]}",
        "user_id": user.user_id,
        "cert_id": cert_id,
        "cert_name": cert.get("name", cert_id),
        "questions": selected,
        "num_questions": len(selected),
        "difficulty": difficulty,
        "started_at": datetime.now(timezone.utc).isoformat(),
        "completed": False,
    }
    await db.game_sessions.insert_one({**session, "mode_id": cert_id, "game_data": {"questions": selected}, "lang": "fr"})

    return {
        "session_id": session["session_id"],
        "cert": cert,
        "questions": selected,
        "num_questions": len(selected),
        "started_at": session["started_at"]
    }


@router.get("/exam/session/{session_id}")
async def get_exam_session(session_id: str, request: Request, authorization: Optional[str] = Header(None)):
    """
    Récupère les détails et la correction d'une session d'examen terminée.
    """
    user = await get_current_user(request, authorization)
    session = await db.game_sessions.find_one(
        {"session_id": session_id, "user_id": user.user_id}, {"_id": 0}
    )
    if not session:
        raise HTTPException(status_code=404, detail="Session non trouvée")

    # If it was already scored, we can reconstruct question_results
    # or if we saved it in game_data/results
    
    questions = session.get("game_data", {}).get("questions", [])
    answers = session.get("answers", {})
    
    question_results = []
    correct_count = 0
    
    # Redo the scoring logic to ensure we have all fields for correction UI
    for q in questions:
        qid = q.get("question_id")
        user_answer = answers.get(qid)
        correct_answer = q.get("answer")
        is_correct = False
        q_type = q.get("type", "single_choice")

        if q_type == "multiple_choice":
            correct_set = set(correct_answer) if isinstance(correct_answer, list) else {correct_answer}
            user_set = set(user_answer) if isinstance(user_answer, list) else set()
            is_correct = correct_set == user_set
        elif q_type == "short_answer":
            is_correct = str(user_answer or "").strip().lower() == str(correct_answer or "").strip().lower()
        else:
            is_correct = user_answer == correct_answer

        if is_correct:
            correct_count += 1

        question_results.append({
            "question_id": qid,
            "text": q.get("text", ""),
            "type": q_type,
            "user_answer": user_answer,
            "correct_answer": correct_answer,
            "options": q.get("options", []),
            "is_correct": is_correct,
            "explanation": q.get("explanation", ""),
        })

    total = len(questions)
    pct = session.get("score_pct", round((correct_count / total * 100)) if total > 0 else 0)
    
    return {
        "session_id": session_id,
        "cert_name": session.get("cert_name"),
        "score_pct": pct,
        "correct": correct_count,
        "total": total,
        "question_results": question_results,
        "passed": pct >= 70,
        "completed_at": session.get("completed_at")
    }


@router.post("/exam/submit")
async def submit_exam(request: Request, authorization: Optional[str] = Header(None)):
    """
    Soumet les réponses d'un examen.
    Body: { session_id: str, answers: {question_id: answer} }
    Retourne : score %, réponses correctes/incorrectes, XP, coins.
    """
    user = await get_current_user(request, authorization)
    body = await request.json()
    session_id = body.get("session_id")
    answers = body.get("answers", {})

    session = await db.game_sessions.find_one(
        {"session_id": session_id, "user_id": user.user_id}, {"_id": 0}
    )
    if not session:
        raise HTTPException(status_code=404, detail="Session non trouvée")

    questions = session.get("game_data", {}).get("questions", [])
    total = len(questions)
    correct = 0
    question_results = []

    for q in questions:
        qid = q.get("question_id")
        user_answer = answers.get(qid)
        correct_answer = q.get("answer")  # index (int) or string

        is_correct = False
        q_type = q.get("type", "single_choice")

        if q_type == "multiple_choice":
            # user_answer is a sorted list of indices
            correct_set = set(correct_answer) if isinstance(correct_answer, list) else {correct_answer}
            user_set = set(user_answer) if isinstance(user_answer, list) else set()
            is_correct = correct_set == user_set
        elif q_type == "short_answer":
            # Case-insensitive strip comparison
            is_correct = str(user_answer or "").strip().lower() == str(correct_answer or "").strip().lower()
        else:
            # single_choice, true_false
            is_correct = user_answer == correct_answer

        if is_correct:
            correct += 1

        question_results.append({
            "question_id": qid,
            "text": q.get("text", ""),
            "type": q_type,
            "type_label": q.get("type_label", ""),
            "user_answer": user_answer,
            "correct_answer": correct_answer,
            "options": q.get("options", []),
            "is_correct": is_correct,
            "explanation": q.get("explanation", ""),
        })

    pct = round((correct / total * 100)) if total > 0 else 0
    xp_earned = correct * 15
    coins_earned = correct * 8

    await db.game_sessions.update_one(
        {"session_id": session_id},
        {"$set": {
            "completed": True, "answers": answers,
            "score_pct": pct, "correct": correct, "total": total,
            "completed_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    await db.users.update_one(
        {"user_id": user.user_id},
        {"$inc": {"xp": xp_earned, "coins": coins_earned}}
    )

    # Level-up check
    user_doc = await db.users.find_one({"user_id": user.user_id}, {"_id": 0})
    new_level = 1 + (user_doc.get("xp", 0) // 100)
    if new_level != user_doc.get("level", 1):
        await db.users.update_one({"user_id": user.user_id}, {"$set": {"level": new_level}})

    return {
        "score_pct": pct,
        "correct": correct,
        "total": total,
        "xp_earned": xp_earned,
        "coins_earned": coins_earned,
        "new_level": new_level,
        "question_results": question_results,
        "passed": pct >= 70,
    }





@router.get("/game-modes")
async def get_game_modes(request: Request, authorization: Optional[str] = Header(None), category: Optional[str] = None):
    user = await get_current_user(request, authorization)
    org_ids = await get_user_org_ids(user.user_id)
    
    allowed_owners = ["system", user.user_id] + org_ids
    base_filter = {
        "owner_id": {"$in": allowed_owners}
    }
    
    if category:
        base_filter["category"] = category
    modes = await db.game_modes.find(base_filter, {"_id": 0}).to_list(100)
    return modes


@router.get("/game-modes/categories")
async def get_game_categories(request: Request, authorization: Optional[str] = Header(None)):
    user = await get_current_user(request, authorization)
    org_ids = await get_user_org_ids(user.user_id)
    
    pipeline = [
        {
            "$match": {
                "$or": [
                    {"owner_id": "system"},
                    {"owner_id": user.user_id},
                    {"owner_id": {"$in": org_ids}}
                ]
            }
        },
        {"$group": {"_id": "$category", "count": {"$sum": 1}}}, 
        {"$sort": {"_id": 1}}
    ]
    categories = await db.game_modes.aggregate(pipeline).to_list(20)
    return [{"name": c["_id"], "count": c["count"]} for c in categories]


@router.get("/questions/random")
async def get_random_questions(request: Request, authorization: Optional[str] = Header(None), book: Optional[str] = None, difficulty: Optional[str] = None, limit: int = 10):
    user = await get_current_user(request, authorization)
    org_ids = await get_user_org_ids(user.user_id)
    
    allowed_owners = ["system", user.user_id] + org_ids
    query = {
        "owner_id": {"$in": allowed_owners}
    }
    if book:
        query["book"] = book
    if difficulty:
        query["difficulty"] = difficulty
    questions = await db.questions.find(query, {"_id": 0}).to_list(100)
    import random as rng
    rng.shuffle(questions)
    return questions[:limit]


@router.post("/games/start")
async def start_game(request: Request, game_request: GameStartRequest, authorization: Optional[str] = Header(None)):
    user = await get_current_user(request, authorization)
    mode_id = game_request.mode_id
    # Handle aliases
    aliases = {
        "qui_a_dit": "quiz_qui_a_dit",
        "vrai_faux": "quiz_vrai_faux",
        "labyrinthe": "labyrinthe_exode"
    }
    target_id = aliases.get(mode_id, mode_id)
    org_ids = await get_user_org_ids(user.user_id)
    allowed_owners = ["system", user.user_id] + org_ids

    mode = await db.game_modes.find_one({
        "mode_id": target_id,
        "owner_id": {"$in": allowed_owners}
    }, {"_id": 0})
    if not mode and target_id != mode_id:
        mode = await db.game_modes.find_one({
            "mode_id": mode_id,
            "owner_id": {"$in": allowed_owners}
        }, {"_id": 0})
        
    if not mode:
        raise HTTPException(status_code=404, detail="Mode de jeu non trouvé ou accès refusé")
    if not mode.get("available", True):
        raise HTTPException(status_code=403, detail="Ce mode n'est pas encore disponible")
    
    difficulty = game_request.difficulty or mode.get("difficulty", "moyen")
    game_data = await generate_game_data(mode, game_request.lang, difficulty, user.user_id)
    
    session = {
        "session_id": f"game_{uuid.uuid4().hex[:12]}",
        "user_id": user.user_id,
        "mode_id": game_request.mode_id,
        "game_data": game_data,
        "started_at": datetime.now(timezone.utc).isoformat(),
        "completed": False,
        "lang": game_request.lang
    }
    await db.game_sessions.insert_one(session)
    return {
        "session_id": session["session_id"],
        "game_data": game_data,
        "mode": mode  # includes bg_music, sfx_*, volume for client-side audio
    }


async def generate_game_data(mode: dict, lang: str = "fr", difficulty: Optional[str] = "moyen", user_id: Optional[str] = None):
    mode_id = mode.get("mode_id")
    template_id = mode.get("forked_from") or mode_id
    logic_id = mode.get("logic_id", template_id)
    
    # Try fetching from DB first for questions-based modes
    org_ids = []
    if user_id:
        org_ids = await get_user_org_ids(user_id)
    
    allowed_owners = ["system"]
    if user_id:
        allowed_owners.append(user_id)
    allowed_owners.extend(org_ids)
    
    # Priority 1: Explicit question IDs (STRICT OWNERSHIP check)
    # Support both old 'question_ids' and new 'selectedQuestions'
    q_ids = mode.get("selectedQuestions") or mode.get("question_ids") or []
    
    if q_ids:
        query = {
            "question_id": {"$in": q_ids},
            "lang": lang,
            "approved": True,
            # We still allow 'system' here because an org owner can pick system questions for their mode
            "owner_id": {"$in": allowed_owners}
        }
    else:
        # Priority 2: Sync Tags (New in Phase 14)
        sync_tags = mode.get("sync_tags", [])
        if sync_tags:
            query = {
                "tags": {"$in": sync_tags},
                "lang": lang,
                "approved": True,
                "owner_id": {"$in": allowed_owners}
            }
        else:
            # Priority 3: Category fallback (Legacy)
            cat_search = mode.get("category") or mode_id
            query = {
                "category": cat_search, 
                "lang": lang, 
                "approved": True,
                "owner_id": {"$in": allowed_owners}
            }
        
        if difficulty:
            query["difficulty"] = difficulty

    db_questions = await db.questions.find(query, {"_id": 0}).to_list(100)
    
    # Apply overrides (e.g. difficulty)
    overrides = mode.get("overrides", {})
    if overrides:
        for q in db_questions:
            q_id = q.get("question_id")
            if q_id in overrides:
                q.update(overrides[q_id])

    # Prepare base game data
    game_data_resp = {}
    
    if logic_id.startswith("quiz_") or logic_id in ["qui_a_dit", "vrai_faux"]:
        if db_questions:
            random.shuffle(db_questions)
            if logic_id == "qui_a_dit" or logic_id == "quiz_qui_a_dit":
                game_data_resp = {"quotes": db_questions[:5]}
            elif logic_id == "vrai_faux" or logic_id == "quiz_vrai_faux":
                mapped = []
                for q in db_questions:
                    mapped.append({"text": q["text"], "answer": True if q["answer"] == 0 else False})
                game_data_resp = {"statements": mapped}
        else:
            # Fallback to hardcoded templates if no DB questions found
            if logic_id == "qui_a_dit" or logic_id == "quiz_qui_a_dit": game_data_resp = get_quiz_qui_a_dit(lang)
            elif logic_id == "vrai_faux" or logic_id == "quiz_vrai_faux": game_data_resp = get_quiz_vrai_faux(lang)

    elif logic_id == "chrono_versets":
        if db_questions:
            random.shuffle(db_questions)
            mapped = []
            for q in db_questions:
                mapped.append({"text": q["text"], "missing": q.get("answer", ""), "reference": q.get("reference", "")})
            game_data_resp = {"verses": mapped[:4]}
        else:
            game_data_resp = get_chrono_versets(lang)
        
    elif logic_id == "mots_caches":
        grid_size = 12
        words = get_mots_caches(lang)
        grid_result = generate_word_search_grid(words, grid_size)
        game_data_resp = {"grid_size": grid_size, "words": words, "grid": grid_result["grid"], "placements": grid_result["placements"]}
        
    elif logic_id == "anagrammes":
        if db_questions:
            random.shuffle(db_questions)
            mapped = []
            for q in db_questions:
                mapped.append({"scrambled": q["text"], "answer": q.get("answer", "")})
            game_data_resp = {"anagrams": mapped[:5]}
        else:
            game_data_resp = get_anagrammes(lang)
        
    elif logic_id == "memory_biblique":
        symbols = ["✝️", "🕊️", "🍞", "🐟", "⚓", "🌟", "💒", "📖"]
        cards = []
        for symbol in symbols:
            cards.append({"id": f"{symbol}_1", "symbol": symbol})
            cards.append({"id": f"{symbol}_2", "symbol": symbol})
        random.shuffle(cards)
        game_data_resp = {"cards": cards}
        
    elif logic_id == "labyrinthe_exode" or logic_id == "labyrinthe":
        maze_data = generate_maze(15, 15)
        if db_questions:
            random.shuffle(db_questions)
            questions = db_questions[:10]
        else:
            questions = get_labyrinthe_questions(lang)
        game_data_resp = {**maze_data, "questions": questions}
        
    elif logic_id == "brebis_perdue":
        game_data_resp = {"target": "sheep", "grid_size": 8}
        
    elif logic_id == "multiplier_pains":
        game_data_resp = {"items": ["bread", "fish"], "duration": 30}
        
    elif logic_id == "blind_test":
        game_data_resp = {"tracks": [
            {"id": 1, "title": "Grand Dieu nous te bénissons", "options": ["Cantique 1", "Cantique 2", "Grand Dieu nous te bénissons", "Cantique 4"], "answer": 2},
            {"id": 2, "title": "Quel ami fidèle et tendre", "options": ["Quel ami fidèle et tendre", "Cantique 5", "Cantique 6", "Cantique 7"], "answer": 0}
        ]}
        
    elif logic_id == "voyage_paul":
        game_data_resp = {"stops": ["Damas", "Antioche", "Chypre", "Éphèse", "Rome"]}

    # ALWAYS include a separate pool of questions if available, for Hybrid Gameplay
    if db_questions and "questions" not in game_data_resp:
        # Filter for MCQ or T/F which are standard for the overlay
        hybrid_pool = [q for q in db_questions if q.get("type") in ["single_choice", "true_false"]]
        if hybrid_pool:
            game_data_resp["questions"] = hybrid_pool
        
    return game_data_resp


@router.post("/games/submit")
async def submit_game(request: Request, submit_request: GameSubmitRequest, authorization: Optional[str] = Header(None)):
    user = await get_current_user(request, authorization)
    session = await db.game_sessions.find_one({"session_id": submit_request.session_id, "user_id": user.user_id}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=404, detail="Session non trouvée")
    
    score = calculate_score(session["mode_id"], session["game_data"], submit_request.answers)
    
    await db.game_sessions.update_one(
        {"session_id": submit_request.session_id},
        {"$set": {"completed": True, "score": score, "answers": submit_request.answers, "completed_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    # Track language for polyglot badge
    lang = session.get("lang", "fr")
    await db.lang_tracking.update_one(
        {"user_id": user.user_id},
        {"$inc": {f"games_{lang}": 1}, "$set": {"last_played": datetime.now(timezone.utc).isoformat()}},
        upsert=True
    )
    
    xp_earned = score * 10
    coins_earned = score * 5
    await db.users.update_one({"user_id": user.user_id}, {"$inc": {"xp": xp_earned, "coins": coins_earned}})
    
    user_doc = await db.users.find_one({"user_id": user.user_id}, {"_id": 0})
    new_level = 1 + (user_doc.get("xp", 0) // 100)
    if new_level != user_doc.get("level", 1):
        await db.users.update_one({"user_id": user.user_id}, {"$set": {"level": new_level}})
    
    return {"score": score, "xp_earned": xp_earned, "coins_earned": coins_earned, "new_level": new_level}
