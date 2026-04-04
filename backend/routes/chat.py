from fastapi import APIRouter
from services.ai_service_chat import generate_response

router = APIRouter()

@router.post("/chat")
def chat(req: dict):
    message = req.get("message")
    mood = req.get("mood", "neutral")

    reply = generate_response(message, mood)
    return {"reply": reply}