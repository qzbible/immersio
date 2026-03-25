import os
import uuid
import json
import re
from fastapi import APIRouter, Request, Header, HTTPException
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from dotenv import load_dotenv

from database import db
from auth import get_admin_user, get_current_user
from models import GenerateQuestionsRequest, SaveQuestionRequest, GameMode, AdminQuestion
from audio_bank import AUDIO_BANK

from i18n_content import (
    get_quiz_qui_a_dit, get_quiz_vrai_faux, get_chrono_versets,
    get_mots_caches, get_anagrammes, get_labyrinthe_questions
)

router = APIRouter(prefix="/admin", tags=["admin"])


# ── Audio Bank ─────────────────────────────────────────────────────
@router.get("/audio-bank")
async def get_audio_bank(request: Request, authorization: Optional[str] = Header(None)):
    """Return the available music tracks and sound effects from the bank."""
    await get_admin_user(request, authorization)
    return AUDIO_BANK

CATEGORY_LABELS = {
    "vrai_faux": "Vrai ou Faux",
    "qui_a_dit": "Qui a dit ?",
    "chrono_versets": "Complétez le verset",
    "anagrammes": "Anagrammes bibliques",
}

PROMPTS = {
    "vrai_faux": {
        "fr": (
            "Tu es un expert en Bible. Génère {n} affirmations bibliques VRAI ou FAUX en FRANÇAIS sur le thème '{topic}'. "
            "Chaque item doit avoir : 'text' (l'affirmation), 'answer' (true ou false), 'reference' (verset biblique optionnel). "
            "Alterne entre affirmations vraies et fausses. Sois précis et factuel. "
            "Réponds UNIQUEMENT avec un JSON array valide, sans markdown ni texte autour. "
            "Exemple: [{\"text\": \"Jésus a changé l'eau en vin\", \"answer\": true, \"reference\": \"Jean 2:9\"}]"
        ),
        "en": (
            "You are a Bible expert. Generate {n} biblical TRUE or FALSE statements in ENGLISH about '{topic}'. "
            "Each item must have: 'text' (the statement), 'answer' (true or false), 'reference' (optional Bible verse). "
            "Alternate between true and false statements. Be precise and factual. "
            "Reply ONLY with a valid JSON array, no markdown. "
            "Example: [{\"text\": \"Jesus turned water into wine\", \"answer\": true, \"reference\": \"John 2:9\"}]"
        ),
    },
    "qui_a_dit": {
        "fr": (
            "Tu es un expert en Bible. Génère {n} questions 'Qui a dit ?' en FRANÇAIS sur le thème '{topic}'. "
            "Chaque item doit avoir : 'text' (la citation biblique), 'author' (la bonne réponse), "
            "'options' (array de 4 noms dont l'auteur correct), 'reference' (verset optionnel). "
            "Réponds UNIQUEMENT avec un JSON array valide. "
            "Exemple: [{\"text\": \"Je suis le chemin\", \"author\": \"Jésus\", \"options\": [\"Pierre\", \"Jésus\", \"Paul\", \"Jean\"], \"reference\": \"Jean 14:6\"}]"
        ),
        "en": (
            "You are a Bible expert. Generate {n} 'Who said it?' questions in ENGLISH about '{topic}'. "
            "Each item must have: 'text' (the biblical quote), 'author' (correct answer), "
            "'options' (array of 4 names including the author), 'reference' (optional verse). "
            "Reply ONLY with a valid JSON array. "
            "Example: [{\"text\": \"I am the way\", \"author\": \"Jesus\", \"options\": [\"Peter\", \"Jesus\", \"Paul\", \"John\"], \"reference\": \"John 14:6\"}]"
        ),
    },
    "chrono_versets": {
        "fr": (
            "Tu es un expert en Bible. Génère {n} exercices 'Complétez le verset' en FRANÇAIS sur le thème '{topic}'. "
            "Chaque item doit avoir : 'text' (le verset avec le mot manquant remplacé par '___'), "
            "'missing' (le mot exact à trouver), 'reference' (référence biblique). "
            "Réponds UNIQUEMENT avec un JSON array valide. "
            "Exemple: [{\"text\": \"Car Dieu a tant ___ le monde\", \"missing\": \"aimé\", \"reference\": \"Jean 3:16\"}]"
        ),
        "en": (
            "You are a Bible expert. Generate {n} 'Complete the verse' exercises in ENGLISH about '{topic}'. "
            "Each item must have: 'text' (the verse with missing word replaced by '___'), "
            "'missing' (the exact word), 'reference' (Bible reference). "
            "Reply ONLY with a valid JSON array. "
            "Example: [{\"text\": \"For God so ___ the world\", \"missing\": \"loved\", \"reference\": \"John 3:16\"}]"
        ),
    },
    "anagrammes": {
        "fr": (
            "Tu es un expert en Bible. Génère {n} anagrammes de personnages ou lieux bibliques en FRANÇAIS sur le thème '{topic}'. "
            "Chaque item doit avoir : 'word' (le mot mélangé), 'answer' (le mot original), 'hint' (un indice court). "
            "Mélange bien les lettres ! "
            "Réponds UNIQUEMENT avec un JSON array valide. "
            "Exemple: [{\"word\": \"SEUJ\", \"answer\": \"JÉSUS\", \"hint\": \"Fils de Dieu\"}]"
        ),
        "en": (
            "You are a Bible expert. Generate {n} anagrams of biblical characters or places in ENGLISH about '{topic}'. "
            "Each item must have: 'word' (scrambled word), 'answer' (original word), 'hint' (short clue). "
            "Mix the letters well! "
            "Reply ONLY with a valid JSON array. "
            "Example: [{\"word\": \"SSUEJ\", \"answer\": \"JESUS\", \"hint\": \"Son of God\"}]"
        ),
    },
}

