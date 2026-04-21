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


async def fetch_google_news() -> List[RawStory]:
    """Fetch headlines from Google News RSS instead of just search trends."""
    stories: List[RawStory] = []

    try:
        feed = feedparser.parse("https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en")
        for i, entry in enumerate(feed.entries[:10]):
            title = entry.title
            desc = entry.get("summary", "")
            source_url = entry.link
            
            category = _map_to_category(f"{title} {desc}")

            story = RawStory(
                title=title,
                summary=desc,
                source_url=source_url,
                category=category,
                virlo_data={
                    "name": title,
                    "description": desc,
                    "ranking": i + 1,
                    "source": "google_news_top",
                },
            )
            stories.append(story)
            
        print(f"Google News: Fetched {len(stories)} headlines.")
    except Exception as e:
        print(f"❌ Google News error: {e}")

    return stories
