import feedparser
from typing import List
from models.schemas import RawStory

def _map_to_category(text: str) -> str:
    CATEGORY_KEYWORD_MAP = {
        "Tech & AI": ["tech", "ai", "crypto", "coding", "software", "app", "robot", "gaming"],
        "Business & Finance": ["finance", "money", "business", "stock", "market", "economy", "brand", "fed", "bank"],
        "Sports": ["sports", "nba", "nfl", "soccer", "football", "gym", "fitness", "athlete", "game"],
        "World & Politics": ["politics", "war", "election", "government", "protest", "law"],
    }
    text_lower = text.lower()
    for category, keywords in CATEGORY_KEYWORD_MAP.items():
        if any(kw in text_lower for kw in keywords):
            return category
    return "Culture & Entertainment"


async def fetch_google_trends() -> List[RawStory]:
    """Fetch real trending topics from Google Trends RSS."""
    stories: List[RawStory] = []

    try:
        feed = feedparser.parse("https://trends.google.com/trending/rss?geo=US")
        for i, entry in enumerate(feed.entries[:10]):
            title = entry.title
            desc = getattr(entry, 'ht_news_item_snippet', entry.get("summary", ""))
            if not desc:
                desc = entry.get("summary", "")
            source_url = entry.link
            
            image_url = None
            if hasattr(entry, 'ht_picture'):
                image_url = entry.ht_picture

            category = _map_to_category(f"{title} {desc}")

            story = RawStory(
                title=title,
                summary=desc,
                source_url=source_url,
                category=category,
                image_url=image_url,
                virlo_data={
                    "name": title,
                    "description": desc,
                    "ranking": i + 1,
                    "source": "google_trends",
                },
            )
            stories.append(story)
            
        print(f"Google Trends: Fetched {len(stories)} trending topics.")
    except Exception as e:
        print(f"❌ Google Trends error: {e}")

    return stories
