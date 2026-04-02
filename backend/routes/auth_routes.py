from fastapi import APIRouter, HTTPException, Response, Request, Header
from typing import Optional, Dict, Any
from datetime import datetime, timezone, timedelta
import uuid
import httpx
import os
import aiosmtplib
import ssl
import certifi
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from database import db
from models import User, UserSession, OTPRequest
from auth import get_current_user, get_session_token, get_admin_user
import random
import hashlib

router = APIRouter(prefix="/api")

async def send_email(to_email: str, subject: str, body: str):
    """
    Sends an email using SMTP settings from .env
    """
    smtp_host = os.getenv("EMAIL_HOST", "smtp.gmail.com")
    smtp_port = int(os.getenv("EMAIL_PORT", 587))
    smtp_user = os.getenv("EMAIL_HOST_USER")
    smtp_pass = os.getenv("EMAIL_HOST_PASSWORD")
    sender = os.getenv("MAIL_SENDER", smtp_user)
    use_tls = os.getenv("EMAIL_USE_TLS", "True") == "True"

    if not smtp_user or not smtp_pass:
        print(f"⚠️ SMTP not configured. Skipping email to {to_email}")
        return False

    message = MIMEMultipart()
    message["From"] = sender
    message["To"] = to_email
    message["Subject"] = subject
    message.attach(MIMEText(body, "plain"))

    try:
        # Fix for [SSL: CERTIFICATE_VERIFY_FAILED] on some systems (macOS)
        context = ssl.create_default_context(cafile=certifi.where())
        
        if use_tls:
            await aiosmtplib.send(
                message,
                hostname=smtp_host,
                port=smtp_port,
                username=smtp_user,
                password=smtp_pass,
                start_tls=True,
                tls_context=context,
            )
        else:
            await aiosmtplib.send(
                message,
                hostname=smtp_host,
                port=smtp_port,
                username=smtp_user,
                password=smtp_pass,
                use_tls=True,
                tls_context=context,
            )
        print(f"✅ Email sent to {to_email}")
        return True
    except Exception as e:
        print(f"❌ Failed to send email to {to_email}: {e}")
        return False
@router.post("/auth/session")
async def create_session(session_id: str, response: Response):
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id}
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=400, detail="Session invalide")
        user_data = resp.json()
    
    user_id = None
    existing_user = await db.users.find_one({"email": user_data["email"]}, {"_id": 0})
    
    if existing_user:
        user_id = existing_user["user_id"]
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"name": user_data["name"], "picture": user_data.get("picture")}}
        )
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        new_user = User(user_id=user_id, email=user_data["email"], name=user_data["name"], picture=user_data.get("picture", ""), created_at=datetime.now(timezone.utc).isoformat())
        user_dict = new_user.model_dump()
        await db.users.insert_one(user_dict)
    
    session_token = user_data["session_token"]
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    session = UserSession(user_id=user_id, session_token=session_token, expires_at=expires_at.isoformat(), created_at=datetime.now(timezone.utc).isoformat())
    session_dict = session.model_dump()
    await db.user_sessions.insert_one(session_dict)
    
    response.set_cookie(key="session_token", value=session_token, httponly=True, secure=True, samesite="none", path="/", max_age=7*24*60*60)
    
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    return User(**user_doc)


@router.get("/auth/me")
async def get_me(request: Request, authorization: Optional[str] = Header(None)):
    user = await get_current_user(request, authorization)
    if user.premium_expires_at:
        premium_expires = user.premium_expires_at
        if isinstance(premium_expires, str):
            premium_expires = datetime.fromisoformat(premium_expires)
        if premium_expires.tzinfo is None:
            premium_expires = premium_expires.replace(tzinfo=timezone.utc)
        if premium_expires < datetime.now(timezone.utc):
            await db.users.update_one({"user_id": user.user_id}, {"$set": {"is_premium": False, "premium_expires_at": None}})
            user.is_premium = False
            user.premium_expires_at = None
            
    # Check if they own any organization
    org = await db.organizations.find_one({"owner_id": user.user_id})
    user.is_org_owner = bool(org)
    
    return user


