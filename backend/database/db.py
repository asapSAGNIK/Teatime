import aiosqlite
from database.constants import DATABASE_URL

async def init_db():
    """Create tables if they don't already exist."""
    async with aiosqlite.connect(DATABASE_URL) as conn:
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS articles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                slug TEXT UNIQUE NOT NULL,
                headline TEXT NOT NULL,
                subtitle TEXT NOT NULL,
                body TEXT NOT NULL,
                category TEXT NOT NULL,
                tags TEXT NOT NULL,
                read_time INTEGER DEFAULT 5,
                image_url TEXT,
                source_urls TEXT,
                virlo_data TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS trending_cache (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                data TEXT NOT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS pipeline_runs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                stories_found INTEGER DEFAULT 0,
                articles_written INTEGER DEFAULT 0,
                status TEXT
            )
        """)
        await conn.commit()
