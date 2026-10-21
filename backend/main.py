import os
import jwt

from datetime import datetime, timezone, timedelta
from pwdlib import PasswordHash
from fastapi import Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from datetime import datetime, timezone
from typing import Any
from services.ai_engine import analyze_journal_entry
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from services.preprocessing import preprocess_journal
from bson import ObjectId
# from textblob import TextBlob

from database import (
    client,
    db,
    users_collection,
    journal_collection,
    personality_collection,
    insights_collection,
)

from services.ai_service_chat import generate_response


app = FastAPI(title="LifeMirror API")

# ---------------- AUTHENTICATION HELPERS ----------------

password_hash = PasswordHash.recommended()
security = HTTPBearer()

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")

if not JWT_SECRET_KEY:
    raise RuntimeError("JWT_SECRET_KEY is missing from .env")

JWT_ALGORITHM = "HS256"
JWT_EXPIRE_MINUTES = 60


def hash_password(password: str) -> str:
    """Securely hash a password using Argon2."""
    return password_hash.hash(password)


def verify_password(password: str, stored_password: str) -> bool:
    """Verify both modern hashes and existing plaintext passwords."""
    if not stored_password:
        return False

    # Modern Argon2 password hash.
    if stored_password.startswith("$argon2"):
        return password_hash.verify(password, stored_password)

    # Legacy plaintext password: temporary migration support.
    return password == stored_password


def create_access_token(email: str) -> str:
    """Create a signed JWT for the authenticated user."""
    now = datetime.now(timezone.utc)

    payload = {
        "sub": email,
        "iat": now,
        "exp": now + timedelta(minutes=JWT_EXPIRE_MINUTES),
    }

    return jwt.encode(
        payload,
        JWT_SECRET_KEY,
        algorithm=JWT_ALGORITHM,
    )


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """Validate a Bearer token and return its user."""
    token = credentials.credentials

    try:
        payload = jwt.decode(
            token,
            JWT_SECRET_KEY,
            algorithms=[JWT_ALGORITHM],
        )
        email = payload.get("sub")

        if not email:
            raise HTTPException(
                status_code=401,
                detail="Invalid authentication token",
                headers={"WWW-Authenticate": "Bearer"},
            )

    except jwt.InvalidTokenError as exc:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

    user = users_collection.find_one({"email": email})

    if not user:
        raise HTTPException(
            status_code=401,
            detail="User no longer exists",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return {
        "email": user["email"],
        "name": user.get("name", ""),
    }
# ---------------- CORS ----------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict to frontend URL in production
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------- MODELS ----------------
class Personality(BaseModel):
    email: str
    mood: str
    traits: list[str]
    avatar: str


class JournalCreate(BaseModel):
    email: str
    text: str


class JournalUpdate(BaseModel):
    text: str


class ChatRequest(BaseModel):
    message: str
    mood: str = "neutral"
    email: str = "guest"


# ---------------- HELPERS ----------------
def get_journals(email: str) -> list[dict[str, Any]]:
    """Return a user's journals in chronological order."""
    return list(
        journal_collection.find({"email": email}).sort(
            "timestamp", 1
        )
    )
def format_mood(mood: str) -> str:
    mood_labels = {
        "Positive": "Positive 😊",
        "Negative": "Negative 😔",
        "Neutral": "Neutral 😐",
    }

    if mood not in mood_labels:
        raise ValueError("Invalid AI mood label")

    return mood_labels[mood]


def infer_traits(email: str) -> list[str]:
    journals = get_journals(email)
    text = " ".join(
        entry.get("text", "") for entry in journals
    ).lower()

    traits = []

    if "alone" in text:
        traits.append("Introvert")

    if "friends" in text or "party" in text:
        traits.append("Extrovert")

    if "stress" in text or "anxious" in text:
        traits.append("Sensitive")

    if "thinking" in text or "reflect" in text:
        traits.append("Reflective")

    if "happy" in text or "good" in text:
        traits.append("Positive thinker")

    return traits


# ---------------- ROOT / HEALTH ----------------
@app.get("/")
async def root():
    return {"message": "LifeMirror API is running"}


@app.get("/health")
async def health():
    try:
        client.admin.command("ping")
        return {
            "status": "healthy",
            "database": "connected",
        }
    except Exception:
        raise HTTPException(
            status_code=503,
            detail="Database connection unavailable",
        )


# ---------------- SIGNUP ----------------
@app.post("/signup")
async def signup(data: dict):
    name = data.get("name")
    email = data.get("email")
    password = data.get("password")

    if not all(
        isinstance(value, str) and value.strip()
        for value in (name, email, password)
    ):
        raise HTTPException(
            status_code=400,
            detail="Name, email and password are required",
        )

    name = name.strip()
    email = email.strip().lower()

    if len(password) < 8:
        raise HTTPException(
            status_code=400,
            detail="Password must be at least 8 characters long",
        )

    if users_collection.find_one({"email": email}):
        raise HTTPException(
            status_code=409,
            detail="User already exists",
        )

    users_collection.insert_one({
        "name": name,
        "email": email,
        "password": hash_password(password),
        "created_at": datetime.now(timezone.utc),
    })

    return {"message": "Signup successful"}


# ---------------- LOGIN ----------------
@app.post("/login")
async def login(data: dict):
    email = data.get("email")
    password = data.get("password")

    if not isinstance(email, str) or not isinstance(password, str):
        raise HTTPException(
            status_code=400,
            detail="Email and password are required",
        )

    email = email.strip().lower()

    if not email or not password:
        raise HTTPException(
            status_code=400,
            detail="Email and password are required",
        )

    user = users_collection.find_one({"email": email})

    if not user or not verify_password(
        password,
        user.get("password", ""),
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid credentials",
        )

    # Upgrade a legacy plaintext password after successful verification.
    stored_password = user.get("password", "")

    if not stored_password.startswith("$argon2"):
        users_collection.update_one(
            {"_id": user["_id"]},
            {"$set": {"password": hash_password(password)}},
        )

    token = create_access_token(user["email"])

    return {
        "message": "Login successful",
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "email": user["email"],
            "name": user.get("name", ""),
        },
    }



