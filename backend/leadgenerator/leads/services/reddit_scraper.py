"""
Reddit Scraper Service
Fetches newest posts from subreddits via Reddit's public JSON API.
No API key required — uses the public endpoint.
"""

import requests
from datetime import datetime, timezone


HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 LeadDiscoveryBot/1.1"
}

FETCH_LIMIT = 50  # posts per subreddit per run


def fetch_new_posts(subreddit: str) -> list[dict]:
    """
    Fetch the newest posts from a subreddit.
    Returns a list of post dicts, or an empty list on failure.
    """
    url = f"https://www.reddit.com/r/{subreddit}/new.json"
    params = {"limit": FETCH_LIMIT}

    try:
        response = requests.get(url, headers=HEADERS, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
    except (requests.RequestException, ValueError) as exc:
        print(f"[RedditScraper] Failed to fetch r/{subreddit}: {exc}")
        return []

    children = data.get("data", {}).get("children", [])
    posts = []

    for child in children:
        post = child.get("data", {})
        permalink = post.get("permalink", "")
        created_utc = post.get("created_utc", 0)

        posts.append({
            "post_id": post.get("id", ""),
            "title": post.get("title", ""),
            "body": post.get("selftext", ""),
            "subreddit": post.get("subreddit", subreddit),
            "author": post.get("author", "[deleted]"),
            "created_utc": datetime.fromtimestamp(created_utc, tz=timezone.utc) if created_utc else None,
            "ups": post.get("ups", 0),
            "permalink": permalink,
            "url": f"https://reddit.com{permalink}" if permalink else "",
        })

    return posts
