import re
from typing import Optional
from groq import Groq
from models.schemas import ResearchBrief, ArticleCreate
from config import settings
from pipeline.prompts import WRITER_SYSTEM_PROMPT

GROQ_MODEL = "llama-3.1-8b-instant"

groq_client = Groq(api_key=settings.GROQ_API_KEY) if settings.GROQ_API_KEY else None


async def write_article(brief: ResearchBrief) -> Optional[ArticleCreate]:
    """Drafts a structured article using Groq. Returns None if generation fails."""
    if not groq_client:
        raise ValueError("Cannot write article: GROQ_API_KEY is missing.")

    prompt = f"""
    Create a professional news report for this research brief. Ensure the body is highly detailed, comprehensive, and MINIMUM 4 full paragraphs (at least 300 words).

    Title: {brief.title}
    Facts: {brief.facts}
    Category: {brief.category}
    Social: {brief.social_context if brief.social_context else 'None'}

    CRITICAL INSTRUCTION: You MUST format your entire response using the exact XML tags below. Do not use JSON or Markdown code blocks.
    
    <headline>Write headline here</headline>
    <subtitle>Write subtitle here</subtitle>
    <body>Write your massive 4+ paragraph body text here exactly as it should be printed, with standard text and newlines.</body>
    <read_time>5</read_time>
    """

    try:
        completion = groq_client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "system", "content": WRITER_SYSTEM_PROMPT},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=2048,
        )

        raw_text = completion.choices[0].message.content

        def extract(tag):
            match = re.search(f"<{tag}>(.*?)</{tag}>", raw_text, re.DOTALL)
            return match.group(1).strip() if match else ""

        extracted_body = extract("body")
        
        # Basic validation to ensure we don't return garbage
        if not extracted_body or len(extracted_body) < 100:
            print(f"⚠️ AI returned thin content for '{brief.title}'. Skipping.")
            return None

        try:
            r_time = int(extract("read_time"))
        except:
            r_time = 5

        return ArticleCreate(
            headline=extract("headline") or brief.title,
            subtitle=extract("subtitle") or "Developing coverage.",
            body=extracted_body,
            category=brief.category,
            tags=[],
            read_time=r_time,
            source_urls=[],
            virlo_data=brief.social_context,
        )

    except Exception as e:
        print(f"❌ Groq Writing ERROR: {e}")
        return None