DEFAULT_TOPICS = {
    "vrai_faux": {"fr": "la vie de Jésus et les miracles", "en": "the life of Jesus and miracles"},
    "qui_a_dit": {"fr": "les apôtres et prophètes", "en": "apostles and prophets"},
    "chrono_versets": {"fr": "les versets célèbres", "en": "famous verses"},
    "anagrammes": {"fr": "personnages bibliques", "en": "biblical characters"},
}


def _parse_json_response(text: str) -> list:
    text = text.strip()
    # Remove markdown code blocks if present
    text = re.sub(r"```(?:json)?", "", text).strip("` \n")
    # Find first [ ... ] array
    start = text.find("[")
    end = text.rfind("]")
    if start == -1 or end == -1:
        raise ValueError("No JSON array found in response")
    return json.loads(text[start:end + 1])


def _normalize_question(item: dict, category: str, lang: str) -> dict:
    """Normalize AI response to a consistent format."""
    base = {
        "question_id": f"aq_{uuid.uuid4().hex[:12]}",
        "category": category,
        "lang": lang,
        "approved": False,
        "source": "ai",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "reference": item.get("reference", ""),
    }

    if category == "vrai_faux":
        answer = item.get("answer", False)
        if isinstance(answer, str):
            answer = answer.lower() in ("true", "vrai", "oui", "yes")
        base.update({"text": item.get("text", ""), "answer": answer, "options": None})

    elif category == "qui_a_dit":
        base.update({
            "text": item.get("text", ""),
            "answer": item.get("author", ""),
            "options": item.get("options", []),
        })

    elif category == "chrono_versets":
        base.update({
            "text": item.get("text", ""),
            "answer": item.get("missing", ""),
            "options": None,
        })

    elif category == "anagrammes":
        base.update({
            "text": item.get("word", ""),
            "answer": item.get("answer", ""),
            "options": [item.get("hint", "")],
        })

    return base


# ── Check if current user is admin ──────────────────────────────────
@router.get("/me")
async def admin_check(request: Request, authorization: Optional[str] = Header(None)):
    user = await get_admin_user(request, authorization)
    return {"is_admin": True, "email": user.email, "name": user.name}


# ── Generate questions with GPT-4o ───────────────────────────────────
@router.post("/generate")
async def generate_questions(
    gen_req: GenerateQuestionsRequest,
    request: Request,
    authorization: Optional[str] = Header(None),
):
    await get_admin_user(request, authorization)
    raise HTTPException(status_code=501, detail="L'intégration IA n'est pas installée sur ce serveur.")


