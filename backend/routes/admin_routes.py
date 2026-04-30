from fastapi import APIRouter, Request, Header, HTTPException, Depends, File, UploadFile
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from dotenv import load_dotenv
from openai import AsyncOpenAI
import pypdf
import docx
from pptx import Presentation
import io
import os
import uuid

from database import db
from auth import get_admin_user, get_current_user, get_user_org_ids
from models import (
    GenerateQuestionsRequest, SaveQuestionRequest, GameMode, AdminQuestion, 
    OrgRole, Invitation, InvitationStatus, OrgMember,
    CertificationExam, ExamQuestion
)
import pandas as pd
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
            "Exemple: [{{ \"text\": \"Jésus a changé l'eau en vin\", \"answer\": true, \"reference\": \"Jean 2:9\" }}]"
        ),
        "en": (
            "You are a Bible expert. Generate {n} biblical TRUE or FALSE statements in ENGLISH about '{topic}'. "
            "Each item must have: 'text' (the statement), 'answer' (true or false), 'reference' (optional Bible verse). "
            "Alternate between true and false statements. Be precise and factual. "
            "Reply ONLY with a valid JSON array, no markdown. "
            "Example: [{{ \"text\": \"Jesus turned water into wine\", \"answer\": true, \"reference\": \"John 2:9\" }}]"
        ),
    },
    "qui_a_dit": {
        "fr": (
            "Tu es un expert en Bible. Génère {n} questions 'Qui a dit ?' en FRANÇAIS sur le thème '{topic}'. "
            "Chaque item doit avoir : 'text' (la citation biblique), 'author' (la bonne réponse), "
            "'options' (array de 4 noms dont l'auteur correct), 'reference' (verset optionnel). "
            "Réponds UNIQUEMENT avec un JSON array valide. "
            "Exemple: [{{ \"text\": \"Je suis le chemin\", \"author\": \"Jésus\", \"options\": [\"Pierre\", \"Jésus\", \"Paul\", \"Jean\"], \"reference\": \"Jean 14:6\" }}]"
        ),
        "en": (
            "You are a Bible expert. Generate {n} 'Who said it?' questions in ENGLISH about '{topic}'. "
            "Each item must have: 'text' (the biblical quote), 'author' (correct answer), "
            "'options' (array of 4 names including the author), 'reference' (optional verse). "
            "Reply ONLY with a valid JSON array. "
            "Example: [{{ \"text\": \"I am the way\", \"author\": \"Jesus\", \"options\": [\"Peter\", \"Jesus\", \"Paul\", \"John\"], \"reference\": \"John 14:6\" }}]"
        ),
    },
    "chrono_versets": {
        "fr": (
            "Tu es un expert en Bible. Génère {n} exercices 'Complétez le verset' en FRANÇAIS sur le thème '{topic}'. "
            "Chaque item doit avoir : 'text' (le verset avec le mot manquant remplacé par '___'), "
            "'missing' (le mot exact à trouver), 'reference' (référence biblique). "
            "Réponds UNIQUEMENT avec un JSON array valide. "
            "Exemple: [{{ \"text\": \"Car Dieu a tant ___ le monde\", \"missing\": \"aimé\", \"reference\": \"Jean 3:16\" }}]"
        ),
        "en": (
            "You are a Bible expert. Generate {n} 'Complete the verse' exercises in ENGLISH about '{topic}'. "
            "Each item must have: 'text' (the verse with missing word replaced by '___'), "
            "'missing' (the exact word), 'reference' (Bible reference). "
            "Reply ONLY with a valid JSON array. "
            "Example: [{{ \"text\": \"For God so ___ the world\", \"missing\": \"loved\", \"reference\": \"John 3:16\" }}]"
        ),
    },
    "anagrammes": {
        "fr": (
            "Tu es un expert en Bible. Génère {n} anagrammes de personnages ou lieux bibliques en FRANÇAIS sur le thème '{topic}'. "
            "Chaque item doit avoir : 'word' (le mot mélangé), 'answer' (le mot original), 'hint' (un indice court). "
            "Mélange bien les lettres ! "
            "Réponds UNIQUEMENT avec un JSON array valide. "
            "Exemple: [{{ \"word\": \"SEUJ\", \"answer\": \"JÉSUS\", \"hint\": \"Fils de Dieu\" }}]"
        ),
        "en": (
            "You are a Bible expert. Generate {n} anagrams of biblical characters or places in ENGLISH about '{topic}'. "
            "Each item must have: 'word' (scrambled word), 'answer' (original word), 'hint' (short clue). "
            "Mix the letters well! "
            "Reply ONLY with a valid JSON array. "
            "Example: [{{ \"word\": \"SSUEJ\", \"answer\": \"JESUS\", \"hint\": \"Son of God\" }}]"
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
        # Check if it returned a single object instead of an array
        start_obj = text.find("{")
        end_obj = text.rfind("}")
        if start_obj != -1 and end_obj != -1:
             return [json.loads(text[start_obj:end_obj + 1])]
        raise ValueError("No JSON array or object found in response")
    return json.loads(text[start:end + 1])


def _normalize_question(item: dict, category: str, lang: str) -> dict:
    """Normalize AI response to a consistent format."""
    base = {
        "question_id": item.get("question_id") or f"aq_{uuid.uuid4().hex[:12]}",
        "lang": lang or item.get("lang", "fr"),
        "difficulty": item.get("difficulty", "moyen"),
        "reference": item.get("reference", ""),
        "approved": item.get("approved", True),
        "source": item.get("source", "ai"),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "tags": item.get("tags", []),
        "type": item.get("type", "single_choice"),
        "score": item.get("score", 10),
    }

    # Internal type mapping or inferred from category if needed
    q_type = base["type"]
    if q_type == "true_false":
        answer = item.get("answer", False)
        if isinstance(answer, str):
            answer = answer.lower() in ("true", "vrai", "oui", "yes")
        base.update({"text": item.get("text", ""), "answer": answer, "options": None, "type": "true_false"})
        if "Vrai/Faux" not in base["tags"]: base["tags"].append("Vrai/Faux")

    elif q_type == "qui_a_dit":
        base.update({
            "text": item.get("text", ""),
            "answer": item.get("author") or item.get("answer"),
            "options": item.get("options", []),
            "type": "qui_a_dit"
        })
        if "Qui a dit" not in base["tags"]: base["tags"].append("Qui a dit")

    elif q_type == "chrono_versets":
        base.update({
            "text": item.get("text", ""),
            "answer": item.get("missing") or item.get("answer"),
            "options": None,
            "type": "chrono_versets"
        })
        if "Verset à trous" not in base["tags"]: base["tags"].append("Verset à trous")

    elif q_type in ("single_choice", "multiple_choice"):
        base.update({
            "text": item.get("text", ""),
            "answer": item.get("answer"),
            "options": item.get("options", []),
        })

    elif category == "anagrammes":
        base.update({
            "text": item.get("word", ""),
            "answer": item.get("answer", ""),
            "options": [item.get("hint", "")],
        })
        if "Anagramme" not in base["tags"]: base["tags"].append("Anagramme")

    return base


def extract_text_from_file(file_content: bytes, filename: str) -> str:
    ext = filename.split('.')[-1].lower()
    text = ""
    
    if ext == 'pdf':
        reader = pypdf.PdfReader(io.BytesIO(file_content))
        for page in reader.pages:
            text += page.extract_text() + "\n"
            
    elif ext == 'docx':
        doc = docx.Document(io.BytesIO(file_content))
        for para in doc.paragraphs:
            text += para.text + "\n"
            
    elif ext == 'pptx':
        prs = Presentation(io.BytesIO(file_content))
        for slide in prs.slides:
            for shape in slide.shapes:
                if hasattr(shape, "text"):
                    text += shape.text + "\n"
                    
    elif ext in ['txt', 'md']:
        text = file_content.decode('utf-8', errors='ignore')
        
    return text.strip()


@router.post("/upload-context")
async def upload_context(
    file: UploadFile = File(...),
    request: Request = None,
    authorization: Optional[str] = Header(None)
):
    await get_admin_user(request, authorization)
    content = await file.read()
    text = extract_text_from_file(content, file.filename)
    
    if not text:
        raise HTTPException(status_code=400, detail="Impossible d'extraire du texte de ce fichier.")
        
    # Return first 5000 chars to avoid overwhelming the frontend, 
    # but the frontend will send what it needs.
    return {"text": text[:10000], "filename": file.filename}


# ── Check if current user is admin ──────────────────────────────────
@router.get("/me")
async def admin_check(request: Request, authorization: Optional[str] = Header(None)):
    user = await get_admin_user(request, authorization)
    return {"is_admin": True, "email": user.email, "name": user.name}


async def get_org_context(
    request: Request,
    authorization: Optional[str] = Header(None),
    x_org_id: Optional[str] = Header(None, alias="X-Org-Id")
) -> str:
    """
    Returns the effective owner_id for the current operation.
    - If X-Org-Id is 'system': returns 'system' (requires platform admin).
    - If X-Org-Id is 'personal' or missing: returns user.user_id.
    - If X-Org-Id is an org_id: returns that org_id (requires org owner/admin).
    """
    user = await get_current_user(request, authorization)
    
    # 1. System Admin overwrite / Platform check
    admin_emails = [e.strip().lower() for e in os.environ.get("ADMIN_EMAILS", "").split(",") if e.strip()]
    is_platform_admin = user.is_admin or (user.email.lower() in admin_emails)
    
    if x_org_id == "system":
        if request.method != "GET" and not is_platform_admin:
            # If not platform admin, they CANNOT save to system.
            # But the user might have an organization they own.
            # Let's find their first organization where they are owner.
            user_orgs = await db.organizations.find({"members.user_id": user.user_id, "members.role": "owner"}).to_list(1)
            if user_orgs:
                return user_orgs[0]["org_id"]
            raise HTTPException(status_code=403, detail="Accès modification plateforme requis (Staff uniquement)")
        return "system"
    
    if not x_org_id or x_org_id == "personal":
        return user.user_id # Personal workspace
    
    # Otherwise, it must be an Org-Id
    org_doc = await db.organizations.find_one({"org_id": x_org_id})
    if not org_doc:
        if is_platform_admin:
            return "system" # Fallback for system admins
        raise HTTPException(status_code=404, detail="Organisation non trouvée")
    
    member = next((m for m in org_doc.get("members", []) if m["user_id"] == user.user_id), None)
    if not member or member["role"] != "owner":
        if not is_platform_admin:
            raise HTTPException(status_code=403, detail="Vous n'êtes pas propriétaire de cette organisation")
    
    return x_org_id


# ── Generate questions with GPT-4o ───────────────────────────────────
@router.post("/generate")
async def generate_questions(
    gen_req: GenerateQuestionsRequest,
    request: Request,
    authorization: Optional[str] = Header(None),
):
    await get_admin_user(request, authorization)
    
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=400, 
            detail="OPENAI_API_KEY manquante dans le fichier .env. Impossible de générer des questions."
        )

    client = AsyncOpenAI(api_key=api_key)
    
    prompt_type = gen_req.type
    lang = gen_req.lang if gen_req.lang != "both" else "fr"
    topic = gen_req.topic or "la Bible"
    n = gen_req.num_questions

    prompt_template = PROMPTS.get(prompt_type, {}).get(lang)
    if not prompt_template:
        # Fallback to general if not found or use a default
        prompt_template = PROMPTS.get("vrai_faux", {}).get(lang)
    
    full_prompt = prompt_template.format(n=n, topic=topic)
    
    system_content = "Tu es un assistant expert en théologie et en pédagogie biblique."
    if gen_req.context_text:
        system_content += f"\n\nCONTEXTE FOURNI PAR L'UTILISATEUR :\n{gen_req.context_text}\n\nUtilise ce contexte en priorité pour générer les questions."

    # Enhance the prompt to ask for tags, type and score
    full_prompt += (
        "\nIMPORTANT : Chaque objet JSON doit AUSSI inclure :"
        "\n- 'type': 'single_choice' ou 'multiple_choice' ou 'true_false'"
        "\n- 'tags': un array de strings (ex: ['Nouveau Testament', 'Paraboles'])"
        "\n- 'score': un entier entre 5 et 20 selon la difficulté."
        "\nPour 'multiple_choice', 'answer' doit être un array d'index (ex: [0, 2])."
    )

    try:
        response = await client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_content},
                {"role": "user", "content": full_prompt}
            ],
            response_format={"type": "json_object"} if "JSON" in full_prompt else None
        )
        
        raw_content = response.choices[0].message.content
        items = _parse_json_response(raw_content)
        
        normalized = [_normalize_question(it, category, lang) for it in items]
        return normalized

    except Exception as e:
        error_str = str(e)
        if "insufficient_quota" in error_str:
            raise HTTPException(
                status_code=402, 
                detail="Quota OpenAI épuisé. Veuillez vérifier votre solde sur platform.openai.com."
            )
        print(f"AI Generation Error: {error_str}")
        raise HTTPException(status_code=500, detail=f"Erreur lors de la génération IA: {error_str}")


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
    owner_id: str = Depends(get_org_context)
):
    # User feedback: Orgs only want to see their own created questions
    # Platform staff (owner_id == 'system') see everything.
    if owner_id == "system":
        query = {"$or": [{"owner_id": "system"}, {"owner_id": {"$exists": True}}]}
    else:
        query = {"owner_id": owner_id}

    if category:
        # Category is now a TAG filter
        query["tags"] = {"$in": [category]}
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


