import re
from groq import Groq
from models.schemas import ArticleCreate
from config import settings
from pipeline.prompts import EDITOR_SYSTEM_PROMPT

GROQ_MODEL = "llama-3.3-70b-versatile"

groq_client = Groq(api_key=settings.GROQ_API_KEY) if settings.GROQ_API_KEY else None


async def run_editor_pass(draft: ArticleCreate) -> ArticleCreate:
    """Polishes a draft ArticleCreate using Groq with forced JSON output."""
    if not groq_client:
        return draft

    prompt = f"""
    Polish this news report for publication.
    Headline: {draft.headline}
    Subtitle: {draft.subtitle}
    Body: {draft.body}
    Read Time: {draft.read_time}

    Return your output exactly inside these tags:
    <headline>...</headline>
    <subtitle>...</subtitle>
    <body>...</body>
    <read_time>...</read_time>
    """

    try:
        completion = groq_client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "system", "content": EDITOR_SYSTEM_PROMPT},
                {"role": "user", "content": prompt}
            ],
            temperature=0.4,
            max_tokens=2048,
        )

        raw_text = completion.choices[0].message.content

        def extract(tag):
            match = re.search(f"<{tag}>(.*?)</{tag}>", raw_text, re.DOTALL)
            return match.group(1).strip() if match else ""

        extracted_headline = extract("headline")
        if extracted_headline: draft.headline = extracted_headline
        
        extracted_subtitle = extract("subtitle")
        if extracted_subtitle: draft.subtitle = extracted_subtitle
        
        extracted_body = extract("body")
        if extracted_body: draft.body = extracted_body
        
        try:
            r_t = extract("read_time")
            if r_t: draft.read_time = int(r_t)
        except:
            pass

        return draft

    except Exception as e:
        print(f"❌ Groq Editing ERROR: {e}")
        return draft
