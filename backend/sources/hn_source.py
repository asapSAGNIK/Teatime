import httpx
from typing import List
from models.schemas import RawStory

async def fetch_hn_stories() -> List[RawStory]:
    """Fetch top tech stories from Hacker News API."""
    stories: List[RawStory] = []
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            # Get top 15 story IDs
            resp = await client.get("https://hacker-news.firebaseio.com/v0/topstories.json")
            if resp.status_code == 200:
                ids = resp.json()[:10]
                for item_id in ids:
                    item_resp = await client.get(f"https://hacker-news.firebaseio.com/v0/item/{item_id}.json")
                    if item_resp.status_code == 200:
                        item = item_resp.json()
                        if item.get("url") and item.get("title"):
                            stories.append(RawStory(
                                title=item.get("title"),
                                summary=f"Tech Discussion - Score: {item.get('score', 0)}",
                                source_url=item.get("url"),
                                category="Tech & AI"
                            ))
        print(f"Hacker News: Fetched {len(stories)} tech stories.")
    except Exception as e:
        print(f"Hacker News error: {e}")
    return stories
