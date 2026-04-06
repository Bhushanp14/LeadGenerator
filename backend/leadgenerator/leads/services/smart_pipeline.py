"""
Smart Reddit Lead Discovery Pipeline (Scoring-Based)
Steps:
  1. Seed / read monitored subreddits
  2. Scrape new posts
  3. Deduplicate against SmartRedditLead table
  4. Local AI classification (Scoring + ML) returning Lead / Maybe Lead / Noise
  5. Store results into SmartRedditLead with confidence metadata
"""

import logging
from django.utils import timezone
from django.db import IntegrityError

from leads.models import SmartRedditLead, MonitoredSubreddit
from leads.services.reddit_scraper import fetch_new_posts
from leads.services.smart_classifier import classify_posts

logger = logging.getLogger(__name__)

BATCH_SIZE = 50


def get_monitored_subreddits() -> dict[str, list[str]]:
    """Return {service_category: [subreddits]} from the DB."""
    mapping: dict[str, list[str]] = {}
    for entry in MonitoredSubreddit.objects.all():
        mapping.setdefault(entry.service_category, []).append(entry.subreddit)
    return mapping


def run_smart_pipeline() -> dict:
    """
    Main smart pipeline entry point.
    Returns stats dict: {scraped, analyzed, classified_lead, classified_maybe, stored, skipped}
    """
    category_map = get_monitored_subreddits()
    existing_ids = set(SmartRedditLead.objects.values_list("reddit_post_id", flat=True))

    stats = {
        "scraped": 0,
        "analyzed": 0,
        "classified_lead": 0,
        "classified_maybe": 0,
        "stored": 0,
        "skipped": 0,
    }

    all_candidate_posts: list[dict] = []

    # 1. Collect and deduplicate all new posts across all categories
    for category, subreddits in category_map.items():
        for subreddit in subreddits:
            import time
            time.sleep(3.0)  # Moderate sleep to avoid Reddit 429
            posts = fetch_new_posts(subreddit)
            print(f"  [Scraping] r/{subreddit}: Found {len(posts)} new posts.")
            stats["scraped"] += len(posts)

            for post in posts:
                post_id = post.get("post_id", "")
                if not post_id or post_id in existing_ids:
                    stats["skipped"] += 1
                    continue

                all_candidate_posts.append({**post, "service_category": category})

    stats["analyzed"] = len(all_candidate_posts)
    print(f"\n>> Total candidate posts for analysis: {stats['analyzed']}")

    if not all_candidate_posts:
        return stats

    # 2. Local Classification (Scoring + ML)
    all_results: list[dict] = []
    for i in range(0, len(all_candidate_posts), BATCH_SIZE):
        batch = all_candidate_posts[i : i + BATCH_SIZE]
        print(f"  [Local Classifier] Analyzing posts {i+1} to {min(i+BATCH_SIZE, len(all_candidate_posts))}...")
        batch_results = classify_posts(batch)
        all_results.extend(batch_results)

    # 3. Store results (Lead & Maybe Lead)
    for post, result in zip(all_candidate_posts, all_results):
        classification = result["classification"]
        
        if classification == "noise":
            continue

        if classification == "lead":
            stats["classified_lead"] += 1
        elif classification == "maybe_lead":
            stats["classified_maybe"] += 1

        post_id = post["post_id"]

        try:
            SmartRedditLead.objects.create(
                reddit_post_id=post_id,
                title=post["title"],
                subreddit=post["subreddit"],
                author=post["author"],
                url=post["url"],
                ups=post["ups"],
                created_at=post["created_utc"] or timezone.now(),
                service_category=post["service_category"],
                # New metadata fields
                classification=classification,
                confidence_score=result["confidence_score"],
                reason_tags=result["reason_tags"],
                explanation=result["explanation"],
            )
            existing_ids.add(post_id)
            stats["stored"] += 1
        except IntegrityError:
            stats["skipped"] += 1

    return stats


def expire_old_smart_leads(days: int = 45) -> int:
    """Delete SmartRedditLeads older than `days` days."""
    cutoff = timezone.now() - timezone.timedelta(days=days)
    deleted, _ = SmartRedditLead.objects.filter(scraped_at__lt=cutoff).delete()
    if deleted:
        logger.info("[SmartPipeline] Expired %d leads older than %d days.", deleted, days)
    return deleted
