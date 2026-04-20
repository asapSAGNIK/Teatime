from sources.rss_source import fetch_rss_stories
from sources.google_trends_source import fetch_google_trends
from models.schemas import RawStory
from typing import List


async def get_all_stories() -> List[RawStory]:
    """Aggregate stories from all sources and return the combined list."""
    rss_stories = await fetch_rss_stories()
    trends_stories = await fetch_google_trends()
    return rss_stories + trends_stories
