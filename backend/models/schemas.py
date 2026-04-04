from pydantic import BaseModel

class ChatRequest(BaseModel):
    message: str
    mood: str = "neutral"

class ChatResponse(BaseModel):
    reply: str