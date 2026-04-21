import httpx
from typing import List
from models.schemas import RawStory
from config import settings

async def fetch_guardian_stories() -> List[RawStory]:
    """Fetch high-quality journalism and photos from The Guardian API."""
    if not settings.GUARDIAN_API_KEY:
        return []
    
    stories: List[RawStory] = []
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            res = await client.get(
                "https://content.guardianapis.com/search",
                params={
                    "api-key": settings.GUARDIAN_API_KEY,
                    "show-fields": "all",
                    "page-size": 10
                }
            )
            if res.status_code == 200:
                data = res.json().get("response", {}).get("results", [])
                for item in data:
                    fields = item.get("fields", {})
                    stories.append(RawStory(
                        title=item.get("webTitle", ""),
                        summary=fields.get("trailText", ""),
                        source_url=item.get("webUrl", ""),
                        category="World & Politics", # Default, mapping could be smarter
                        image_url=fields.get("thumbnail")
                    ))
        print(f"Guardian: Fetched {len(stories)} premium stories.")
    except Exception as e:
        print(f"Guardian API error: {e}")
    return stories
