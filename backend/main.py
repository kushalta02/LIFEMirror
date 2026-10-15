
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
from textblob import TextBlob
from datetime import datetime
from pydantic import BaseModel
from services.ai_service_chat import generate_response

app = FastAPI()

# ---------------- CORS ----------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # for dev only, restrict in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- DATABASE ----------------
client = MongoClient("mongodb://localhost:27017/")
db = client["lifemirror"]

users_collection = db["users"]
journal_collection = db["journals"]
personality_collection = db["personality"]

# ---------------- MODELS ----------------
class Personality(BaseModel):
    email: str
    mood: str
    traits: list
    avatar: str

# ---------------- SIGNUP ----------------
@app.post("/signup")
async def signup(data: dict):
    if users_collection.find_one({"email": data["email"]}):
        return {"message": "User already exists"}

    users_collection.insert_one(data)
    return {"message": "Signup successful"}

# ---------------- LOGIN ----------------
@app.post("/login")
async def login(data: dict):
    user = users_collection.find_one({"email": data["email"]})

    if not user or user["password"] != data["password"]:
        return {"message": "Invalid credentials"}

    return {
        "user": {
            "email": user["email"],
            "name": user["name"]
        }
    }

# ---------------- ADD JOURNAL ----------------
@app.post("/add_journal")
async def add_journal(data: dict):
    text = data["text"].lower()
    email = data["email"]

    analysis = TextBlob(text)
    polarity = analysis.sentiment.polarity

    # Important keywords
    negative_words = ["stress", "sad", "tired", "depressed", "angry", "upset", "bad", "anxious"]
    positive_words = ["happy", "good", "great", "excited", "calm", "relaxed"]

    neg_count = sum(word in text for word in negative_words)
    pos_count = sum(word in text for word in positive_words)

    # Determine mood
    if neg_count > pos_count:
        mood = "Negative 😔"
    elif pos_count > neg_count:
        mood = "Positive 😊"
    else:
        if polarity > 0.2:
            mood = "Positive 😊"
        elif polarity < -0.2:
            mood = "Negative 😔"
        else:
            mood = "Neutral 😐"

    # Store journal
    journal_collection.insert_one({
        "email": email,
        "text": text,
        "mood": mood,
        "timestamp": datetime.now()
    })

    return {"mood": mood}

# ---------------- SAVE PERSONALITY ----------------
@app.post("/save_personality")
async def save_personality(data: Personality):
    personality_collection.update_one(
        {"email": data.email},
        {"$set": {
            "email": data.email,
            "mood": data.mood,
            "traits": data.traits,
            "avatar": data.avatar
        }},
        upsert=True
    )
    return {"message": "Personality saved"}

# ---------------- GET PERSONALITY ----------------
@app.get("/get_personality/{email}")
async def get_personality(email: str):
    user = personality_collection.find_one({"email": email}, {"_id": 0})
    return user if user else {}
# ---------------- AI TRAITS FROM JOURNAL ----------------
@app.get("/get_ai_traits/{email}")
def get_ai_traits(email: str):
    journals = list(journal_collection.find({"email": email}))
    text = " ".join([j["text"] for j in journals]).lower()
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

    return {"traits": traits}

# ---------------- DASHBOARD ----------------
@app.get("/dashboard/{email}")
async def get_dashboard(email: str):
    entries = list(journal_collection.find({"email": email}))

    if not entries:
        return {
            "mood": "No data",
            "personality": "Unknown",
            "prediction": "Write journals",
            "productivity": "No data",
            "history": [],
            "traits": []
        }

    # Latest mood
    moods = [e["mood"] for e in entries]
    latest = moods[-1]

    # Mood trend numbers
    mood_map = {"Negative 😔": -1, "Neutral 😐": 0, "Positive 😊": 1}
    trend = [mood_map.get(m, 0) for m in moods]

    # 🔥 AI-inferred traits
    traits_data = get_ai_traits(email)
    traits = list(set(traits_data["traits"]))  # remove duplicates

    # 🔥 IMPROVED PERSONALITY LOGIC
    if "Introvert" in traits and "Extrovert" not in traits:
        personality = "Introvert"
    elif "Extrovert" in traits and "Introvert" not in traits:
        personality = "Extrovert"
    elif "Introvert" in traits and "Extrovert" in traits:
        personality = "Ambivert"
    else:
        personality = "Neutral"

    # 🔥 SMART PREDICTION
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
        "history": trend,
        "traits": traits
    }
# ---------------- CHAT ----------------
chat_memory = {}

@app.post("/chat")
async def chat(data: dict):
    message = data.get("message", "")
    mood = data.get("mood", "neutral")
    email = data.get("email", "guest")

    try:
        # get previous history
        history = chat_memory.get(email, [])

        # generate AI reply
        reply = generate_response(message, mood, history)

        # update memory
        history.append({"role": "user", "content": message})
        history.append({"role": "assistant", "content": reply})

        chat_memory[email] = history[-6:]  # keep last few messages

        return {"reply": reply}

    except Exception as e:
        print("ERROR:", repr(e))
        return {"reply": str(e)}
@app.get("/recommendations/{email}")
def get_recommendations(email: str):
    entries = list(journal_collection.find({"email": email}))
    
    if not entries:
        return {"recommendations": ["Start writing journals ✍️"]}

    latest_mood = entries[-1]["mood"]

    traits_data = get_ai_traits(email)
    traits = traits_data["traits"]

    recommendations = []

    # 🔥 Mood-based
    if latest_mood == "Negative 😔":
        recommendations += [
            "Listen to calm music 🎵",
            "Try meditation 🧘",
            "Write your thoughts ✍️"
        ]

    elif latest_mood == "Positive 😊":
        recommendations += [
            "Keep the energy high 💪",
            "Try something creative 🎨",
            "Share your happiness 😊"
        ]

    else:
        recommendations += [
            "Stay balanced ⚖️",
            "Go for a walk 🚶"
        ]

    # 🔥 Personality-based
    if "Introvert" in traits:
        recommendations.append("Spend some peaceful alone time 🌿")

    if "Extrovert" in traits:
        recommendations.append("Talk to friends or socialize 🗣️")

    if "Sensitive" in traits:
        recommendations.append("Listen to relaxing music 🎶")

    return {"recommendations": list(set(recommendations))}