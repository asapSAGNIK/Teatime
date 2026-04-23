import httpx
import feedparser
import re
import asyncio
from fastapi import APIRouter
from config import settings

from database.crud import get_trending_cache, update_trending_cache

router = APIRouter()

def clean_html(text):
    """Remove HTML tags from a string."""
    return re.sub(r'<[^>]*>', '', text)

@router.get("/trending")
async def get_trending():
    """Returns the latest Pulse & Viral data from the local cache for instant loading."""
    cached = await get_trending_cache()
    if cached:
        return cached
    # Fallback to empty structure if nothing cached yet
    return {"trends": [], "niches": [], "instagram": [], "youtube": [], "creators": [], "videos": [], "weather": {}, "markets": []}


async def sync_trending_data():
    """Background task to fetch fresh data from free APIs and update the cache."""
    result = {
        "trends": [],
        "niches": [],
        "instagram": [],
        "youtube": [],
        "creators": [],
        "videos": [],
        "weather": {},
        "markets": []
    }

    # 1. FETCH TRENDS (Google News RSS)
    try:
        feed = feedparser.parse("https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en")
        for i, entry in enumerate(feed.entries[:5]):
            desc = clean_html(entry.get("summary", ""))
            if len(desc) > 150:
                desc = desc[:147] + "..."
                
            result["trends"].append({
                "name": entry.title,
                "description": desc,
                "ranking": i + 1,
                "image": None 
            })
    except Exception as e:
        print(f"Failed to fetch Google News: {e}")

    # 2. FETCH NICHES (Reddit r/news etc)
    subreddits = ["worldnews", "technology", "politics"]
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            for sub in subreddits:
                res = await client.get(
                    f"https://www.reddit.com/r/{sub}/hot.json?limit=2",
                    headers={"User-Agent": "AetherNews/1.0"}
                )
                if res.status_code == 200:
                    data = res.json().get("data", {}).get("children", [])
                    for item in data:
                        post = item.get("data", {})
                        result["niches"].append({
                            "name": f"[{sub.upper()}] {post.get('title', '')}",
                            "report_count": post.get("ups", 0)
                        })
    except Exception as e:
        print(f"Failed to fetch Reddit Niches: {e}")

    # 3. FETCH MARKETS (Alpha Vantage) - Reduced to 2 symbols to respect strict Free-tier minute/day limits
    if settings.ALPHAVANTAGE_API_KEY:
        symbols = ["DIA", "QQQ"] # Dow & Nasdaq proxies
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                for symbol in symbols:
                    mres = await client.get(
                        "https://www.alphavantage.co/query",
                        params={
                            "function": "GLOBAL_QUOTE",
                            "symbol": symbol,
                            "apikey": settings.ALPHAVANTAGE_API_KEY
                        }
                    )
                    if mres.status_code == 200:
                        quote = mres.json().get("Global Quote", {})
                        if quote and quote.get("01. symbol"):
                            result["markets"].append({
                                "symbol": quote.get("01. symbol"),
                                "price": quote.get("05. price"),
                                "change": quote.get("09. change"),
                                "change_percent": quote.get("10. change percent")
                            })
                    # Tiny pause to avoid "5 calls per minute" burst limit
                    await asyncio.sleep(1) 
        except Exception as e:
            print(f"Markets fetch failed: {e}")

    # 4. FETCH SOCIALS (YouTube Category 25)
    if settings.YOUTUBE_API_KEY:
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                res = await client.get(
                    "https://www.googleapis.com/youtube/v3/videos",
                    params={
                        "part": "snippet,statistics",
                        "chart": "mostPopular",
                        "regionCode": "US",
                        "videoCategoryId": "25",
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
                        thumbnail_url = thumbs.get("high", {}).get("url", "") or thumbs.get("default", {}).get("url", "")
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

    # 5. WEATHER DESK
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            res = await client.get("https://api.open-meteo.com/v1/forecast?latitude=40.71&longitude=-74.01&current_weather=true")
            if res.status_code == 200:
                cw = res.json().get("current_weather", {})
                result["weather"] = {
                    "temp": cw.get("temperature"),
                    "city": "NEWSROOM (NY)"
                }
    except Exception as e:
        print(f"Weather fetch failed: {e}")

    # Update the database cache with results
    await update_trending_cache(result)
    return result
