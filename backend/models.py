from enum import Enum
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone


class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str = ""
    email: str = ""
    name: str = ""
    picture: str = "/default_avatar.png"
    google_id: str = ""
    level: int = 1
    xp: int = 0
    lives: int = 5
    coins: int = 100
    is_premium: bool = False
    premium_expires_at: Optional[Any] = None
    mmr: int = 1000
    is_org_owner: bool = False
    church: str = ""
    created_at: Any = ""
    is_admin: bool = False
    password: Optional[str] = None


class UserSession(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str = ""
    session_token: str = ""
    created_at: Any = ""
    expires_at: Any = ""


class OTPRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    email: str
    name: str = ""
    church: str = ""
    code: str
    created_at: Any
    expires_at: Any


class Question(BaseModel):
    model_config = ConfigDict(extra="ignore")
    question_id: str = ""
    text: str
    options: List[str]
    correct_answer: int
    category: str = "general"
    difficulty: str = "medium"
    book: str = ""
    chapter: int = 0
    owner_id: str = "system"
    visibility: str = "public"


class UserProgress(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    book: str
    score: int = 0
    completed: bool = False
    last_played: str = ""


class Badge(BaseModel):
    model_config = ConfigDict(extra="ignore")
    badge_id: str
    name: str
    description: str
    icon: str
    condition_type: str
    condition_value: int = 1


class UserBadge(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    badge_id: str
    earned_at: str = ""


class PaymentTransaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    transaction_id: str = ""
    user_id: str
    amount: float
    currency: str = "usd"
    status: str = "pending"
    stripe_session_id: str = ""
    package_type: str = ""
    created_at: str = ""
    completed_at: str = ""


class DailyManna(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    date: str
    completed: bool = False
    streak: int = 0


class GameStartRequest(BaseModel):
    mode_id: str
    lang: str = "fr"
    difficulty: Optional[str] = "moyen"


class GameSubmitRequest(BaseModel):
    session_id: str
    answers: Dict[str, Any]


class CheckoutRequest(BaseModel):
    package_type: str
    success_url: str
    cancel_url: str
    org_name: Optional[str] = None
    plan: Optional[str] = None


class DuoMatchRequest(BaseModel):
    mode: str = "friend"
    theme: Optional[str] = None
    friend_code: Optional[str] = None
    difficulty: Optional[str] = "moyen"
    num_modes: Optional[int] = 1


class CreateGroupSessionRequest(BaseModel):
    name: str = "Session BibleQuest"
    category: Optional[str] = None
    num_questions: int = 10
    max_players: int = 20


class JoinGroupRequest(BaseModel):
    pin_code: str
    player_name: str


class GenerateQuestionsRequest(BaseModel):
    lang: str = "both"
    num_questions: int = 5
    topic: Optional[str] = None
    type: str = "vrai_faux" # Added this to replace category for prompt selection
    context_text: Optional[str] = None


class SaveQuestionRequest(BaseModel):
    # This was used for bulk save, keeping for compatibility
    question_id: Optional[str] = None
    lang: str
    text: str
    answer: Any
    options: Optional[List[str]] = None
    reference: Optional[str] = None
    difficulty: str = "moyen"
    approved: bool = True
    source: str = "ai"


class AdminQuestion(BaseModel):
    model_config = ConfigDict(extra="ignore")
    question_id: Optional[str] = None
    lang: str
    text: str
    answer: Any
    options: Optional[List[str]] = None
    reference: Optional[str] = None
    difficulty: str = "moyen"
    approved: bool = True
    source: str = "manual"
    created_at: Optional[str] = None
    owner_id: str = "system"
    visibility: str = "public"
    tags: List[str] = []
    type: str = "single_choice" # single_choice, multiple_choice, true_false, qui_a_dit, chrono_versets, anagrammes
    score: int = 10
    author: Optional[str] = None
    author: Optional[str] = None      # For qui_a_dit
    missing_word: Optional[str] = None # For chrono_versets
    word: Optional[str] = None         # For anagrammes
    hint: Optional[str] = None         # For anagrammes




class GameMode(BaseModel):
    model_config = ConfigDict(extra="ignore")
    mode_id: str
    name: str
    description: str
    icon: str
    difficulty: str = "moyen"
    duration_minutes: int = 5
    color: str = "from-blue-400 to-blue-600"
    available: bool = True
    owner_id: str = "system"
    visibility: str = "public"
    question_ids: List[str] = []  # Explicit list of questions to include
    overrides: Dict[str, Any] = {} # Per-question overrides (difficulty, etc.)


class OrgRole(str, Enum):
    OWNER = "owner"
    MEMBER = "member"


class OrgMember(BaseModel):
    user_id: str
    role: OrgRole
    joined_at: Optional[str] = None


class Organization(BaseModel):
    model_config = ConfigDict(extra="ignore")
    org_id: str
    slug: str
    name: str
    description: Optional[str] = None
    picture: str = "/default_org.png"
    owner_id: str
    members: List[OrgMember] = []
    created_at: Optional[str] = None
    plan: str = "free"  # free, silver, gold
    plan_expires_at: Optional[str] = None
    settings: Dict[str, Any] = {}
    role: Optional[str] = None # Injected for the current user


class InvitationStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    DECLINED = "declined"
    EXPIRED = "expired"


class Invitation(BaseModel):
    model_config = ConfigDict(extra="ignore")
    invitation_id: str
    org_id: str
    org_name: str
    inviter_id: str
    inviter_name: str
    invitee_email: str
    invitee_id: Optional[str] = None  # None if user doesn't exist yet
    role: OrgRole = OrgRole.MEMBER
    status: InvitationStatus = InvitationStatus.PENDING
    created_at: str
    expires_at: Optional[str] = None

class ExamQuestion(BaseModel):
    model_config = ConfigDict(extra="ignore")
    question_id: str
    exam_id: str
    type: str  # single_choice, multiple_choice, true_false, short_answer
    text: str
    options: Optional[List[str]] = None
    answer: Any
    explanation: Optional[str] = None
    difficulty: str = "moyen"
    category: str = "general"
    subcategory: Optional[str] = None
    created_at: Optional[str] = None
    owner_id: str = "system"


class CertificationExam(BaseModel):
    model_config = ConfigDict(extra="ignore")
    exam_id: str
    name: str
    description: Optional[str] = None
    category: str = "general"
    subcategory: Optional[str] = None
    level: str = "moyen"
    is_published: bool = False
    owner_id: str = "system"
    created_at: Optional[str] = None
    question_count: int = 0


class AttemptResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    question_id: str
    question_text: str
    user_answer: Any
    correct_answer: Any
    is_correct: bool
    explanation: Optional[str] = None


class ExamAttemptCreate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    exam_id: str
    score: int
    duration_seconds: int
    responses: List[AttemptResponse]


class ExamAttempt(ExamAttemptCreate):
    attempt_id: str
    user_id: str
    exam_name: str
    created_at: str