@router.post("/auth/logout")
async def logout(request: Request, response: Response, authorization: Optional[str] = Header(None)):
    token = get_session_token(request, authorization)
    if token:
        await db.user_sessions.delete_one({"session_token": token})
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out"}


async def send_auth_email(email: str, name: str, code: str):
    smtp_host = os.environ.get("EMAIL_HOST", "smtp.gmail.com")
    smtp_port = int(os.environ.get("EMAIL_PORT", 587))
    smtp_user = os.environ.get("EMAIL_HOST_USER")
    smtp_pass = os.environ.get("EMAIL_HOST_PASSWORD")
    mail_sender = os.environ.get("MAIL_SENDER", smtp_user)
    
    if not smtp_user or not smtp_pass:
        print("[ERROR] Email credentials not found in environment")
        return False
        
    message = MIMEMultipart("alternative")
    message["Subject"] = "Votre code de connexion BibleQuest"
    message["From"] = f"BibleQuest <{mail_sender}>"
    message["To"] = email
    
    html = f"""
    <html>
      <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 10px; border-top: 4px solid #facc15;">
          <h1 style="color: #1e3a8a; text-align: center;">BibleQuest</h1>
          <p style="font-size: 16px; color: #333;">Bonjour <strong>{name}</strong>,</p>
          <p style="font-size: 16px; color: #333;">Voici votre code de confirmation pour accéder à votre aventure sur BibleQuest :</p>
          <div style="background-color: #eff6ff; padding: 20px; text-align: center; border-radius: 8px; margin: 25px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1e3a8a;">{code}</span>
          </div>
          <p style="font-size: 14px; color: #666;">Ce code expirera dans 10 minutes.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="font-size: 12px; color: #999; text-align: center;">Que la paix soit avec vous.<br>© 2024 BibleQuest</p>
        </div>
      </body>
    </html>
    """
    
    part = MIMEText(html, "html")
    message.attach(part)
    
    # Create SSL context with certifi for macOS compatibility
    context = ssl.create_default_context(cafile=certifi.where())
    
    try:
        print(f"[SMTP] Connecting to {smtp_host}:{smtp_port} with STARTTLS...")
        await aiosmtplib.send(
            message,
            hostname=smtp_host,
            port=smtp_port,
            username=smtp_user,
            password=smtp_pass,
            use_tls=False,
            start_tls=True,
            tls_context=context
        )
        print(f"[SMTP] Email successfully sent to {email}")
        return True
    except Exception as e:
        import traceback
        print(f"[ERROR] Failed to send email to {email}")
        print(f"[ERROR] Exception type: {type(e).__name__}")
        print(f"[ERROR] Exception message: {str(e)}")
        # traceback.print_exc()
        return False


@router.post("/auth/otp/request")
async def request_otp(data: Dict[str, str]):
    email = data.get("email", "").lower().strip()
    name = data.get("name", "").strip()
    church = data.get("church", "").strip()
    
    if not email or not name:
        raise HTTPException(status_code=400, detail="Email et nom requis")
    
    code = "".join([str(random.randint(0, 9)) for _ in range(6)])
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
    
    otp_doc = {
        "email": email,
        "name": name,
        "church": church,
        "code": code,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "expires_at": expires_at.isoformat()
    }
    
    await db.otp_codes.delete_many({"email": email})
    await db.otp_codes.insert_one(otp_doc)
    
    # Send real email
    sent = await send_auth_email(email, name, code)
    if not sent:
        # Fallback to console for debugging
        print(f"\n[EMAIL MOCK - ERROR SENDING] To: {email} | Code: {code}\n")
    
    return {"message": "Code envoyé"}


