import feedparser
from typing import List
from models.schemas import RawStory

RSS_FEEDS = {
    "World & Politics": [
        "http://feeds.bbci.co.uk/news/world/rss.xml",
        "http://feeds.reuters.com/Reuters/worldNews",
    ],
    "Tech & AI": [
        "https://techcrunch.com/feed/",
        "https://feeds.arstechnica.com/arstechnica/index",
        "https://www.theverge.com/rss/index.xml",
    ],
    "Business & Finance": [
        "https://feeds.a.dj.com/rss/WSJcomUSBusiness.xml",
        "http://feeds.reuters.com/reuters/businessNews",
    ],
    "Sports": [
        "http://feeds.bbci.co.uk/sport/rss.xml",
        "https://www.espn.com/espn/rss/news",
    ],
    "Culture & Entertainment": [
        "https://variety.com/feed/",
        "https://www.hollywoodreporter.com/feed/",
    ],
}


async def fetch_rss_stories() -> List[RawStory]:
    """Parse RSS feeds for each category and return a flat list of RawStory objects."""
    stories: List[RawStory] = []
    for category, feeds in RSS_FEEDS.items():
        for feed_url in feeds:
            try:
                feed = feedparser.parse(feed_url)
                for entry in feed.entries[:5]:
                    # Attempt to extract image
                    image_url = None
                    if "media_content" in entry and len(entry.media_content) > 0:
                        image_url = entry.media_content[0].get("url")
                    elif "media_thumbnail" in entry and len(entry.media_thumbnail) > 0:
                        image_url = entry.media_thumbnail[0].get("url")
                    elif "links" in entry:
                        for link in entry.links:
                            if "image" in link.get("type", ""):
                                image_url = link.get("href")
                                break
                    
                    story = RawStory(
                        title=entry.get("title", ""),
                        summary=entry.get("summary", entry.get("description", "")),
                        source_url=entry.get("link", ""),
                        published_date=entry.get("published", None),
                        category=category,
                        image_url=image_url
                    )
                    stories.append(story)
            except Exception as e:
                print(f"RSS error [{feed_url}]: {e}")
    return stories
