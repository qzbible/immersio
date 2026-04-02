import uuid
import random
import string
import hashlib
from datetime import datetime, timezone
from database import db
from models import Organization, OrgMember, OrgRole

async def create_org_logic(user_id: str, name: str, plan: str = "free"):
    org_id = f"org_{uuid.uuid4().hex[:12]}"
    slug = name.lower().replace(" ", "-")
    
    # Ensure slug is unique
    existing = await db.organizations.find_one({"slug": slug})
    if existing:
        slug = f"{slug}-{uuid.uuid4().hex[:4]}"
    
    new_org = Organization(
        org_id=org_id,
        slug=slug,
        name=name,
        owner_id=user_id,
        plan=plan,
        members=[OrgMember(user_id=user_id, role=OrgRole.OWNER, joined_at=datetime.now(timezone.utc).isoformat())],
        created_at=datetime.now(timezone.utc).isoformat()
    )
    
    await db.organizations.insert_one(new_org.model_dump())
    
    # Generate default password for the owner if they don't have one
    user_doc = await db.users.find_one({"user_id": user_id})
    if user_doc and not user_doc.get("password"):
        default_pwd = ''.join(random.choices(string.ascii_letters + string.digits, k=8))
        hashed_pwd = hashlib.sha256(default_pwd.encode()).hexdigest()
        await db.users.update_one({"user_id": user_id}, {"$set": {"password": hashed_pwd}})
        
        
        await send_welcome_admin_email(user_doc["email"], user_doc["name"], name, default_pwd)
        
    return new_org

async def send_welcome_admin_email(email: str, name: str, org_name: str, password: str):
    from routes.auth_routes import send_email
    
    subject = f"Bienvenue sur BibleQuest Admin - {org_name}"
    body = f"""Bonjour {name},

Félicitations ! Votre organisation '{org_name}' a été créée avec succès sur BibleQuest (Immersio).

Voici vos identifiants pour accéder à l'interface d'administration :
- Accès : http://localhost:5173
- Email : {email}
- Mot de passe par défaut : {password}

Nous vous recommandons de changer votre mot de passe dès votre première connexion dans l'onglet 'Sécurité'.

L'équipe BibleQuest
"""
    await send_email(email, subject, body)
