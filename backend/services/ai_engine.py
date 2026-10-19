
import json
import os
import re
from services.preprocessing import preprocess_journal
from dotenv import load_dotenv
from groq import Groq
from pydantic import BaseModel, Field, ValidationError
from typing import Literal
load_dotenv()


# ---------- Structured output schema ----------

class JournalEmotion(BaseModel):
    label: str
    intensity: int = Field(ge=1, le=10)
    evidence: str



class JournalAnalysis(BaseModel):
    mood: Literal["Positive", "Negative", "Neutral"]
    emotions: list[JournalEmotion]
    themes: list[str]
    overall_intensity: int = Field(ge=1, le=10)
    summary: str
    supportive_response: str
    suggested_action: str



# ---------- Groq client ----------

def get_groq_client():
    api_key = os.getenv("GROQ_API_KEY")

    if not api_key:
        raise RuntimeError("GROQ_API_KEY is missing from the backend .env")

    return Groq(api_key=api_key)


# ---------- Journal intelligence ----------


def analyze_journal_entry(
    text: str,
    mood: str = "unknown",
    *,
    preprocessed: dict | None = None,
) -> dict:
    processed = (
        preprocessed
        if preprocessed is not None
        else preprocess_journal(text)
    )
    text = processed["processed_text"]


    client = get_groq_client()

    messages = [
        {
            "role": "system",
            "content": """
You are LifeMirror's journal understanding engine.

Analyze the user's journal carefully and return ONLY valid JSON.
Do not diagnose mental health conditions or claim certainty about
personality. Infer emotions only when supported by the text.
If evidence is unclear, say so rather than inventing details.

Return exactly these fields:
{
  "emotions": [
    {
      "label": "emotion name",
      "intensity": 1,
      "evidence": "short evidence from the user's writing"
    }
  ],
  "themes": ["theme 1", "theme 2"],
  "overall_intensity": 1,
  "summary": "brief neutral summary",
  "supportive_response": "warm, specific, helpful response",
  "suggested_action": "one realistic next step"
}

Rules:
- Intensity values must be integers from 1 to 10.
- Use 1 to 3 relevant emotions and themes where possible.
- Emotion evidence must be grounded in the journal text.
- Do not invent previous events or memories.
- Treat the supplied mood as user-provided context, not proof.
- Be empathetic, non-judgmental, and concise.
- Return JSON only, without Markdown fences.

"
  or balanced; do not force a positive classification.
- The mood must reflect the journal as a whole, not just one emotion.
"""
        },
        {
            "role": "user",
            "content": json.dumps(
                {
                    "journal_text": text,
                    "user_reported_mood": mood,
                },
                ensure_ascii=False,
            ),
        },
    ]

    try:
        response = client.chat.completions.create(
            model="openai/gpt-oss-20b",
            messages=messages,
            temperature=0.2,
            max_tokens=700,
        )

        content = response.choices[0].message.content

        if not content:
            raise RuntimeError("Groq returned an empty analysis.")

        # Handle accidental Markdown fences from the model.
        content = content.strip()
        content = re.sub(
            r"^```(?:json)?\s*|\s*```$",
            "",
            content,
            flags=re.IGNORECASE,
        )

        raw_data = json.loads(content)
        validated = JournalAnalysis.model_validate(raw_data)

        return validated.model_dump()

    except (json.JSONDecodeError, ValidationError) as exc:
        raise RuntimeError(
            "The AI returned an invalid journal analysis. Please retry."
        ) from exc

    except Exception as exc:
        if isinstance(exc, RuntimeError):
            raise
        raise RuntimeError(
            "Journal AI analysis failed. Check the Groq API and backend logs."
        ) from exc
