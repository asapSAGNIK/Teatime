import aiosqlite
import json
import uuid
from typing import List, Optional

from database.constants import DATABASE_URL
from models.schemas import ArticleCreate


def _slugify(headline: str) -> str:
    """Create a URL-safe slug from a headline."""
    import re
    slug_base = re.sub(r"[^a-z0-9]+", "-", headline.lower()).strip("-")
    return f"{slug_base}-{str(uuid.uuid4())[:8]}"


async def create_article(article: ArticleCreate) -> str:
    """Persist a new article to the database. Returns the generated slug."""
    slug = _slugify(article.headline)
    async with aiosqlite.connect(DATABASE_URL) as conn:
        await conn.execute(
            """
            INSERT INTO articles
              (slug, headline, subtitle, body, category, tags, read_time,
               image_url, source_urls, virlo_data)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                slug,
                article.headline,
                article.subtitle,
                article.body,
                article.category,
                json.dumps(article.tags),
                article.read_time,
                article.image_url,
                json.dumps(article.source_urls),
                json.dumps(article.virlo_data) if article.virlo_data else None,
            ),
        )
        await conn.commit()
    return slug


def _deserialise_row(row: aiosqlite.Row) -> dict:
    """Convert a raw SQLite row into a fully deserialised dict."""
    d = dict(row)
    d["tags"] = json.loads(d["tags"])
    d["source_urls"] = json.loads(d["source_urls"])
    d["virlo_data"] = json.loads(d["virlo_data"]) if d.get("virlo_data") else None
    return d


async def get_articles(
    category: Optional[str] = None, limit: int = 10, offset: int = 0
) -> List[dict]:
    """Return a paginated list of articles, optionally filtered by category."""
    async with aiosqlite.connect(DATABASE_URL) as conn:
        conn.row_factory = aiosqlite.Row
        if category:
            cursor = await conn.execute(
                "SELECT * FROM articles WHERE category = ? ORDER BY created_at DESC LIMIT ? OFFSET ?",
                (category, limit, offset),
            )
        else:
            cursor = await conn.execute(
                "SELECT * FROM articles ORDER BY created_at DESC LIMIT ? OFFSET ?",
                (limit, offset),
            )
        rows = await cursor.fetchall()
    return [_deserialise_row(row) for row in rows]


async def get_article_by_slug(slug: str) -> Optional[dict]:
    """Fetch a single article by its slug. Returns None if not found."""
    async with aiosqlite.connect(DATABASE_URL) as conn:
        conn.row_factory = aiosqlite.Row
        cursor = await conn.execute(
            "SELECT * FROM articles WHERE slug = ?", (slug,)
        )
        row = await cursor.fetchone()
    return _deserialise_row(row) if row else None


async def is_article_duplicate(source_url: str) -> bool:
    """Check if an article with this source URL already exists in the database."""
    async with aiosqlite.connect(DATABASE_URL) as conn:
        # Check if the URL string exists anywhere in the source_urls JSON array
        cursor = await conn.execute(
            "SELECT 1 FROM articles WHERE source_urls LIKE ?",
            (f'%{source_url}%',)
        )
        row = await cursor.fetchone()
        return row is not None


async def delete_old_articles(hours: int = 24):
    """Remove articles older than the specified number of hours."""
    async with aiosqlite.connect(DATABASE_URL) as conn:
        await conn.execute(
            "DELETE FROM articles WHERE created_at < datetime('now', '-' || ? || ' hours')",
            (hours,)
        )
        await conn.commit()


async def get_trending_cache() -> Optional[dict]:
    """Retrieve the latest cached trending data."""
    async with aiosqlite.connect(DATABASE_URL) as conn:
        conn.row_factory = aiosqlite.Row
        cursor = await conn.execute(
            "SELECT data FROM trending_cache ORDER BY id DESC LIMIT 1"
        )
        row = await cursor.fetchone()
        return json.loads(row["data"]) if row else None


async def update_trending_cache(data: dict):
    """Save a new snapshot of trending data to the cache."""
    async with aiosqlite.connect(DATABASE_URL) as conn:
        await conn.execute(
            "INSERT INTO trending_cache (data) VALUES (?)",
            (json.dumps(data),)
        )
        # Keep only the last 5 snapshots to avoid bloat
        await conn.execute(
            "DELETE FROM trending_cache WHERE id NOT IN (SELECT id FROM trending_cache ORDER BY id DESC LIMIT 5)"
        )
        await conn.commit()
