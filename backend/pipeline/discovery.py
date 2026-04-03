from typing import List
from models.schemas import RawStory
from sources import get_all_stories
from pipeline.deduplicator import check_is_duplicate  # New import

CATEGORIES = [
    "Tech & AI",
    "Business & Finance",
    "Sports",
    "Culture & Entertainment",
    "World & Politics",
]


async def run_discovery(max_stories: int = 5) -> List[RawStory]:
    """
    1. Fetches stories from all sources (RSS + Virlo).
    2. Deduplicates by title (Fast string match).
    3. Picks potential candidates across categories.
    4. Performs semantic deduplication (LLM) to cluster similar stories.
    """
    raw_stories = await get_all_stories()

    if not raw_stories:
        return []

    # 1. Deduplicate on lowercased title (Fast filter)
    seen_titles: set = set()
    unique_stories: List[RawStory] = []
    for story in raw_stories:
        key = story.title.lower()
        if key not in seen_titles:
            seen_titles.add(key)
            unique_stories.append(story)

    # 2. Bucket stories by category
    buckets: dict[str, List[RawStory]] = {cat: [] for cat in CATEGORIES}
    for story in unique_stories:
        if story.category in buckets:
            if story.virlo_data:
                buckets[story.category].insert(0, story)  # Virlo → front
            else:
                buckets[story.category].append(story)

    # 3. Select candidates (Batch size 2x max to allow for filtering)
    candidates: List[RawStory] = []
    for cat in CATEGORIES:
        candidates.extend(buckets[cat][:3])  # Top 3 per category

    # 4. Semantic Deduplication Pass (Top candidates against each other)
    final_selected: List[RawStory] = []
    final_titles: List[str] = []

    for story in candidates:
        if len(final_selected) >= max_stories:
            break
            
        # Is this story a duplicate of what we ALREADY selected in this batch?
        is_dup = await check_is_duplicate(story.title, final_titles)
        if not is_dup:
            final_selected.append(story)
            final_titles.append(story.title)
        else:
            print(f"🚦 Discovery clustered: Ignoring '{story.title}' (same as already selected)")

    return final_selected