# add journal

@app.post("/add_journal")
async def add_journal(data: JournalCreate):
    # 1. Validate and preprocess the user's journal.
    try:
        processed = preprocess_journal(data.text)
    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    # 2. Run the AI analysis on the processed text.
    try:
        analysis = analyze_journal_entry(
            data.text,
            preprocessed=processed,
        )
    except (RuntimeError, ValueError) as exc:
        # Keep internal provider details out of the API response.
        raise HTTPException(
            status_code=502,
            detail="Journal analysis failed. Please try again.",
        ) from exc

    # 3. Use the AI-classified mood, not the old keyword classifier.
    mood = format_mood(analysis["mood"])

    # 4. Prepare the MongoDB document.
    journal_document = {
        "email": data.email,
        "text": data.text,
        "mood": mood,
        "preprocessing": {
            "processed_text": processed["processed_text"],
            "character_count": processed["character_count"],
            "word_count": processed["word_count"],
        },
        "ai_analysis": analysis,
        "timestamp": datetime.now(timezone.utc),
    }

    # 5. Save the journal and its analysis together.
    result = journal_collection.insert_one(journal_document)

    # 6. Return the result to the React frontend.
    return {
        "message": "Journal saved and analyzed successfully",
        "id": str(result.inserted_id),
        "mood": mood,
        "analysis": analysis,
        "preprocessing": journal_document["preprocessing"],
    }



# ---------------- GET ALL JOURNALS ----------------
@app.get("/journals/{email}")
async def get_all_journals(email: str):
    entries = get_journals(email)

    return {
        "journals": [
            {
                "id": str(entry["_id"]),
                "text": entry.get("text", ""),
                "mood": entry.get("mood", "Neutral 😐"),
                "timestamp": entry.get("timestamp"),
                "ai_analysis": entry.get("ai_analysis", {}),

            }
            for entry in reversed(entries)
        ]
    }



# ---------------- UPDATE JOURNAL ----------------
@app.put("/journals/{journal_id}")
async def update_journal(
    journal_id: str,
    data: JournalUpdate,
    email: str,
):
    # 1. Validate the journal ID first.
    if not ObjectId.is_valid(journal_id):
        raise HTTPException(
            status_code=400,
            detail="Invalid journal ID",
        )

    # 2. Preprocess the edited journal.
    try:
        processed = preprocess_journal(data.text)
    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    # 3. Re-analyze the edited text.
    try:
        analysis = analyze_journal_entry(
            data.text,
            preprocessed=processed,
        )
        mood = format_mood(analysis["mood"])
    except (RuntimeError, ValueError) as exc:
        raise HTTPException(
            status_code=502,
            detail="AI journal analysis failed. Please try again.",
        ) from exc

    # 4. Update the existing document, not insert a new one.
    result = journal_collection.update_one(
        {
            "_id": ObjectId(journal_id),
            "email": email,
        },
        {
            "$set": {
                "text": data.text,
                "mood": mood,
                "preprocessing": {
                    "processed_text": processed["processed_text"],
                    "character_count": processed["character_count"],
                    "word_count": processed["word_count"],
                },
                "ai_analysis": analysis,
                "updated_at": datetime.now(timezone.utc),
            }
        },
    )

    if result.matched_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Journal not found for this user",
        )

    return {
        "message": "Journal updated and analyzed successfully",
        "id": journal_id,
        "mood": mood,
        "analysis": analysis,
    }

