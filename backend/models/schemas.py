from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class RawStory(BaseModel):
    title: str
    summary: str
    source_url: str
    published_date: Optional[str] = None
    category: str
    virlo_data: Optional[dict] = None  # Store social metrics here

class ResearchBrief(BaseModel):
    title: str
    facts: List[str]
    perspectives: List[str]
    social_context: Optional[dict] = None
    category: str

class ArticleCreate(BaseModel):
    headline: str
    subtitle: str
    body: str
    category: str
    tags: List[str]
    read_time: int
    image_url: Optional[str] = None
    source_urls: List[str]
    virlo_data: Optional[dict] = None

class ArticleResponse(ArticleCreate):
    id: int
    slug: str
    created_at: datetime
    
    class Config:
        from_attributes = True
