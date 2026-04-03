from fastapi import APIRouter, HTTPException, Query
from typing import List

from database import crud
from models import schemas

router = APIRouter()

@router.get("/articles", response_model=List[schemas.ArticleResponse])
async def get_all_articles(
    category: str = Query(None),
    limit: int = Query(10, le=50),
    offset: int = Query(0),
):
    return await crud.get_articles(category=category, limit=limit, offset=offset)

@router.get("/articles/{slug}", response_model=schemas.ArticleResponse)
async def get_article(slug: str):
    article = await crud.get_article_by_slug(slug)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    return article

@router.get("/categories")
async def get_categories():
    return ["Tech & AI", "Business & Finance", "Sports", "Culture & Entertainment", "World & Politics"]
