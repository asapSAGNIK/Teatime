import re
from typing import List, Optional
from groq import Groq
from config import settings

GROQ_MODEL = "llama-3.1-8b-instant"

groq_client = Groq(api_key=settings.GROQ_API_KEY) if settings.GROQ_API_KEY else None

DEDUPE_SYSTEM_PROMPT = """
You are a news curator. Your job is to determine if a NEW story is a duplicate of a PREVIOUS story.
A "duplicate" means they cover the exact same event or announcement, even if the wording or source is different.

ONLY output 'YES' if they are duplicates.
ONLY output 'NO' if they are distinct stories.
DO NOT provide any explanation.
"""

async def check_is_duplicate(new_title: str, existing_titles: List[str]) -> bool:
    """Uses a fast LLM to check if the new_title is semantically identical to any of the existing_titles."""
    if not groq_client:
        return False
    
    if not existing_titles:
        return False

    # limit to 15 titles for context window
    context = "\n".join([f"- {t}" for t in existing_titles[:15]])
    
    prompt = f"""
NEW STORY: {new_title}

PREVIOUS STORIES:
{context}

Is the NEW STORY already covered by any of the PREVIOUS STORIES above? (YES/NO)
"""

    try:
        # Using a fast, cheap model for this utility task
        completion = groq_client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "system", "content": DEDUPE_SYSTEM_PROMPT},
                {"role": "user", "content": prompt}
            ],
            temperature=0.0, # Deterministic
            max_tokens=5,
        )

        response = completion.choices[0].message.content.strip().upper()
        return "YES" in response
    except Exception as e:
        print(f"⚠️ Deduplication check error: {e}")
        return False
