
from groq import Groq
import os
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def generate_response(message: str, mood: str, history=[]):
    messages = [
        {
            "role": "system",
            "content": f"You are a helpful emotional AI assistant. User mood is {mood}. Keep replies short, supportive, and conversational."
        }
    ]

    # 🔥 ADD CHAT HISTORY
    for msg in history:
        messages.append(msg)

    # current message
    messages.append({
        "role": "user",
        "content": message
    })

    response = client.chat.completions.create(
        # model="llama-3.1-8b-instant",
        model="openai/gpt-oss-20b",
        messages=messages,
        temperature=0.7,
        max_tokens=120
    )
    


    return response.choices[0].message.content
print("KEY EXISTS:", bool(os.getenv("GROQ_API_KEY")))
print("KEY START:", os.getenv("GROQ_API_KEY", "")[:8])
