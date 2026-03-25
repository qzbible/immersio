import asyncio
import os
import sys
from datetime import datetime, timezone
import uuid
from pathlib import Path

# Add backend to path
sys.path.append(str(Path(__file__).parent.parent))

from database import db
from i18n_content import (
    get_quiz_qui_a_dit, get_quiz_vrai_faux, get_chrono_versets,
    get_anagrammes, get_labyrinthe_questions
)

async def sync_questions():
    print("Syncing questions from i18n_content to DB...")
    
    # 1. Qui a dit
    for lang in ["fr", "en"]:
        res = get_quiz_qui_a_dit(lang)
        for q in res["quotes"]:
            doc = {
                "question_id": f"hc_qad_{uuid.uuid4().hex[:8]}",
                "category": "qui_a_dit",
                "lang": lang,
                "text": q["text"],
                "answer": q["author"],
                "options": q["options"],
                "approved": True,
                "source": "hardcoded",
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            # Avoid direct duplicates by text
            existing = await db.questions.find_one({"text": doc["text"], "lang": lang})
            if not existing:
                await db.questions.insert_one(doc)
                print(f"Added QAD: {doc['text'][:30]}...")

    # 2. Vrai Faux
    for lang in ["fr", "en"]:
        res = get_quiz_vrai_faux(lang)
        for q in res["statements"]:
            doc = {
                "question_id": f"hc_vf_{uuid.uuid4().hex[:8]}",
                "category": "vrai_faux",
                "lang": lang,
                "text": q["text"],
                "answer": 0 if q["answer"] else 1, # 0=Vrai, 1=Faux in my admin UI
                "approved": True,
                "source": "hardcoded",
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            existing = await db.questions.find_one({"text": doc["text"], "lang": lang})
            if not existing:
                await db.questions.insert_one(doc)
                print(f"Added VF: {doc['text'][:30]}...")

    # 3. Chrono Versets
    for lang in ["fr", "en"]:
        res = get_chrono_versets(lang)
        for q in res["verses"]:
            doc = {
                "question_id": f"hc_cv_{uuid.uuid4().hex[:8]}",
                "category": "chrono_versets",
                "lang": lang,
                "text": q["text"],
                "answer": q["missing"],
                "reference": q["reference"],
                "approved": True,
                "source": "hardcoded",
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            existing = await db.questions.find_one({"text": doc["text"], "lang": lang})
            if not existing:
                await db.questions.insert_one(doc)
                print(f"Added CV: {doc['text'][:30]}...")

    # 4. Anagrammes
    for lang in ["fr", "en"]:
        res = get_anagrammes(lang)
        for q in res["anagrams"]:
            doc = {
                "question_id": f"hc_ana_{uuid.uuid4().hex[:8]}",
                "category": "anagrammes",
                "lang": lang,
                "text": q["scrambled"],
                "answer": q["answer"],
                "approved": True,
                "source": "hardcoded",
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            existing = await db.questions.find_one({"text": doc["text"], "lang": lang})
            if not existing:
                await db.questions.insert_one(doc)
                print(f"Added ANA: {doc['text']} -> {doc['answer']}")

    # 5. Migrate from admin_questions to questions
    print("Migrating from admin_questions to questions...")
    cursor = db.admin_questions.find({})
    async for q in cursor:
        q_id = q.get("question_id")
        if q_id:
            existing = await db.questions.find_one({"question_id": q_id})
            if not existing:
                await db.questions.insert_one(q)
                print(f"Migrated admin Q: {q_id}")

    print("Sync complete!")

async def main():
    await sync_questions()

if __name__ == "__main__":
    asyncio.run(main())
