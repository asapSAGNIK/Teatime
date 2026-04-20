import httpx
import feedparser
from fastapi import APIRouter
from config import settings

from database.crud import get_trending_cache, update_trending_cache

router = APIRouter()

@router.get("/trending")
async def get_trending():
    """Returns the latest Pulse & Viral data from the local cache for instant loading."""
    cached = await get_trending_cache()
    if cached:
        return cached
    # Fallback to empty structure if nothing cached yet
    return {"trends": [], "niches": [], "instagram": [], "youtube": [], "creators": [], "videos": []}


async def sync_trending_data():
    """Background task to fetch fresh data from free APIs and update the cache."""
    result = {
        "trends": [],
        "niches": [],
        "instagram": [],
        "youtube": [],
        "creators": [],
        "videos": []
    }

    # 1. FETCH TRENDS (Google Trends RSS)
    try:
        feed = feedparser.parse("https://trends.google.com/trending/rss?geo=US")
        for i, entry in enumerate(feed.entries[:5]): # Top 5 trends
            desc = getattr(entry, 'ht_news_item_snippet', entry.get("summary", ""))
            if not desc:
                desc = entry.get("summary", "")
            
            # Map image if exists
            image_url = None
            if hasattr(entry, 'ht_picture'):
                image_url = entry.ht_picture

            result["trends"].append({
                "name": entry.title,
                "description": desc,
                "ranking": i + 1,
                "image": image_url
            })
    except Exception as e:
        print(f"Failed to fetch Google Trends: {e}")

    # 2. FETCH NICHES (Reddit r/news Hot JSON) - acts as our bulletin
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            res = await client.get(
                "https://www.reddit.com/r/news/hot.json?limit=5",
                headers={"User-Agent": "AetherNews/1.0"}
            )
            if res.status_code == 200:
                data = res.json().get("data", {}).get("children", [])
                for item in data:
                    post = item.get("data", {})
                    name = post.get("title", "")
                    # Reddit uses upvotes which Maps to report_count in our UI
                    result["niches"].append({
                        "name": name,
                        "report_count": post.get("ups", 0)
                    })
    except Exception as e:
        print(f"Failed to fetch Reddit Niches: {e}")

    # 3. FETCH SOCIALS (YouTube Data API - Most Popular)
    if settings.YOUTUBE_API_KEY:
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                res = await client.get(
                    "https://www.googleapis.com/youtube/v3/videos",
                    params={
                        "part": "snippet,statistics",
                        "chart": "mostPopular",
                        "regionCode": "US",
                        "maxResults": 5,
                        "key": settings.YOUTUBE_API_KEY
                    }
                )
                if res.status_code == 200:
                    items = res.json().get("items", [])
                    processed = []
                    for v in items:
                        snippet = v.get("snippet", {})
                        stats = v.get("statistics", {})
                        
                        thumbs = snippet.get("thumbnails", {})
                        thumbnail_url = thumbs.get("high", {}).get("url", "")
                        if not thumbnail_url:
                            thumbnail_url = thumbs.get("default", {}).get("url", "")
                            
                        processed.append({
                            "url": f"https://www.youtube.com/watch?v={v.get('id')}",
                            "description": snippet.get("title", ""),
                            "views": int(stats.get("viewCount", 0)),
                            "thumbnail": thumbnail_url,
                            "platform": "youtube",
                            "likes": int(stats.get("likeCount", 0))
                        })
                    result["youtube"] = processed
                    result["videos"].extend(processed)
        except Exception as e:
            print(f"Failed to fetch YouTube videos: {e}")

    # Update the database cache with results
    await update_trending_cache(result)
    return result
