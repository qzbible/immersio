import asyncio
import os
import sys
import uuid
import hashlib
from datetime import datetime, timezone

# Add parent directory to path to allow imports before other local imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from motor.motor_asyncio import AsyncIOMotorClient
from i18n_content import (
    get_quiz_qui_a_dit, get_quiz_vrai_faux, get_chrono_versets,
    get_mots_caches, get_anagrammes, get_labyrinthe_questions
)
from audio_bank import AUDIO_BANK

async def seed():
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017/')
    db_name = os.environ.get('DB_NAME', 'immersio_db')
    
    print(f"Connecting to MongoDB at {mongo_url} (DB: {db_name})...")
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    # 1. Sync Game Modes with Audio
    print("Syncing game modes...")
    game_modes = [
        {
            "mode_id": "quiz_qui_a_dit", 
            "category": "Quiz et Tests", 
            "name": "Qui a dit quoi ?", 
            "description": "Attribuez chaque citation à son auteur biblique", 
            "icon": "💬", 
            "difficulty": "moyen", 
            "duration_minutes": 5, 
            "color": "from-blue-400 to-blue-600", 
            "available": True,
            "bg_music": "/static/audio/calm_quest.wav",
            "sfx_success": "/static/audio/success_bip.wav",
            "sfx_fail": "/static/audio/fail_buzzer.wav",
            "sfx_click": "/static/audio/click_pop.wav"
        },
        {
            "mode_id": "quiz_vrai_faux", 
            "category": "Quiz et Tests", 
            "name": "Vrai ou Faux", 
            "description": "Affirmations rapides sur les miracles et événements", 
            "icon": "✓✗", 
            "difficulty": "facile", 
            "duration_minutes": 3, 
            "color": "from-green-400 to-emerald-600", 
            "available": True,
            "bg_music": "/static/audio/happy_village.wav",
            "sfx_success": "/static/audio/success_bip.wav",
            "sfx_fail": "/static/audio/fail_buzzer.wav",
            "sfx_click": "/static/audio/click_pop.wav"
        },
        {
            "mode_id": "chrono_versets", 
            "category": "Quiz et Tests", 
            "name": "Chrono-Versets", 
            "description": "Complétez un verset le plus vite possible", 
            "icon": "⏱️", 
            "difficulty": "moyen", 
            "duration_minutes": 2, 
            "color": "from-orange-400 to-orange-600", 
            "available": True,
            "bg_music": "/static/audio/mystic_riddle.wav",
            "sfx_success": "/static/audio/success_bip.wav",
            "sfx_fail": "/static/audio/fail_buzzer.wav",
            "sfx_click": "/static/audio/click_pop.wav"
        },
        {
            "mode_id": "mots_caches", 
            "category": "Jeux de Mots", 
            "name": "Mots Cachés Bibliques", 
            "description": "Trouvez les noms cachés", 
            "icon": "🔤", 
            "difficulty": "facile", 
            "duration_minutes": 5, 
            "color": "from-purple-400 to-purple-600", 
            "available": True,
            "bg_music": "/static/audio/calm_quest.wav"
        },
        {
            "mode_id": "anagrammes", 
            "category": "Jeux de Mots", 
            "name": "Anagrammes", 
            "description": "Reconstituez les noms bibliques", 
            "icon": "🔀", 
            "difficulty": "moyen", 
            "duration_minutes": 3, 
            "color": "from-pink-400 to-pink-600", 
            "available": True,
            "bg_music": "/static/audio/epic_battle.wav"
        },
        {
            "mode_id": "labyrinthe_exode", 
            "category": "Logique", 
            "name": "Labyrinthe de l'Exode", 
            "description": "Guidez le peuple vers la Terre Promise", 
            "icon": "🗺️", 
            "difficulty": "moyen", 
            "duration_minutes": 5, 
            "color": "from-amber-400 to-amber-600", 
            "available": True,
            "bg_music": "/static/audio/mystic_riddle.wav"
        },
        {
            "mode_id": "blind_test", 
            "category": "Événements", 
            "name": "Blind Test des Cantiques", 
            "description": "Reconnaissez les hymnes", 
            "icon": "🎵", 
            "difficulty": "moyen", 
            "duration_minutes": 10, 
            "color": "from-cyan-400 to-cyan-600", 
            "available": True
        },
        {
            "mode_id": "voyage_paul", 
            "category": "Aventure", 
            "name": "Le Voyage de Paul", 
            "description": "Suivez les missions de l'apôtre Paul", 
            "icon": "⛵", 
            "difficulty": "difficile", 
            "duration_minutes": 15, 
            "color": "from-violet-400 to-violet-600", 
            "available": True
        }
    ]
    
    for mode in game_modes:
        await db.game_modes.update_one(
            {"mode_id": mode["mode_id"]},
            {
                "$set": {
                    "bg_music": mode.get("bg_music"),
                    "sfx_success": mode.get("sfx_success"),
                    "sfx_fail": mode.get("sfx_fail"),
                    "sfx_click": mode.get("sfx_click"),
                    "available": True
                },
                "$setOnInsert": {
                    "category": mode["category"],
                    "name": mode["name"],
                    "description": mode["description"],
                    "icon": mode["icon"],
                    "difficulty": mode["difficulty"],
                    "duration_minutes": mode["duration_minutes"],
                    "color": mode["color"],
                    "owner_id": "system",
                    "visibility": "public"
                }
            },
            upsert=True
        )
    
    # 2. Sync Hardcoded Questions
    print("Syncing hardcoded questions...")
    # Add alias mappings
    aliases = {
        "qui_a_dit": "quiz_qui_a_dit",
        "vrai_faux": "quiz_vrai_faux",
        "labyrinthe": "labyrinthe_exode"
    }

    # Helper for syncing
    async def sync_cat(cat_id, lang, data_list, text_key, ans_key, opt_key=None, ref_key=None):
        for q in data_list:
            await db.questions.update_one(
                {"text": q[text_key], "lang": lang, "category": cat_id},
                {"$setOnInsert": {
                    "question_id": f"sq_{uuid.uuid4().hex[:12]}",
                    "category": cat_id,
                    "lang": lang,
                    "text": q[text_key],
                    "answer": q[ans_key],
                    "options": q.get(opt_key) if opt_key else None,
                    "reference": q.get(ref_key, "") if ref_key else "",
                    "approved": True,
                    "source": "hardcoded",
                    "owner_id": "system",
                    "visibility": "public",
                    "created_at": datetime.now(timezone.utc).isoformat()
                }},
                upsert=True
            )

    for lang in ["fr", "en"]:
        # Qui a dit
        data = get_quiz_qui_a_dit(lang)["quotes"]
        await sync_cat("quiz_qui_a_dit", lang, data, "text", "author", "options")
        
        # Vrai/Faux
        data = get_quiz_vrai_faux(lang)["statements"]
        await sync_cat("quiz_vrai_faux", lang, data, "text", "answer")
        
        # Chrono
        data = get_chrono_versets(lang)["verses"]
        await sync_cat("chrono_versets", lang, data, "text", "missing", None, "reference")
        
        # Anagrammes
        data = get_anagrammes(lang)["anagrams"]
        await sync_cat("anagrammes", lang, data, "scrambled", "answer")
        
        # Labyrinthe
        data = get_labyrinthe_questions(lang)
        await sync_cat("labyrinthe_exode", lang, data, "text", "answer", "options")

    # 3. Seed Badges & Achievements
    print("Seeding badges & achievements...")
    badges = [
        {"badge_id": "badge_neophyte", "name": "Néophyte", "icon": "🌱", "description": "Finish first 5 lessons", "condition_type": "lessons_completed", "condition_value": 5},
        {"badge_id": "badge_berger", "name": "Berger", "icon": "🐑", "description": "Reach level 10", "condition_type": "level", "condition_value": 10},
        {"badge_id": "badge_levite", "name": "Lévite", "icon": "📜", "description": "Reach level 25", "condition_type": "level", "condition_value": 25},
        {"badge_id": "badge_apotre", "name": "Apôtre", "icon": "⭐", "description": "Reach level 50", "condition_type": "level", "condition_value": 50},
        {"badge_id": "badge_polyglotte", "name": "Polyglotte Biblique", "icon": "🌍", "description": "Play 5+ games in FR and EN", "condition_type": "polyglot", "condition_value": 5},
    ]
    for b in badges:
        await db.badges.update_one({"badge_id": b["badge_id"]}, {"$set": b}, upsert=True)

    achievements = [
        {"achievement_id": "ach_first_game", "name": "Premier Pas", "icon": "🎮", "description": "Play your first game", "condition_type": "games_played", "condition_value": 1, "category": "general", "xp_reward": 50},
        {"achievement_id": "ach_10_games", "name": "Joueur Régulier", "icon": "🎯", "description": "Play 10 games", "condition_type": "games_played", "condition_value": 10, "category": "general", "xp_reward": 100},
        {"achievement_id": "ach_50_games", "name": "Vétéran", "icon": "🏆", "description": "Play 50 games", "condition_type": "games_played", "condition_value": 50, "category": "general", "xp_reward": 500},
        {"achievement_id": "ach_level_5", "name": "Disciple Dévoué", "icon": "⭐", "description": "Reach level 5", "condition_type": "level", "condition_value": 5, "category": "progression", "xp_reward": 100},
        {"achievement_id": "ach_level_15", "name": "Serviteur Fidèle", "icon": "✨", "description": "Reach level 15", "condition_type": "level", "condition_value": 15, "category": "progression", "xp_reward": 300},
        {"achievement_id": "badge_premier_duel", "name": "Premier Duel", "icon": "⚔️", "description": "Complete your first duel", "condition_type": "duo_played", "condition_value": 1, "category": "duo", "xp_reward": 100},
    ]
    for a in achievements:
        await db.achievements.update_one({"achievement_id": a["achievement_id"]}, {"$set": a}, upsert=True)

    # 4. Seed Staff Account
    print("Seeding staff account...")
    staff_email = "klivarcloud@gmail.com"
    staff_pass = "!Klivardev1"
    hashed_pass = hashlib.sha256(staff_pass.encode()).hexdigest()
    
    await db.users.update_one(
        {"email": staff_email},
        {
            "$setOnInsert": {
                "user_id": f"staff_{uuid.uuid4().hex[:12]}",
                "email": staff_email,
                "name": "Klivar Cloud",
                "password": hashed_pass,
                "is_admin": True,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
        },
        upsert=True
    )

    print("Success: Database initialized and synced.")

if __name__ == "__main__":
    import asyncio
    import sys
    # Add parent directory to path to allow imports
    sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    asyncio.run(seed())