@router.post("/auth/otp/verify")
async def verify_otp(data: Dict[str, str], response: Response):
    email = data.get("email", "").lower().strip()
    code = data.get("code", "").strip()
    
    otp_doc = await db.otp_codes.find_one({"email": email, "code": code})
    if not otp_doc:
        raise HTTPException(status_code=400, detail="Code invalide")
    
    expires_at = datetime.fromisoformat(otp_doc["expires_at"])
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Code expiré")
    
    # Code valid, create/get user
    existing_user = await db.users.find_one({"email": email}, {"_id": 0})
    user_id = None
    
    if existing_user:
        user_id = existing_user["user_id"]
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"name": otp_doc["name"], "church": otp_doc["church"]}}
        )
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        new_user = User(
            user_id=user_id,
            email=email,
            name=otp_doc["name"],
            church=otp_doc["church"],
            created_at=datetime.now(timezone.utc).isoformat()
        )
        await db.users.insert_one(new_user.model_dump())
    
    # Create session
    session_token = uuid.uuid4().hex
    expires_session = datetime.now(timezone.utc) + timedelta(days=7)
    
    session = UserSession(
        user_id=user_id,
        session_token=session_token,
        expires_at=expires_session.isoformat(),
        created_at=datetime.now(timezone.utc).isoformat()
    )
    await db.user_sessions.insert_one(session.model_dump())
    
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7*24*60*60
    )
    
    await db.otp_codes.delete_one({"_id": otp_doc["_id"]})
    
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    return User(**user_doc)


@router.patch("/users/me")
async def update_me(data: Dict[str, Any], request: Request, authorization: Optional[str] = Header(None)):
    user = await get_current_user(request, authorization)
    allowed_fields = ["name", "church", "picture"]
    update_data = {k: v for k, v in data.items() if k in allowed_fields}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="Aucune donnée valide à mettre à jour")
        
    await db.users.update_one({"user_id": user.user_id}, {"$set": update_data})
    
    updated_user = await db.users.find_one({"user_id": user.user_id}, {"_id": 0})
    return User(**updated_user)


# ── Staff Management ──────────────────────────────────────────────────
@router.post("/auth/staff/register")
async def register_staff(data: Dict[str, str], response: Response):
    email = data.get("email", "").lower().strip()
    name = data.get("name", "").strip()
    password = data.get("password", "").strip()
    
    if not email or not name or not password:
        raise HTTPException(status_code=400, detail="Tous les champs sont requis")
    
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email déjà utilisé")
    
    user_id = f"staff_{uuid.uuid4().hex[:12]}"
    # Simple hash for now (should use passlib/bcrypt in production)
    hashed_pass = hashlib.sha256(password.encode()).hexdigest()
    
    new_staff = User(
        user_id=user_id,
        email=email,
        name=name,
        password=hashed_pass,
        is_admin=True,
        created_at=datetime.now(timezone.utc).isoformat()
    )
    
    await db.users.insert_one(new_staff.model_dump())
    
    # Auto-login after register
    session_token = uuid.uuid4().hex
    expires = datetime.now(timezone.utc) + timedelta(days=7)
    session = UserSession(user_id=user_id, session_token=session_token, expires_at=expires.isoformat(), created_at=datetime.now(timezone.utc).isoformat())
    await db.user_sessions.insert_one(session.model_dump())
    
    response.set_cookie(key="session_token", value=session_token, httponly=True, secure=True, samesite="none", path="/", max_age=7*24*60*60)
    return new_staff


@router.post("/auth/staff/login")
async def login_staff(data: Dict[str, str], response: Response):
    email = data.get("email", "").lower().strip()
    password = data.get("password", "").strip()
    
    user_doc = await db.users.find_one({"email": email})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Identifiants invalides")

    # Check if staff or org owner
    is_staff = user_doc.get("is_admin", False)
    is_org_owner = False
    
    if not is_staff:
        # Check if they own at least one organization
        org = await db.organizations.find_one({"owner_id": user_doc["user_id"]})
        if org:
            is_org_owner = True
            
    if not is_staff and not is_org_owner:
        raise HTTPException(status_code=401, detail="Accès non autorisé")
    
    hashed_input = hashlib.sha256(password.encode()).hexdigest()
    if user_doc.get("password") != hashed_input:
        raise HTTPException(status_code=401, detail="Identifiants invalides")
    
    session_token = uuid.uuid4().hex
    expires = datetime.now(timezone.utc) + timedelta(days=7)
    session = UserSession(user_id=user_doc["user_id"], session_token=session_token, expires_at=expires.isoformat(), created_at=datetime.now(timezone.utc).isoformat())
    await db.user_sessions.insert_one(session.model_dump())
    
    response.set_cookie(key="session_token", value=session_token, httponly=True, secure=True, samesite="none", path="/", max_age=7*24*60*60)
    return User(**user_doc)


