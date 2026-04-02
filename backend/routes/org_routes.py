from fastapi import APIRouter, Request, Header, HTTPException, Depends
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone

from database import db
from models import Organization, OrgMember, OrgRole, User
from auth import get_current_user
from org_utils import create_org_logic

router = APIRouter(prefix="/api/orgs", tags=["Organizations"])

async def get_org_or_404(org_id: str) -> Organization:
    org_doc = await db.organizations.find_one({"org_id": org_id}, {"_id": 0})
    if not org_doc:
        raise HTTPException(status_code=404, detail="Organisation non trouvée")
    return Organization(**org_doc)

def requires_org_role(required_role: OrgRole):
    async def decorator(org_id: str, request: Request, authorization: Optional[str] = Header(None)):
        user = await get_current_user(request, authorization)
        org = await get_org_or_404(org_id)
        
        member = next((m for m in org.members if m.user_id == user.user_id), None)
        if not member:
            raise HTTPException(status_code=403, detail="Vous n'êtes pas membre de cette organisation")
        
        # Owner can do everything. Member can only do member things.
        if member.role == OrgRole.OWNER:
            return user
            
        if required_role == OrgRole.OWNER and member.role != OrgRole.OWNER:
            raise HTTPException(status_code=403, detail="Privilèges de propriétaire requis")
            
        return user
    return Depends(decorator)

@router.post("/", response_model=Organization)
async def create_organization(request: Request, body: Dict[str, str], authorization: Optional[str] = Header(None)):
    user = await get_current_user(request, authorization)
    name = body.get("name")
    plan = body.get("plan", "free")
    if not name:
        raise HTTPException(status_code=400, detail="Nom requis")
    
    # Check if user is already an owner
    existing_org = await db.organizations.find_one({"owner_id": user.user_id})
    if existing_org:
        raise HTTPException(status_code=400, detail="Vous possédez déjà une organisation. Vous ne pouvez en créer qu'une seule.")

    
    new_org = await create_org_logic(user.user_id, name, plan)
    return new_org

@router.get("/", response_model=List[Organization])
async def list_user_organizations(request: Request, authorization: Optional[str] = Header(None)):
    user = await get_current_user(request, authorization)
    # Find orgs where user is in the members list
    cursor = db.organizations.find({"members.user_id": user.user_id}, {"_id": 0})
    orgs = await cursor.to_list(100)
    for o in orgs:
        member = next((m for m in o.get("members", []) if m["user_id"] == user.user_id), None)
        o["role"] = member["role"] if member else "member"
    return [Organization(**o) for o in orgs]

@router.get("/{org_id}", response_model=Organization)
async def get_organization(org_id: str, request: Request, authorization: Optional[str] = Header(None)):
    user = await get_current_user(request, authorization)
    org = await get_org_or_404(org_id)
    
    # Check if user is a member
    if not any(m.user_id == user.user_id for m in org.members):
        raise HTTPException(status_code=403, detail="Accès refusé")
    
    return org

@router.post("/{org_id}/members")
async def add_org_member(org_id: str, body: Dict[str, str], user: User = requires_org_role(OrgRole.OWNER)):
    email = body.get("email")
    role_str = body.get("role", "member")
    
    if not email:
        raise HTTPException(status_code=400, detail="Email requis")
    
    target_user_doc = await db.users.find_one({"email": email.lower()})
    if not target_user_doc:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    
    target_user_id = target_user_doc["user_id"]
    org = await get_org_or_404(org_id)
    
    if any(m.user_id == target_user_id for m in org.members):
        raise HTTPException(status_code=400, detail="Déjà membre")
    
    new_member = OrgMember(
        user_id=target_user_id,
        role=OrgRole(role_str),
        joined_at=datetime.now(timezone.utc).isoformat()
    )
    
    await db.organizations.update_one(
        {"org_id": org_id},
        {"$push": {"members": new_member.model_dump()}}
    )
    
    return {"message": f"Utilisateur {email} ajouté avec le rôle {role_str}"}

@router.delete("/{org_id}/members/{user_id}")
async def remove_org_member(org_id: str, user_id: str, current_user: User = requires_org_role(OrgRole.OWNER)):
    org = await get_org_or_404(org_id)
    
    if user_id == org.owner_id:
        raise HTTPException(status_code=400, detail="Impossible de supprimer le propriétaire")
    
    await db.organizations.update_one(
        {"org_id": org_id},
        {"$pull": {"members": {"user_id": user_id}}}
    )
    
    return {"message": "Membre supprimé"}

@router.delete("/{org_id}")
async def delete_organization(org_id: str, user: User = requires_org_role(OrgRole.OWNER)):
    await db.organizations.delete_one({"org_id": org_id})
    return {"message": "Organisation supprimée"}