# (Eliminated redundant /modes routes previously here)
async def sync_mode_questions_by_tags(
    mode_id: str,
    tags: List[str],
    owner_id: str = Depends(get_org_context)
):
    """Find all questions matching tags and add to the mode."""
    # We find questions in the Org OR System
    query = {
        "tags": {"$in": tags},
        "$or": [{"owner_id": owner_id}, {"owner_id": "system"}]
    }
    questions = await db.questions.find(query, {"question_id": 1}).to_list(500)
    q_ids = [q["question_id"] for q in questions]
    
    await db.game_modes.update_one(
        {"mode_id": mode_id, "owner_id": owner_id},
        {"$set": {"question_ids": q_ids}}
    )
    return {"synced": len(q_ids)}
@router.post("/questions")
async def create_single_question(
    q: AdminQuestion,
    owner_id: str = Depends(get_org_context)
):
    doc = q.model_dump()
    if not doc.get("question_id"):
        doc["question_id"] = f"mq_{uuid.uuid4().hex[:12]}"
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    doc["owner_id"] = owner_id
    doc["visibility"] = "public" if owner_id == "system" else "private"
    await db.questions.insert_one(doc)
    doc.pop("_id", None)
    return doc


@router.patch("/questions/{question_id}")
async def update_question(
    question_id: str,
    data: Dict[str, Any],
    owner_id: str = Depends(get_org_context)
):
    # Ensure the question belongs to this owner_id
    q_doc = await db.questions.find_one({"question_id": question_id, "owner_id": owner_id})
    if not q_doc:
        raise HTTPException(status_code=403, detail="Vous n'avez pas la permission de modifier cette question")
    
    # Filter out None/empty question_id if sent
    data.pop("question_id", None)
    data.pop("owner_id", None) # Protect ownership
    
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
    owner_id: str = Depends(get_org_context),
    request: Request = None
):
    body = await request.json()
    questions = body.get("questions", [])
    if not questions:
        raise HTTPException(status_code=400, detail="Aucune question fournie")

    saved = 0
    for q in questions:
        if not q.get("question_id"):
            q["question_id"] = f"aq_{uuid.uuid4().hex[:12]}"
        q["owner_id"] = owner_id
        q["visibility"] = "public" if owner_id == "system" else "private"
        
        # Strip potential IDs to force a new one or use provided
        qid = q.get("question_id") or f"aq_{uuid.uuid4().hex[:12]}"
        
        await db.questions.update_one(
            {"question_id": qid},
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
    owner_id: str = Depends(get_org_context)
):
    result = await db.questions.delete_one({"question_id": question_id, "owner_id": owner_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Question non trouvée")
    return {"message": "Question supprimée"}


@router.post("/questions/{question_id}/fork")
async def fork_question(
    question_id: str,
    owner_id: str = Depends(get_org_context)
):
    """Duplicates a question into the current workspace context."""
    # Note: get_org_context already verified that 'owner_id' is owned by the caller 
    # (or they are system admin).
    
    source = await db.questions.find_one({"question_id": question_id})
    if not source:
        raise HTTPException(status_code=404, detail="Question source non trouvée")
    
    # Check if a fork already exists in this workspace to avoid exact duplicates
    # (Optional: we can just create a new one with a new ID)
    
    new_doc = source.copy()
    new_doc.pop("_id", None)
    new_doc["question_id"] = f"fork_{uuid.uuid4().hex[:12]}"
    new_doc["owner_id"] = owner_id
    new_doc["visibility"] = "private" if owner_id != "system" else "public"
    new_doc["created_at"] = datetime.now(timezone.utc).isoformat()
    # Mark as a fork
    new_doc["forked_from"] = question_id
    
    await db.questions.insert_one(new_doc)
    new_doc.pop("_id", None)
    return new_doc


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
                    "tags": ["Qui a dit", "Staff"],
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
@router.get("/tags")
async def get_all_tags(
    owner_id: str = Depends(get_org_context)
):
    """Fetch all unique tags used in the organization or system."""
    tags = await db.questions.distinct("tags", {"$or": [{"owner_id": owner_id}, {"owner_id": "system"}]})
    return sorted(tags)

    # 2. Vrai/Faux
    for lang in ["fr", "en"]:
        data = get_quiz_vrai_faux(lang)["statements"]
        for q in data:
            await db.questions.update_one(
                {"text": q["text"], "lang": lang},
                {"$setOnInsert": {
                    "question_id": f"sq_{uuid.uuid4().hex[:12]}",
                    "tags": ["Vrai/Faux", "Staff"],
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
                    "tags": ["Verset", "Staff"],
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
                    "tags": ["Anagramme", "Staff"],
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
                    "tags": ["Labyrinthe", "Exode", "Staff"],
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
async def admin_game_modes(owner_id: str = Depends(get_org_context)):
    query = {"$or": [{"owner_id": owner_id}, {"owner_id": "system"}]}
    modes = await db.game_modes.find(query, {"_id": 0}).to_list(100)
    return modes


@router.get("/game-modes/{mode_id}")
async def admin_get_game_mode(mode_id: str, owner_id: str = Depends(get_org_context)):
    """Fetch a single game mode (includes audio config fields)."""
    mode = await db.game_modes.find_one({
        "mode_id": mode_id, 
        "$or": [{"owner_id": owner_id}, {"owner_id": "system"}]
    }, {"_id": 0})
    if not mode:
        raise HTTPException(status_code=404, detail="Mode non trouvé ou accès refusé")
    return mode


@router.post("/game-modes")
async def create_game_mode(
    mode: GameMode,
    request: Request,
    authorization: Optional[str] = Header(None),
    x_org_id: Optional[str] = Header(None, alias="X-Org-Id")
):
    """Only platform staff (system context) can create new game mode templates."""
    user = await get_current_user(request, authorization)
    admin_emails = [e.strip().lower() for e in os.environ.get("ADMIN_EMAILS", "").split(",") if e.strip()]
    is_platform_admin = user.is_admin or (user.email.lower() in admin_emails)

    if not is_platform_admin:
        raise HTTPException(
            status_code=403,
            detail="Seul le staff peut créer de nouveaux modes. Utilisez 'Dupliquer' pour personnaliser un mode existant."
        )

    existing = await db.game_modes.find_one({"mode_id": mode.mode_id, "owner_id": "system"})
    if existing:
        raise HTTPException(status_code=400, detail="Identifiant de mode déjà utilisé")

    doc = mode.model_dump()
    doc["owner_id"] = "system"
    doc["visibility"] = "public"
    await db.game_modes.insert_one(doc)
    doc.pop("_id", None)
    return doc


@router.patch("/game-modes/{mode_id}")
async def update_game_mode(
    mode_id: str,
    data: Dict[str, Any],
    owner_id: str = Depends(get_org_context)
):
    # Security: Org owners cannot modify system modes
    existing = await db.game_modes.find_one({"mode_id": mode_id})
    if existing and existing.get("owner_id") == "system" and owner_id != "system":
        raise HTTPException(
            status_code=403, 
            detail="Impossible de modifier un modèle système. Veuillez le dupliquer pour le personnaliser."
        )

    res = await db.game_modes.update_one({"mode_id": mode_id, "owner_id": owner_id}, {"$set": data})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Mode non trouvé ou accès refusé")
    return {"status": "ok"}


@router.post("/game-modes/{mode_id}/sync-by-tags")
async def sync_game_mode_tags(
    mode_id: str,
    sync_tags: List[str],
    owner_id: str = Depends(get_org_context)
):
    """Sync questions into a game mode based on a list of tags."""
    # Find all questions with these tags (and from allowed owners)
    query = {
        "tags": {"$in": sync_tags},
        "$or": [{"owner_id": owner_id}, {"owner_id": "system"}]
    }
    questions = await db.questions.find(query, {"question_id": 1}).to_list(1000)
    q_ids = [q["question_id"] for q in questions]
    
    await db.game_modes.update_one(
        {"mode_id": mode_id, "owner_id": owner_id},
        {"$set": {"selectedQuestions": q_ids}}
    )
    return {"count": len(q_ids)}


@router.delete("/game-modes/{mode_id}")
async def delete_game_mode(mode_id: str, owner_id: str = Depends(get_org_context)):
    res = await db.game_modes.delete_one({"mode_id": mode_id, "owner_id": owner_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Mode non trouvé ou accès refusé")
    return {"message": "Mode supprimé"}


@router.post("/game-modes/{mode_id}/fork")
async def fork_game_mode(
    mode_id: str,
    owner_id: str = Depends(get_org_context)
):
    """Duplicates a game mode (the template) into the current workspace context."""
    source = await db.game_modes.find_one({"mode_id": mode_id})
    if not source:
        raise HTTPException(status_code=404, detail="Mode source non trouvé")
    
    new_doc = source.copy()
    new_doc.pop("_id", None)
    # We might need to change the mode_id if it conflicts, 
    # but Orgs can have their own version of 'quiz_vrai_faux' if we filter by owner.
    # However, to avoid confusion in routing, let's prefix it.
    new_doc["mode_id"] = f"{owner_id}_{mode_id}"
    new_doc["owner_id"] = owner_id
    new_doc["visibility"] = "private" if owner_id != "system" else "public"
    new_doc["forked_from"] = mode_id
    
    # Check if already exists
    existing = await db.game_modes.find_one({"mode_id": new_doc["mode_id"]})
    if existing:
         raise HTTPException(status_code=400, detail="Ce mode a déjà été dupliqué dans cet espace")

    await db.game_modes.insert_one(new_doc)
    new_doc.pop("_id", None)
    return new_doc


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


# ── Invitation System ──────────────────────────────────────────────────────
@router.post("/orgs/{org_id}/invite")
async def invite_to_org(
    org_id: str,
    body: Dict[str, Any],
    request: Request,
    authorization: Optional[str] = Header(None),
):
    """
    Invite a user to an organization.
    - If user found by email/name: add directly as member.
    - Otherwise: create pending invite (email would be sent in production).
    Only org owners can invite.
    """
    inviter = await get_current_user(request, authorization)

    org_doc = await db.organizations.find_one({"org_id": org_id})
    if not org_doc:
        raise HTTPException(status_code=404, detail="Organisation non trouvée")

    admin_emails = [e.strip().lower() for e in os.environ.get("ADMIN_EMAILS", "").split(",") if e.strip()]
    is_platform_admin = inviter.is_admin or (inviter.email.lower() in admin_emails)
    member = next((m for m in org_doc.get("members", []) if m["user_id"] == inviter.user_id), None)
    if not member or member["role"] != "owner":
        if not is_platform_admin:
            raise HTTPException(status_code=403, detail="Seul le propriétaire peut inviter des membres")

    invitee_email = body.get("email", "").strip().lower()
    invitee_username = body.get("username", "").strip()
    if not invitee_email and not invitee_username:
        raise HTTPException(status_code=400, detail="Email ou nom d'utilisateur requis")

    # Try to find existing user
    query_filters = []
    if invitee_email:
        query_filters.append({"email": invitee_email})
    if invitee_username:
        query_filters.append({"name": invitee_username})
    invitee_doc = await db.users.find_one({"$or": query_filters}) if query_filters else None

    now = datetime.now(timezone.utc).isoformat()
    invitation_id = f"inv_{uuid.uuid4().hex[:12]}"
    effective_email = invitee_email or (invitee_doc["email"] if invitee_doc else invitee_username)

    if invitee_doc:
        invitee_id = invitee_doc["user_id"]
        already = next((m for m in org_doc.get("members", []) if m["user_id"] == invitee_id), None)
        if already:
            raise HTTPException(status_code=400, detail="Cet utilisateur est déjà membre de l'organisation")

        # Add directly as member
        await db.organizations.update_one(
            {"org_id": org_id},
            {"$push": {"members": {
                "user_id": invitee_id,
                "role": "member",
                "joined_at": now
            }}}
        )
        status = "accepted"
    else:
        invitee_id = None
        status = "pending"

    invite_doc = {
        "invitation_id": invitation_id,
        "org_id": org_id,
        "org_name": org_doc["name"],
        "inviter_id": inviter.user_id,
        "inviter_name": inviter.name,
        "invitee_email": effective_email,
        "invitee_id": invitee_id,
        "role": "member",
        "status": status,
        "created_at": now,
    }
    await db.invitations.insert_one(invite_doc)
    invite_doc.pop("_id", None)

    msg = "Membre ajouté directement" if invitee_doc else "Invitation créée – en attente d'inscription"
    return {"message": msg, "invitation": invite_doc}


@router.get("/invitations")
async def list_my_invitations(
    request: Request,
    authorization: Optional[str] = Header(None),
):
    """List pending invitations for the current user (matched by email)."""
    user = await get_current_user(request, authorization)
    invites = await db.invitations.find(
        {"invitee_email": user.email.lower(), "status": "pending"},
        {"_id": 0}
    ).to_list(50)
    return invites


@router.post("/invitations/{invitation_id}/accept")
async def accept_invitation(
    invitation_id: str,
    request: Request,
    authorization: Optional[str] = Header(None),
):
    """Accept a pending invitation and join the org."""
    user = await get_current_user(request, authorization)

    invite = await db.invitations.find_one({"invitation_id": invitation_id}, {"_id": 0})
    if not invite:
        raise HTTPException(status_code=404, detail="Invitation non trouvée")
    if invite["invitee_email"].lower() != user.email.lower():
        raise HTTPException(status_code=403, detail="Cette invitation ne vous appartient pas")
    if invite["status"] != "pending":
        raise HTTPException(status_code=400, detail=f"Invitation déjà {invite['status']}")

    now = datetime.now(timezone.utc).isoformat()
    await db.organizations.update_one(
        {"org_id": invite["org_id"]},
        {"$push": {"members": {
            "user_id": user.user_id,
            "role": invite["role"],
            "joined_at": now
        }}}
    )
    await db.invitations.update_one(
        {"invitation_id": invitation_id},
        {"$set": {"status": "accepted", "invitee_id": user.user_id}}
    )
    return {"message": "Invitation acceptée", "org_id": invite["org_id"]}


@router.post("/invitations/{invitation_id}/decline")
async def decline_invitation(
    invitation_id: str,
    request: Request,
    authorization: Optional[str] = Header(None),
):
    """Decline a pending invitation."""
    user = await get_current_user(request, authorization)

    invite = await db.invitations.find_one({"invitation_id": invitation_id}, {"_id": 0})
    if not invite:
        raise HTTPException(status_code=404, detail="Invitation non trouvée")
    if invite["invitee_email"].lower() != user.email.lower():
        raise HTTPException(status_code=403, detail="Cette invitation ne vous appartient pas")
    if invite["status"] != "pending":
        raise HTTPException(status_code=400, detail=f"Invitation déjà {invite['status']}")

    await db.invitations.update_one(
        {"invitation_id": invitation_id},
        {"$set": {"status": "declined"}}
    )
    return {"message": "Invitation déclinée"}


# ── Exam Management (New System) ──────────────────────────────────────

@router.get("/exams/org-context")
async def get_exam_org_context(owner_id: str = Depends(get_org_context)):
    return {"owner_id": owner_id}

@router.post("/exams/import")
async def import_exam_excel(
    file: UploadFile = File(...),
    request: Request = None,
    authorization: Optional[str] = Header(None),
    owner_id: str = Depends(get_org_context)
):
    await get_admin_user(request, authorization)
    content = await file.read()
    
    try:
        df = pd.read_excel(io.BytesIO(content))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erreur de lecture du fichier Excel: {str(e)}")

    # Check required columns
    required_cols = ["QUIZ", "EXAM ID", "TYPE", "QUESTION", "ANSWER"]
    missing = [c for c in required_cols if c not in df.columns]
    if missing:
        raise HTTPException(status_code=400, detail=f"Colonnes manquantes : {', '.join(missing)}")

    # Process Exams
    exams_data = {} # exam_id -> {exam_info, questions[]}
    
    for _, row in df.iterrows():
        exam_id = str(row["EXAM ID"]).strip()
        if not exam_id or exam_id == "nan":
            continue
            
        if exam_id not in exams_data:
            exams_data[exam_id] = {
                "exam_info": {
                    "exam_id": exam_id,
                    "name": str(row["QUIZ"]).strip(),
                    "category": str(row.get("CATEGORY", "Général")).strip(),
                    "subcategory": str(row.get("SUBCATEGORY", "")).strip(),
                    "level": str(row.get("LEVEL", "moyen")).strip(),
                    "owner_id": owner_id,
                    "created_at": datetime.now(timezone.utc).isoformat(),
                    "is_published": False,
                    "question_count": 0
                },
                "questions": []
            }
        
        # Map Question
        q_type_raw = str(row["TYPE"]).lower().strip()
        q_type = "single_choice"
        if "qcm" in q_type_raw:
            q_type = "single_choice"
        elif "vf" in q_type_raw or "vrai" in q_type_raw:
            q_type = "true_false"
        elif "short" in q_type_raw or "mot" in q_type_raw:
            q_type = "short_answer"
        elif "multiple" in q_type_raw:
            q_type = "multiple_choice"

        # Choices
        choices_raw = str(row.get("CHOICES", "")).strip()
        options = None
        if choices_raw and choices_raw != "nan":
            options = [c.strip() for c in choices_raw.split("|")]

        # Answer
        answer_raw = str(row["ANSWER"]).strip()
        answer = answer_raw
        if q_type == "true_false":
            answer = answer_raw.lower() in ("vrai", "true", "1", "yes", "oui")
        elif q_type in ("single_choice", "multiple_choice") and options:
            if q_type == "single_choice":
                try:
                    # Try to find the index of the answer in options
                    answer = options.index(answer_raw)
                except ValueError:
                    # If not found exactly, keep as string or try index
                    if answer_raw.isdigit():
                        answer = int(answer_raw)
            else: # multiple_choice
                answers_list = [a.strip() for a in answer_raw.split("|")]
                answer = []
                for a in answers_list:
                    try:
                        answer.append(options.index(a))
                    except ValueError:
                        if a.isdigit():
                            answer.append(int(a))
        elif q_type == "short_answer":
            answer = answer_raw

        q_id = f"eq_{uuid.uuid4().hex[:12]}"
        question = {
            "question_id": q_id,
            "exam_id": exam_id,
            "type": q_type,
            "text": str(row["QUESTION"]).strip(),
            "options": options,
            "answer": answer,
            "explanation": str(row.get("EXPLANATION", "")).strip() if str(row.get("EXPLANATION", "")) != "nan" else "",
            "difficulty": str(row.get("LEVEL", "moyen")).strip(),
            "owner_id": owner_id,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        exams_data[exam_id]["questions"].append(question)
        exams_data[exam_id]["exam_info"]["question_count"] += 1

    # Save to DB
    saved_exams = 0
    saved_questions = 0
    
    for exam_id, data in exams_data.items():
        # Update or Insert Exam
        await db.exams.update_one(
            {"exam_id": exam_id, "owner_id": owner_id},
            {"$set": data["exam_info"]},
            upsert=True
        )
        await db.exam_questions.delete_many({"exam_id": exam_id, "owner_id": owner_id})
        if data["questions"]:
            await db.exam_questions.insert_many(data["questions"])
        
        saved_exams += 1
        saved_questions += len(data["questions"])

    return {
        "status": "success",
        "exams_imported": saved_exams,
        "questions_imported": saved_questions,
        "message": f"Import réussi : {saved_exams} examens et {saved_questions} questions."
    }


@router.get("/exams")
async def list_exams(owner_id: str = Depends(get_org_context)):
    exams = await db.exams.find({"owner_id": owner_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return exams


@router.patch("/exams/{exam_id}/publish")
async def publish_exam(
    exam_id: str,
    body: Dict[str, bool],
    owner_id: str = Depends(get_org_context)
):
    is_published = body.get("is_published", True)
    result = await db.exams.update_one(
        {"exam_id": exam_id, "owner_id": owner_id},
        {"$set": {"is_published": is_published}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Examen non trouvé")
    return {"exam_id": exam_id, "is_published": is_published}


@router.get("/exams/{exam_id}/questions")
async def list_exam_questions(
    exam_id: str,
    owner_id: str = Depends(get_org_context)
):
    questions = await db.exam_questions.find({"exam_id": exam_id, "owner_id": owner_id}, {"_id": 0}).to_list(500)
    return questions