# ── Question Management CRUD ─────────────────────────────────────────
@router.get("/questions")
async def list_questions(
    request: Request,
    category: Optional[str] = None,
    lang: Optional[str] = None,
    difficulty: Optional[str] = None,
    approved: Optional[bool] = None,
    search: Optional[str] = None,
    authorization: Optional[str] = Header(None),
):
    await get_admin_user(request, authorization)
    query = {}
    if category:
        query["category"] = category
    if lang:
        query["lang"] = lang
    if difficulty:
        query["difficulty"] = difficulty
    if approved is not None:
        query["approved"] = approved
    if search:
        query["text"] = {"$regex": search, "$options": "i"}

    
    questions = await db.questions.find(query, {"_id": 0}).sort("created_at", -1).to_list(200)
    return questions


@router.post("/questions")
async def create_single_question(
    q: AdminQuestion,
    request: Request,
    authorization: Optional[str] = Header(None),
):
    await get_admin_user(request, authorization)
    doc = q.model_dump()
    if not doc.get("question_id"):
        doc["question_id"] = f"mq_{uuid.uuid4().hex[:12]}"
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.questions.insert_one(doc)
    doc.pop("_id", None)
    return doc


@router.patch("/questions/{question_id}")
async def update_question(
    question_id: str,
    data: Dict[str, Any],
    request: Request,
    authorization: Optional[str] = Header(None),
):
    await get_admin_user(request, authorization)
    # Filter out None/empty question_id if sent
    data.pop("question_id", None)
    
    result = await db.questions.update_one(
        {"question_id": question_id}, {"$set": data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Question non trouvée")
    
    updated = await db.questions.find_one({"question_id": question_id}, {"_id": 0})
    return updated


# ── Bulk save (from generate) ────────────────────────────────────────
@router.post("/questions/bulk")
async def bulk_save_questions(
    request: Request,
    authorization: Optional[str] = Header(None),
):
    await get_admin_user(request, authorization)
    body = await request.json()
    questions = body.get("questions", [])
    if not questions:
        raise HTTPException(status_code=400, detail="Aucune question fournie")

    saved = 0
    for q in questions:
        if not q.get("question_id"):
            q["question_id"] = f"aq_{uuid.uuid4().hex[:12]}"
        q["created_at"] = datetime.now(timezone.utc).isoformat()
        await db.questions.update_one(
            {"question_id": q["question_id"]},
            {"$set": q},
            upsert=True,
        )
        saved += 1
    return {"saved": saved, "message": f"{saved} questions sauvegardées"}


# ── Approve / reject ─────────────────────────────────────────────────
@router.patch("/questions/{question_id}/approve")
async def approve_question(
    question_id: str,
    request: Request,
    authorization: Optional[str] = Header(None),
):
    await get_admin_user(request, authorization)
    body = await request.json()
    approved = body.get("approved", True)
    result = await db.questions.update_one(
        {"question_id": question_id}, {"$set": {"approved": approved}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Question non trouvée")
    return {"question_id": question_id, "approved": approved}


# ── Delete ────────────────────────────────────────────────────────────
@router.delete("/questions/{question_id}")
async def delete_question(
    question_id: str,
    request: Request,
    authorization: Optional[str] = Header(None),
):
    await get_admin_user(request, authorization)
    result = await db.questions.delete_one({"question_id": question_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Question non trouvée")
    return {"message": "Question supprimée"}


# ── Sync hardcoded content ───────────────────────────────────────────
@router.post("/sync-content")
async def sync_hardcoded_content(request: Request, authorization: Optional[str] = Header(None)):
    await get_admin_user(request, authorization)
    
    synced_categories = []
    
    # 1. Qui a dit ?
    for lang in ["fr", "en"]:
        data = get_quiz_qui_a_dit(lang)["quotes"]
        for q in data:
            await db.questions.update_one(
                {"text": q["text"], "lang": lang},
                {"$setOnInsert": {
                    "question_id": f"sq_{uuid.uuid4().hex[:12]}",
                    "category": "quiz_qui_a_dit",
                    "lang": lang,
                    "text": q["text"],
                    "answer": q["author"],
                    "options": q["options"],
                    "approved": True,
                    "source": "hardcoded",
                    "created_at": datetime.now(timezone.utc).isoformat()
                }},
                upsert=True
            )
    await db.game_modes.update_one(
        {"mode_id": "quiz_qui_a_dit"},
        {"$set": {"available": True}},
        upsert=True
    )
    synced_categories.append("qui_a_dit")

    # 2. Vrai/Faux
    for lang in ["fr", "en"]:
        data = get_quiz_vrai_faux(lang)["statements"]
        for q in data:
            await db.questions.update_one(
                {"text": q["text"], "lang": lang},
                {"$setOnInsert": {
                    "question_id": f"sq_{uuid.uuid4().hex[:12]}",
                    "category": "quiz_vrai_faux",
                    "lang": lang,
                    "text": q["text"],
                    "answer": q["answer"],
                    "options": None,
                    "approved": True,
                    "source": "hardcoded",
                    "created_at": datetime.now(timezone.utc).isoformat()
                }},
                upsert=True
            )
    await db.game_modes.update_one(
        {"mode_id": "quiz_vrai_faux"},
        {"$set": {"available": True}},
        upsert=True
    )
    synced_categories.append("vrai_faux")

    # 3. Chrono-Versets
    for lang in ["fr", "en"]:
        data = get_chrono_versets(lang)["verses"]
        for q in data:
            await db.questions.update_one(
                {"text": q["text"], "lang": lang},
                {"$setOnInsert": {
                    "question_id": f"sq_{uuid.uuid4().hex[:12]}",
                    "category": "chrono_versets",
                    "lang": lang,
                    "text": q["text"],
                    "answer": q["missing"],
                    "reference": q.get("reference", ""),
                    "options": None,
                    "approved": True,
                    "source": "hardcoded",
                    "created_at": datetime.now(timezone.utc).isoformat()
                }},
                upsert=True
            )
    await db.game_modes.update_one(
        {"mode_id": "chrono_versets"},
        {"$set": {"available": True}},
        upsert=True
    )
    synced_categories.append("chrono_versets")

    # 4. Anagrammes
    for lang in ["fr", "en"]:
        data = get_anagrammes(lang)["anagrams"]
        for q in data:
            await db.questions.update_one(
                {"text": q["scrambled"], "lang": lang},
                {"$setOnInsert": {
                    "question_id": f"sq_{uuid.uuid4().hex[:12]}",
                    "category": "anagrammes",
                    "lang": lang,
                    "text": q["scrambled"],
                    "answer": q["answer"],
                    "options": None,
                    "approved": True,
                    "source": "hardcoded",
                    "created_at": datetime.now(timezone.utc).isoformat()
                }},
                upsert=True
            )
    await db.game_modes.update_one(
        {"mode_id": "anagrammes"},
        {"$set": {"available": True}},
        upsert=True
    )
    synced_categories.append("anagrammes")

    # 5. Labyrinthe (Question Sync)
    for lang in ["fr", "en"]:
        data = get_labyrinthe_questions(lang)
        for q in data:
            await db.questions.update_one(
                {"text": q["text"], "lang": lang},
                {"$setOnInsert": {
                    "question_id": f"sq_{uuid.uuid4().hex[:12]}",
                    "category": "labyrinthe_exode",
                    "lang": lang,
                    "text": q["text"],
                    "answer": q["answer"],
                    "options": q["options"],
                    "approved": True,
                    "source": "hardcoded",
                    "created_at": datetime.now(timezone.utc).isoformat()
                }},
                upsert=True
            )
    
    # Final step: Ensure ALL modes in the DB are available
    official_modes = [
        "quiz_qui_a_dit", "quiz_vrai_faux", "chrono_versets", "mots_caches", 
        "anagrammes", "la_manne", "tri_livres", "memory_biblique", 
        "labyrinthe_exode", "brebis_perdue", "multiplier_pains", "blind_test", "voyage_paul"
    ]
    
    for m_id in official_modes:
        await db.game_modes.update_one(
            {"mode_id": m_id},
            {"$set": {"available": True}},
            upsert=True
        )
        if m_id not in synced_categories:
            synced_categories.append(m_id)

    # Handle Aliases
    aliases = {
        "qui_a_dit": "quiz_qui_a_dit",
        "vrai_faux": "quiz_vrai_faux",
        "labyrinthe": "labyrinthe_exode"
    }
    for old_id, new_id in aliases.items():
        await db.game_modes.update_one(
            {"mode_id": old_id},
            {"$set": {"available": True}},
            upsert=False
        )

    return {"status": "success", "synced_categories": synced_categories}


# ── Stats ─────────────────────────────────────────────────────────────
@router.get("/stats")
async def admin_stats(request: Request, authorization: Optional[str] = Header(None)):
    await get_admin_user(request, authorization)
    total = await db.questions.count_documents({})
    approved = await db.questions.count_documents({"approved": True})
    by_category = {}
    for cat in PROMPTS.keys():
        by_category[cat] = {
            "total": await db.questions.count_documents({"category": cat}),
            "approved": await db.questions.count_documents({"category": cat, "approved": True}),
        }
    return {"total": total, "approved": approved, "by_category": by_category}


# ── Make a user admin (by email) ──────────────────────────────────────
@router.post("/promote")
async def promote_user(request: Request, authorization: Optional[str] = Header(None)):
    await get_admin_user(request, authorization)
    body = await request.json()
    email = body.get("email", "").lower()
    if not email:
        raise HTTPException(status_code=400, detail="Email requis")
    result = await db.users.update_one({"email": email}, {"$set": {"is_admin": True}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    return {"message": f"{email} est maintenant admin"}


# ── User Management ──────────────────────────────────────────────────
@router.get("/users")
async def list_users(request: Request, search: Optional[str] = None, authorization: Optional[str] = Header(None)):
    await get_admin_user(request, authorization)
    query = {}
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}}
        ]
    users = await db.users.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return users


@router.delete("/users/{user_id}")
async def delete_user(user_id: str, request: Request, authorization: Optional[str] = Header(None)):
    await get_admin_user(request, authorization)
    if user_id == "admin": # Protect special admin
        raise HTTPException(status_code=400, detail="Impossible de supprimer cet administrateur")
    result = await db.users.delete_one({"user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    return {"message": "Utilisateur supprimé"}


# ── Game Mode Management ──────────────────────────────────────────────
@router.get("/game-modes")
async def admin_game_modes(request: Request, authorization: Optional[str] = Header(None)):
    await get_admin_user(request, authorization)
    modes = await db.game_modes.find({}, {"_id": 0}).to_list(100)
    return modes


@router.get("/game-modes/{mode_id}")
async def admin_get_game_mode(mode_id: str, request: Request, authorization: Optional[str] = Header(None)):
    """Fetch a single game mode (includes audio config fields)."""
    await get_admin_user(request, authorization)
    mode = await db.game_modes.find_one({"mode_id": mode_id}, {"_id": 0})
    if not mode:
        raise HTTPException(status_code=404, detail="Mode non trouvé")
    return mode


@router.post("/game-modes")
async def create_game_mode(mode: GameMode, request: Request, authorization: Optional[str] = Header(None)):
    await get_admin_user(request, authorization)
    existing = await db.game_modes.find_one({"mode_id": mode.mode_id})
    if existing:
        raise HTTPException(status_code=400, detail="Identifiant de mode déjà utilisé")
    await db.game_modes.insert_one(mode.model_dump())
    return mode


@router.patch("/game-modes/{mode_id}")
async def update_game_mode(mode_id: str, data: Dict[str, Any], request: Request, authorization: Optional[str] = Header(None)):
    await get_admin_user(request, authorization)
    await db.game_modes.update_one({"mode_id": mode_id}, {"$set": data})
    updated = await db.game_modes.find_one({"mode_id": mode_id}, {"_id": 0})
    return updated


@router.delete("/game-modes/{mode_id}")
async def delete_game_mode(mode_id: str, request: Request, authorization: Optional[str] = Header(None)):
    await get_admin_user(request, authorization)
    res = await db.game_modes.delete_one({"mode_id": mode_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Mode non trouvé")
    return {"message": "Mode supprimé"}


# ── Overview Stats ──────────────────────────────────────────────────
@router.get("/overview")
async def get_overview_stats(request: Request, authorization: Optional[str] = Header(None)):
    await get_admin_user(request, authorization)
    total_users = await db.users.count_documents({})
    total_games = await db.game_sessions.count_documents({"completed": True})
    total_questions = await db.questions.count_documents({})
    pending_questions = await db.questions.count_documents({"approved": False})
    
    # Recent users
    recent_users = await db.users.find({}, {"_id": 0}).sort("created_at", -1).limit(5).to_list(5)
    
    return {
        "total_users": total_users,
        "total_games": total_games,
        "total_questions": total_questions,
        "pending_questions": pending_questions,
        "recent_users": recent_users
    }
