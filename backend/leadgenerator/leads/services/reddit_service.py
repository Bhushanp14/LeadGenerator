import praw
from django.conf import settings
from datetime import datetime

def fetch_reddit_leads(service_category, subreddits, keyword=None, limit=50):
    """
    Fetches leads from Reddit using PRAW.
    """
    if not all([settings.REDDIT_CLIENT_ID, settings.REDDIT_CLIENT_SECRET]):
        return {"error": "Reddit API credentials not configured in .env"}

    reddit = praw.Reddit(
        client_id=settings.REDDIT_CLIENT_ID,
        client_secret=settings.REDDIT_CLIENT_SECRET,
        user_agent=settings.REDDIT_USER_AGENT
    )

    leads = []
    
    # If no keyword is provided, use the service category as the primary search term
    search_query = keyword if keyword else service_category
    
    # Common "buying intent" keywords to combine with search
    intent_keywords = ["looking for", "hire", "need", "recommend", "suggest", "anybody", "someone"]
    
    for sub_name in subreddits:
        try:
            subreddit = reddit.subreddit(sub_name)
            
            # Simple keyword search within the subreddit
            # Reddit search handles boolean OR well, e.g., "web developer (looking for OR hire)"
            full_query = f'"{search_query}"'
            
            # Search recent posts
            for submission in subreddit.search(full_query, sort='new', limit=limit):
                # Basic filtering to ensure it's not too old (optional, but good for relevance)
                # For now, we take everything recent within the limit
                
                created_dt = datetime.fromtimestamp(submission.created_utc)
                time_diff = datetime.now() - created_dt
                
                # Format time ago string
                if time_diff.days > 0:
                    time_ago = f"{time_diff.days}d ago"
                elif time_diff.seconds // 3600 > 0:
                    time_ago = f"{time_diff.seconds // 3600}h ago"
                else:
                    time_ago = f"{time_diff.seconds // 60}m ago"

                leads.append({
                    "id": submission.id,
                    "title": submission.title,
                    "subreddit": submission.subreddit.display_name,
                    "author": submission.author.name if submission.author else "[deleted]",
                    "created_utc": time_ago,
                    "ups": submission.score,
                    "url": f"https://www.reddit.com{submission.permalink}"
                })
                
                if len(leads) >= limit:
                    break
        except Exception as e:
            print(f"Error fetching from r/{sub_name}: {e}")
            continue

    return sorted(leads, key=lambda x: x['ups'], reverse=True)
