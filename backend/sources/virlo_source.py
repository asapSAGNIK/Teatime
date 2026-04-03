import httpx
import datetime
from typing import List
from models.schemas import RawStory
from config import settings

VIRLO_BASE_URL = "https://api.virlo.ai/v1"

CATEGORY_KEYWORD_MAP = {
    "Tech & AI": ["tech", "ai", "crypto", "coding", "software", "app", "robot", "gaming"],
    "Business & Finance": ["finance", "money", "business", "stock", "market", "economy", "brand"],
    "Sports": ["sports", "nba", "nfl", "soccer", "football", "gym", "fitness", "athlete", "game"],
    "World & Politics": ["politics", "war", "election", "government", "protest", "law"],
}
DEFAULT_CATEGORY = "Culture & Entertainment"


def _map_to_category(text: str) -> str:
    text_lower = text.lower()
    for category, keywords in CATEGORY_KEYWORD_MAP.items():
        if any(kw in text_lower for kw in keywords):
            return category
    return DEFAULT_CATEGORY


async def fetch_virlo_trends() -> List[RawStory]:
    """Fetch real trending topics from /v1/trends/digest — rich data with names and descriptions."""
    if not settings.VIRLO_API_KEY:
        print("No VIRLO_API_KEY set — skipping Virlo source.")
        return []

    headers = {"Authorization": f"Bearer {settings.VIRLO_API_KEY}"}
    stories: List[RawStory] = []

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.get(
                f"{VIRLO_BASE_URL}/trends/digest",
                headers=headers,
            )

            if response.status_code == 200:
                data = response.json()
                trend_groups = data.get("data", [])

                for group in trend_groups:
                    for trend_entry in group.get("trends", []):
                        trend = trend_entry.get("trend", {})
                        name = trend.get("name", "")
                        description = trend.get("description", "")
                        ranking = trend_entry.get("ranking", 0)

                        if not name:
                            continue

                        category = _map_to_category(f"{name} {description}")

                        story = RawStory(
                            title=name,
                            summary=description,
                            source_url=f"https://virlo.ai",
                            category=category,
                            virlo_data={
                                "name": name,
                                "description": description,
                                "ranking": ranking,
                                "source": "virlo_trends_digest",
                            },
                        )
                        stories.append(story)

                print(f"Virlo: Fetched {len(stories)} trending topics.")
            else:
                print(f"🚨 Virlo Trends Error {response.status_code}: {response.text}")

    except Exception as e:
        print(f"❌ Virlo connection error: {e}")

    return stories
