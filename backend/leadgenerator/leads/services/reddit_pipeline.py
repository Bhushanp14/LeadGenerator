"""
Reddit Lead Discovery Pipeline
Orchestrates: subreddit loading → scraping → deduplication → classification → storage.
"""

from django.utils import timezone
from django.db import IntegrityError

from leads.models import RedditLead, MonitoredSubreddit
from leads.services.reddit_scraper import fetch_new_posts
from leads.services.ai_classifier import classify_post


# Default subreddit mapping — seeded on first run
DEFAULT_SUBREDDIT_MAP: dict[str, list[str]] = {
    "web_development": [
        "startups", "webdev", "Entrepreneur", "smallbusiness", "learnprogramming",
        "javascript", "reactjs", "node", "wordpress", "learnwebdev",
        "Frontend", "forhire", "webmasters"
    ],
    "seo": [
        "SEO", "marketing", "Entrepreneur", "BigSEO", "localseo",
        "AskMarketing", "webmasters", "smallbusiness", "growthhacking",
        "content_marketing", "forhire"
    ],
    "shopify": [
        "shopify", "ecommerce", "Entrepreneur", "ShopifyPlus", "ShopifyWebsites",
        "shopify_hustlers", "shopifyDev", "ShopifyThemes", "websiteservices",
        "forhire", "webdev"
    ],
    "digital_marketing": [
        "marketing", "Entrepreneur", "AskMarketing", "advertising",
        "SocialMediaMarketing", "growthhacking", "smallbusiness", "startups",
        "forhire", "content_marketing"
    ],
    "design": [
        "design", "graphic_design", "UXDesign", "DesignJobs", "web_design",
        "UI_Design", "logodesign", "Branding", "forhire", "freelancedesign",
        "GraphicDesignRequests"
    ],
    "app_development": [
        "startups", "androiddev", "iOSProgramming", "Entrepreneur", "AppDevelopers",
        "flutterdev", "reactnative", "appdev", "gamedev", "unity3d", "forhire",
        "learnprogramming"
    ],
    "automation_ai": [
        "automation", "Python", "artificial", "MachineLearning", "ChatGPT",
        "OpenAI", "n8n", "Make", "rpa", "nocode", "PowerAutomate", "forhire"
    ],
}


def seed_default_subreddits():
    """
    Upsert default subreddits from DEFAULT_SUBREDDIT_MAP into MonitoredSubreddit.
    Safe to call on every run — adds any missing defaults without removing
    existing rows (including user-added custom subreddits).
    """
    to_create = []
    for category, subreddits in DEFAULT_SUBREDDIT_MAP.items():
        for sub in subreddits:
            to_create.append(
                MonitoredSubreddit(
                    service_category=category,
                    subreddit=sub,
                    is_custom=False,
                )
            )
    inserted = MonitoredSubreddit.objects.bulk_create(to_create, ignore_conflicts=True)
    new_count = len([x for x in inserted if x.pk])
    if new_count:
        print(f"[Pipeline] Added {new_count} new default subreddits.")
    else:
        print(f"[Pipeline] All default subreddits already present — nothing to seed.")


def get_monitored_subreddits() -> dict[str, list[str]]:
    """Return {service_category: [subreddits]} from the DB."""
    mapping: dict[str, list[str]] = {}
    for entry in MonitoredSubreddit.objects.all():
        mapping.setdefault(entry.service_category, []).append(entry.subreddit)
    return mapping


def run_pipeline() -> dict:
    """
    Main pipeline entry point.
    Returns stats dict: {scraped, classified, stored, skipped}.
    """
    seed_default_subreddits()

    category_map = get_monitored_subreddits()
    existing_ids = set(RedditLead.objects.values_list("reddit_post_id", flat=True))

    stats = {"scraped": 0, "classified": 0, "stored": 0, "skipped": 0}

    for category, subreddits in category_map.items():
        for subreddit in subreddits:
            posts = fetch_new_posts(subreddit)
            stats["scraped"] += len(posts)

            for post in posts:
                post_id = post["post_id"]

                # Skip already-stored posts
                if not post_id or post_id in existing_ids:
                    stats["skipped"] += 1
                    continue

                # Classify
                result = classify_post(post["title"], post["subreddit"])
                stats["classified"] += 1

                if not result["is_service_request"]:
                    continue

                # Store
                try:
                    RedditLead.objects.create(
                        reddit_post_id=post_id,
                        title=post["title"],
                        subreddit=post["subreddit"],
                        author=post["author"],
                        url=post["url"],
                        ups=post["ups"],
                        created_at=post["created_utc"] or timezone.now(),
                        service_category=result["service_category"],
                        ai_confidence=result["confidence"],
                    )
                    existing_ids.add(post_id)
                    stats["stored"] += 1
                except IntegrityError:
                    # Duplicate — already exists from concurrent run
                    stats["skipped"] += 1

    return stats


def expire_old_leads(days: int = 45):
    """Delete leads older than `days` days."""
    cutoff = timezone.now() - timezone.timedelta(days=days)
    deleted, _ = RedditLead.objects.filter(scraped_at__lt=cutoff).delete()
    if deleted:
        print(f"[Pipeline] Expired {deleted} leads older than {days} days.")
    return deleted
