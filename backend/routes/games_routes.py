from fastapi import APIRouter, HTTPException, Request, Header
from typing import Optional
from datetime import datetime, timezone
import uuid
import random
from database import db
from models import GameStartRequest, GameSubmitRequest
from auth import get_current_user
from i18n_content import (
    get_quiz_qui_a_dit, get_quiz_vrai_faux, get_chrono_versets,
    get_mots_caches, get_anagrammes, get_labyrinthe_questions
)
from game_utils import generate_word_search_grid, generate_maze, calculate_score

router = APIRouter(prefix="/api")


@router.get("/game-modes")
async def get_game_modes(request: Request, authorization: Optional[str] = Header(None), category: Optional[str] = None):
    user = await get_current_user(request, authorization)
    query = {}
    if category:
        query["category"] = category
    modes = await db.game_modes.find(query, {"_id": 0}).to_list(100)
    return modes


@router.get("/game-modes/categories")
async def get_game_categories(request: Request, authorization: Optional[str] = Header(None)):
    user = await get_current_user(request, authorization)
    pipeline = [{"$group": {"_id": "$category", "count": {"$sum": 1}}}, {"$sort": {"_id": 1}}]
    categories = await db.game_modes.aggregate(pipeline).to_list(20)
    return [{"name": c["_id"], "count": c["count"]} for c in categories]


@router.get("/questions/random")
async def get_random_questions(request: Request, authorization: Optional[str] = Header(None), book: Optional[str] = None, difficulty: Optional[str] = None, limit: int = 10):
    user = await get_current_user(request, authorization)
    query = {}
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
    
    mode = await db.game_modes.find_one({"mode_id": target_id}, {"_id": 0})
    if not mode and target_id != mode_id:
        mode = await db.game_modes.find_one({"mode_id": mode_id}, {"_id": 0})
        
    if not mode:
        raise HTTPException(status_code=404, detail="Mode de jeu non trouvé")
    if not mode.get("available", False):
        raise HTTPException(status_code=403, detail="Ce mode n'est pas encore disponible")
    
    difficulty = game_request.difficulty or mode.get("difficulty", "moyen")
    game_data = await generate_game_data(target_id, game_request.lang, difficulty)
    
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


async def generate_game_data(mode_id: str, lang: str = "fr", difficulty: Optional[str] = "moyen"):
    # Try fetching from DB first for questions-based modes
    query = {"category": mode_id, "lang": lang, "approved": True}
    if difficulty:
        query["difficulty"] = difficulty
    db_questions = await db.questions.find(query, {"_id": 0}).to_list(50)
    
    if mode_id == "quiz_qui_a_dit" or mode_id == "qui_a_dit":
        if db_questions:
            random.shuffle(db_questions)
            return {"quotes": db_questions[:5]}
        return get_quiz_qui_a_dit(lang)
        
    elif mode_id == "quiz_vrai_faux" or mode_id == "vrai_faux":
        if db_questions:
            random.shuffle(db_questions)
            # Map answer (0=Vrai, 1=Faux) back to bool
            mapped = []
            for q in db_questions:
                mapped.append({"text": q["text"], "answer": True if q["answer"] == 0 else False})
            return {"statements": mapped}
        return get_quiz_vrai_faux(lang)
        
    elif mode_id == "chrono_versets":
        if db_questions:
            random.shuffle(db_questions)
            mapped = []
            for q in db_questions:
                mapped.append({"text": q["text"], "missing": q.get("answer", ""), "reference": q.get("reference", "")})
            return {"verses": mapped[:4]}
        return get_chrono_versets(lang)
        
    elif mode_id == "mots_caches":
        grid_size = 12
        words = get_mots_caches(lang)
        grid_result = generate_word_search_grid(words, grid_size)
        return {"grid_size": grid_size, "words": words, "grid": grid_result["grid"], "placements": grid_result["placements"]}
        
    elif mode_id == "anagrammes":
        if db_questions:
            random.shuffle(db_questions)
            mapped = []
            for q in db_questions:
                mapped.append({"scrambled": q["text"], "answer": q.get("answer", "")})
            return {"anagrams": mapped[:5]}
        return get_anagrammes(lang)
        
    elif mode_id == "memory_biblique":
        symbols = ["✝️", "🕊️", "🍞", "🐟", "⚓", "🌟", "💒", "📖"]
        cards = []
        for symbol in symbols:
            cards.append({"id": f"{symbol}_1", "symbol": symbol})
            cards.append({"id": f"{symbol}_2", "symbol": symbol})
        random.shuffle(cards)
        return {"cards": cards}
        
    elif mode_id == "labyrinthe_exode" or mode_id == "labyrinthe":
        maze_data = generate_maze(15, 15)
        if db_questions:
            random.shuffle(db_questions)
            return {**maze_data, "questions": db_questions[:10]}
        questions = get_labyrinthe_questions(lang)
    elif mode_id == "brebis_perdue":
        return {"target": "sheep", "grid_size": 8}
        
    elif mode_id == "multiplier_pains":
        return {"items": ["bread", "fish"], "duration": 30}
        
    elif mode_id == "blind_test":
        return {"tracks": [
            {"id": 1, "title": "Grand Dieu nous te bénissons", "options": ["Cantique 1", "Cantique 2", "Grand Dieu nous te bénissons", "Cantique 4"], "answer": 2},
            {"id": 2, "title": "Quel ami fidèle et tendre", "options": ["Quel ami fidèle et tendre", "Cantique 5", "Cantique 6", "Cantique 7"], "answer": 0}
        ]}
        
    elif mode_id == "voyage_paul":
        return {"stops": ["Damas", "Antioche", "Chypre", "Éphèse", "Rome"]}
        
    return {}


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
