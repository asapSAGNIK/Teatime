from models.schemas import RawStory, ResearchBrief

async def research_story(story: RawStory) -> ResearchBrief:
    """
    Takes a raw story signal and builds a structured research brief for the writer agent.
    """
    facts = [story.summary, f"Originally sourced from: {story.source_url}"]

    if story.virlo_data:
        facts.append(
            f"Trending heavily on social platforms with {story.virlo_data.get('views', 0)} views "
            f"across {story.virlo_data.get('count', 0)} videos."
        )

    return ResearchBrief(
        title=story.title,
        facts=facts,
        perspectives=[],
        social_context=story.virlo_data,
        category=story.category,
    )
