import httpx
from typing import List
from models.schemas import RawStory
from config import settings

async def fetch_news_api_stories() -> List[RawStory]:
    """Fetch broad global news using NewsAPI.org."""
    if not settings.NEWS_API_KEY:
        return []
    
    stories: List[RawStory] = []
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            res = await client.get(
                "https://newsapi.org/v2/top-headlines",
                params={
                    "apiKey": settings.NEWS_API_KEY,
                    "language": "en",
                    "pageSize": 10
                }
            )
            if res.status_code == 200:
                data = res.json().get("articles", [])
                for item in data:
                    stories.append(RawStory(
                        title=item.get("title", ""),
                        summary=item.get("description", ""),
                        source_url=item.get("url", ""),
                        category="World & Politics",
                        image_url=item.get("urlToImage")
                    ))
        print(f"NewsAPI: Fetched {len(stories)} global stories.")
    except Exception as e:
        print(f"NewsAPI error: {e}")
    return stories
