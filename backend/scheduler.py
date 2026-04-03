from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from datetime import datetime
import asyncio

# Absolute imports — no dots
from pipeline.discovery import run_discovery
from pipeline.researcher import research_story
from pipeline.writer import write_article
from pipeline.editor import run_editor_pass
from pipeline.deduplicator import check_is_duplicate
from database.crud import create_article, is_article_duplicate, delete_old_articles, get_articles
from api.trending import sync_trending_data

async def pipeline_job():
    print(f"[{datetime.now()}] Running news pipeline...")
    
    # 1. AUTO-CLEANUP
    await delete_old_articles(hours=24)
    print("-> 24-hour cleanup complete.")

    # 2. SYNC TRENDS (Pulse Sidebar) - No longer blocks the user!
    print("-> Syncing social trends in background...")
    try:
        await sync_trending_data()
    except Exception as e:
        print(f"-> Trends sync failed: {e}")

    top_stories = await run_discovery(max_stories=5)
    print(f"Discovered {len(top_stories)} stories to cover.")

    # Fetch recently published headlines for final cross-check
    recent_articles = await get_articles(limit=15)
    recent_headlines = [a["headline"] for a in recent_articles]

    written = 0
    for story in top_stories:
        try:
            # 1. FAST DEDUPLICATION (Exact URL match)
            if await is_article_duplicate(story.source_url):
                print(f"-> Skipping (URL): '{story.title}' (Already Published)")
                continue

            # 2. SEMANTIC DEDUPLICATION (LLM cross-check against recent history)
            if await check_is_duplicate(story.title, recent_headlines):
                print(f"🚦 Semantic Skip: '{story.title}' is already covered in a recent article.")
                continue

            print(f"-> Researching: {story.title}")
            brief = await research_story(story)

            print(f"-> Writing: {brief.title}")
            draft = await write_article(brief)

            # SKIP if the writer returned None or failed
            if not draft:
                print(f"⚠️ Writer could not produce a quality report for '{story.title}'. Skipping...")
                continue

            print(f"-> Editing: {draft.headline}")
            final_article = await run_editor_pass(draft)

            final_article.source_urls = [story.source_url]

            print(f"-> Publishing: {final_article.headline}")
            await create_article(final_article)
            written += 1

            # Brief pause to respect API rate limits
            await asyncio.sleep(2)
        except Exception as e:
            print(f"Failed to process '{story.title}': {e}")

    print(f"[{datetime.now()}] Pipeline finished. Wrote {written} articles.")

scheduler = AsyncIOScheduler()

def start_scheduler():
    scheduler.add_job(
        pipeline_job,
        trigger=IntervalTrigger(hours=2),
        id="news_pipeline",
        replace_existing=True,
    )
    scheduler.start()
    print("Scheduler started. Pipeline will run every 2 hours.")