# ---------------- DELETE JOURNAL ----------------
@app.delete("/journals/{journal_id}")
async def delete_journal(
    journal_id: str,
    email: str,
):
    if not ObjectId.is_valid(journal_id):
        raise HTTPException(
            status_code=400,
            detail="Invalid journal ID",
        )

    result = journal_collection.delete_one(
        {
            "_id": ObjectId(journal_id),
            "email": email,
        }
    )

    if result.deleted_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Journal not found for this user",
        )

    return {
        "message": "Journal deleted successfully",
        "id": journal_id,
    }


# ---------------- GET PERSONALITY ----------------
@app.get("/get_personality/{email}")
async def get_personality(email: str):
    user = personality_collection.find_one(
        {"email": email},
        {"_id": 0},
    )

    return user if user else {}


# ---------------- AI TRAITS ----------------
@app.get("/get_ai_traits/{email}")
async def get_ai_traits(email: str):
    return {"traits": infer_traits(email)}


# ---------------- DASHBOARD ----------------
@app.get("/dashboard/{email}")
async def get_dashboard(
    email: str,
    current_user: dict = Depends(get_current_user),
):
    if email.strip().lower() != current_user["email"].lower():
        raise HTTPException(
            status_code=403,
            detail="You cannot access another user's dashboard",
        )

    entries = get_journals(current_user["email"])

    if not entries:
        return {
            "mood": "No data",
            "personality": "Unknown",
            "prediction": "Write journals",
            "productivity": "No data",
            "history": [],
            "traits": [],
        }

    latest = entries[-1].get("mood", "Neutral 😐")

    mood_map = {
        "Negative 😔": -1,
        "Neutral 😐": 0,
        "Positive 😊": 1,
    }

    history = [
        mood_map.get(entry.get("mood"), 0)
        for entry in entries
    ]

    traits = infer_traits(email)

    if "Introvert" in traits and "Extrovert" not in traits:
        personality = "Introvert"
    elif "Extrovert" in traits and "Introvert" not in traits:
        personality = "Extrovert"
    elif "Introvert" in traits and "Extrovert" in traits:
        personality = "Ambivert"
    else:
        personality = "Neutral"

    if latest == "Positive 😊":
        prediction = "You're doing great, keep it up ✨"
    elif latest == "Negative 😔":
        prediction = "Take a break, things will improve 🌿"
    else:
        prediction = "Stay balanced and mindful 🧘"

    return {
        "mood": latest,
        "personality": personality,
        "prediction": prediction,
        "productivity": f"{len(entries)} entries",
        "history": history,
        "traits": traits,
    }


# ---------------- CHAT ----------------
chat_memory: dict[str, list[dict[str, str]]] = {}


@app.post("/chat")
async def chat(data: ChatRequest):
    message = data.message.strip()

    if not message:
        raise HTTPException(
            status_code=400,
            detail="Message cannot be empty",
        )

    history = chat_memory.get(data.email, [])

    try:
        reply = generate_response(
            message,
            data.mood,
            history,
        )

        updated_history = history + [
            {"role": "user", "content": message},
            {"role": "assistant", "content": reply},
        ]

        chat_memory[data.email] = updated_history[-6:]

        return {"reply": reply}

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="AI assistant is temporarily unavailable",
        )


# ---------------- RECOMMENDATIONS ----------------
@app.get("/recommendations/{email}")
async def get_recommendations(email: str):
    entries = get_journals(email)

    if not entries:
        return {
            "recommendations": ["Start writing journals ✍️"]
        }

    latest_mood = entries[-1].get("mood", "Neutral 😐")
    traits = infer_traits(email)

    recommendations = []

    if latest_mood == "Negative 😔":
        recommendations.extend([
            "Listen to calm music 🎵",
            "Try meditation 🧘",
            "Write your thoughts ✍️",
        ])
    elif latest_mood == "Positive 😊":
        recommendations.extend([
            "Keep the energy high 💪",
            "Try something creative 🎨",
            "Share your happiness 😊",
        ])
    else:
        recommendations.extend([
            "Stay balanced ⚖️",
            "Go for a walk 🚶",
        ])

    if "Introvert" in traits:
        recommendations.append(
            "Spend some peaceful alone time 🌿"
        )

    if "Extrovert" in traits:
        recommendations.append(
            "Talk to friends or socialize 🗣️"
        )

    if "Sensitive" in traits:
        recommendations.append(
            "Listen to relaxing music 🎶"
        )

    return {
        "recommendations": list(dict.fromkeys(recommendations))
    }


# ---------------- DELETE PERSONALITY ----------------
@app.delete("/delete_personality/{email}")
async def delete_personality(email: str):
    result = personality_collection.delete_one(
        {"email": email}
    )

    if result.deleted_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Personality record not found",
        )

    return {"message": "Personality deleted successfully"}
@app.route("/logout")
async def logout():
    return {"message": "Logout successful"}
