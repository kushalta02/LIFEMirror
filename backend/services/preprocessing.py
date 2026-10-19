
import re
import unicodedata


MAX_JOURNAL_LENGTH = 20_000


def preprocess_journal(text: str) -> dict:
    """
    Validate and normalize journal text without removing
    meaningful emotional signals such as punctuation or negation.
    """

    if not isinstance(text, str):
        raise ValueError("Journal text must be a string.")

    # Normalize equivalent Unicode representations.
    normalized = unicodedata.normalize("NFKC", text)

    # Remove null bytes and unwanted control characters,
    # while preserving newlines and tabs.
    normalized = "".join(
        char
        for char in normalized
        if char in "\n\t" or not unicodedata.category(char).startswith("C")
    )

    # Normalize line endings and whitespace.
    normalized = normalized.replace("\r\n", "\n").replace("\r", "\n")
    normalized = re.sub(r"[ \t]+", " ", normalized)
    normalized = re.sub(r"\n{3,}", "\n\n", normalized)
    cleaned_text = normalized.strip()

    if not cleaned_text:
        raise ValueError("Journal entry cannot be empty.")

    if len(cleaned_text) > MAX_JOURNAL_LENGTH:
        raise ValueError(
            f"Journal entry exceeds {MAX_JOURNAL_LENGTH} characters."
        )

    # Keep the user's wording, punctuation, casing and negation intact.
    words = re.findall(r"\b[\w'-]+\b", cleaned_text, flags=re.UNICODE)

    return {
        "original_text": text,
        "processed_text": cleaned_text,
        "character_count": len(cleaned_text),
        "word_count": len(words),
    }
