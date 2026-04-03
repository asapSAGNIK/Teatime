import httpx
from fastapi import APIRouter
from config import settings

from database.crud import get_trending_cache, update_trending_cache

router = APIRouter()

VIRLO_BASE_URL = "https://api.virlo.ai/v1"


@router.get("/trending")
async def get_trending():
    """Returns the latest Pulse & Viral data from the local cache for instant loading."""
    cached = await get_trending_cache()
    if cached:
        return cached
    # Fallback to empty structure if nothing cached yet
    return {"trends": [], "niches": [], "instagram": [], "youtube": [], "creators": [], "videos": []}


async def sync_trending_data():
    """Background task to fetch fresh data from Virlo and update the cache."""
    if not settings.VIRLO_API_KEY:
        return

    headers = {"Authorization": f"Bearer {settings.VIRLO_API_KEY}"}
    result = {
        "trends": [],
        "niches": [],
        "instagram": [],
        "youtube": [],
        "creators": [],
        "videos": []
    }

    async with httpx.AsyncClient(timeout=20) as client:
        # 1. FETCH TRENDS
        try:
            tres = await client.get(f"{VIRLO_BASE_URL}/trends/digest", headers=headers)
            if tres.status_code == 200:
                data = tres.json().get("data", [])
                for group in data:
                    for entry in group.get("trends", []):
                        trend = entry.get("trend", {})
                        if trend.get("name"):
                            result["trends"].append({
                                "name": trend["name"],
                                "description": trend.get("description", ""),
                                "ranking": entry.get("ranking", 0),
                            })
        except Exception: pass

        # 2. FETCH NICHES
        try:
            nres = await client.get(f"{VIRLO_BASE_URL}/niches", headers=headers)
            if nres.status_code == 200:
                result["niches"] = nres.json().get("data", [])[:10]
        except Exception: pass

        # 3. FETCH SOCIALS
        platforms = ["instagram", "youtube"]
        for platform in platforms:
            try:
                pres = await client.get(f"{VIRLO_BASE_URL}/{platform}/videos/digest", 
                                        headers=headers, params={"limit": 5})
                if pres.status_code == 200:
                    vids = pres.json().get("data", [])
                    processed = []
                    for v in vids:
                        item = {
                            "url": v.get("url", ""),
                            "description": v.get("description", ""),
                            "views": v.get("views", 0),
                            "thumbnail": v.get("thumbnail_url", ""),
                            "platform": platform,
                            "likes": v.get("number_of_likes", 0)
                        }
                        processed.append(item)
                    result[platform] = processed
                    result["videos"].extend(processed)
            except Exception: pass

    # Update the database cache with results
    await update_trending_cache(result)
    return result
