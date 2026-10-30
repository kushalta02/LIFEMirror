import os
import json
from groq import Groq

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

MODEL_NAME = "openai/gpt-oss-20b"

ALLOWED_CATEGORIES = {
    "preference",
    "goal",
    "important_context",
    "boundary",
}


def extract_memory_suggestions(message: str):
    if not message or len(message.strip()) < 15:
        return []

    prompt = f"""
You are a personal memory extraction system for LifeMirror.

Identify stable, useful personal details explicitly shared by the user.

Extract only:
- Long-term preferences
- Personal or career goals
- Important ongoing context
- Boundaries and communication preferences

Do NOT extract:
- Temporary moods or passing emotions
- One-time events with no future relevance
- Sensitive personal or medical information
- Assumptions or invented details

Return at most 2 suggestions.

Return ONLY valid JSON in this format:
{{
  "memories": [
    {{
      "content": "Short factual memory",
      "category": "preference"
    }}
  ]
}}

Allowed categories:
preference, goal, important_context, boundary

If nothing useful is present, return:
{{"memories": []}}

User message:
{message[:2000]}
"""

    try:
        response = client.chat.completions.create(
            model=MODEL_NAME,
            messages=[
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
            temperature=0.2,
        )

        result = response.choices[0].message.content.strip()

        if result.startswith("```"):
            result = result.replace("```json", "").replace("```", "").strip()

        data = json.loads(result)
        suggestions = data.get("memories", [])

        valid_suggestions = []

        for item in suggestions[:2]:
            content = item.get("content", "").strip()
            category = item.get("category", "").strip()

            if (
                content
                and category in ALLOWED_CATEGORIES
                and len(content) <= 500
            ):
                valid_suggestions.append({
                    "content": content,
                    "category": category,
                })

        return valid_suggestions

    except Exception as exc:
        print(f"Memory extraction error: {exc}")
        return []