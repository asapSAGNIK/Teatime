from sources.rss_source import fetch_rss_stories
from sources.google_news_source import fetch_google_news
from sources.hn_source import fetch_hn_stories
from sources.guardian_source import fetch_guardian_stories
from sources.newsapi_source import fetch_news_api_stories
from models.schemas import RawStory
from typing import List


async def get_all_stories() -> List[RawStory]:
    """Aggregate stories from all sources and return the combined list."""
    rss_stories = await fetch_rss_stories()
    news_stories = await fetch_google_news()
    hn_stories = await fetch_hn_stories()
    guardian_stories = await fetch_guardian_stories()
    news_api_stories = await fetch_news_api_stories()
    
    return rss_stories + news_stories + hn_stories + guardian_stories + news_api_stories
