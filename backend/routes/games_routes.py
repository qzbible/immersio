from fastapi import APIRouter, HTTPException, Request, Header
from typing import Optional
from datetime import datetime, timezone
import uuid
import random
from database import db
from models import GameStartRequest, GameSubmitRequest
from auth import get_current_user, get_user_org_ids
from i18n_content import (
    get_quiz_qui_a_dit, get_quiz_vrai_faux, get_chrono_versets,
    get_mots_caches, get_anagrammes, get_labyrinthe_questions
)
from game_utils import generate_word_search_grid, generate_maze, calculate_score

router = APIRouter(prefix="/api")


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