@router.post("/auth/change-password")
async def change_password(data: Dict[str, str], request: Request, authorization: Optional[str] = Header(None)):
    user = await get_current_user(request, authorization)
    old_password = data.get("old_password", "").strip()
    new_password = data.get("new_password", "").strip()
    
    if not new_password or len(new_password) < 6:
        raise HTTPException(status_code=400, detail="Le nouveau mot de passe doit faire au moins 6 caractères")
        
    user_doc = await db.users.find_one({"user_id": user.user_id})
    if not user_doc:
         raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
         
    # If they have an old password, verify it
    if user_doc.get("password"):
        hashed_old = hashlib.sha256(old_password.encode()).hexdigest()
        if user_doc["password"] != hashed_old:
            raise HTTPException(status_code=401, detail="Ancien mot de passe incorrect")
            
    hashed_new = hashlib.sha256(new_password.encode()).hexdigest()
    await db.users.update_one({"user_id": user.user_id}, {"$set": {"password": hashed_new}})
    
    return {"message": "Mot de passe mis à jour avec succès"}

@router.post("/auth/forgot-password")
async def forgot_password(request: Request, body: dict):
    email = body.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Email requis")
    
    # Check if user exists and is staff or org owner
    user_doc = await db.users.find_one({"email": email})
    if not user_doc:
        # For security, we don't reveal if the user exists
        return {"message": "Si l'adresse email est associée à un compte administrateur, vous recevrez un code de réinitialisation."}
    
    is_org_owner = await db.organizations.find_one({"owner_id": user_doc["user_id"]})
    if not (user_doc.get("is_admin") or is_org_owner):
        # Only admins/owners have passwords to reset
        return {"message": "Si l'adresse email est associée à un compte administrateur, vous recevrez un code de réinitialisation."}

    # Generate 6-digit code
    code = f"{random.randint(100000, 999999)}"
    
    # Store code with expiration (15 mins)
    expire_at = datetime.now(timezone.utc) + timedelta(minutes=15)
    await db.password_resets.update_one(
        {"email": email},
        {"$set": {"code": code, "expire_at": expire_at}},
        upsert=True
    )
    
    # Send real email
    subject = "Réinitialisation de votre mot de passe - BibleQuest Admin"
    body = f"""Bonjour,

Vous avez demandé la réinitialisation de votre mot de passe pour l'administration de BibleQuest (Immersio).

Votre code de validation est : {code}

Il expire dans 15 minutes.
Vous pouvez également utiliser ce lien pour réinitialiser directement :
http://localhost:5173/reset-password?email={email}

Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email.

L'équipe BibleQuest
"""
    await send_email(email, subject, body)
    
    return {"message": "Code envoyé par email"}

@router.post("/auth/reset-password")
async def reset_password(request: Request, body: dict):
    email = body.get("email")
    code = body.get("code")
    new_password = body.get("new_password")
    
    if not all([email, code, new_password]):
        raise HTTPException(status_code=400, detail="Tous les champs sont requis")
    
    # Verify code
    reset_doc = await db.password_resets.find_one({"email": email, "code": code})
    if not reset_doc:
        raise HTTPException(status_code=400, detail="Code invalide")
    
    # Fix timezone comparison
    expire_at = reset_doc["expire_at"]
    if expire_at.tzinfo is None:
        expire_at = expire_at.replace(tzinfo=timezone.utc)
        
    if expire_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Code expiré")
    
    # Hash and update password
    hashed_pass = hashlib.sha256(new_password.encode()).hexdigest()
    await db.users.update_one({"email": email}, {"$set": {"password": hashed_pass}})
    
    # Delete reset code
    await db.password_resets.delete_one({"email": email})
    
    return {"message": "Mot de passe réinitialisé avec succès"}
