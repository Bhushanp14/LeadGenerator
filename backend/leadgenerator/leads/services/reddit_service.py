import requests
from datetime import datetime

class RedditLeadService:
    def __init__(self):
        self.headers = {
            "User-Agent": "LeadGenerator/1.0"
        }

    def search_posts(self, role, subreddits, keyword, limit):
        if not subreddits:
            return []

        subreddit_combo = "+".join(subreddits)
        query = keyword.strip() if keyword and keyword.strip() else role

        url = f"https://www.reddit.com/r/{subreddit_combo}/search.json"
        
        params = {
            "q": query,
            "limit": limit,
            "sort": "new",
            "restrict_sr": 1
        }
        
        try:
            response = requests.get(url, headers=self.headers, params=params)
            response.raise_for_status()
            data = response.json()
        except requests.RequestException as e:
            return {"error": f"Failed to fetch from Reddit: {str(e)}"}
        except ValueError:
            return {"error": "Invalid response from Reddit"}

        # Check for empty result or error from reddit JSON
        if not isinstance(data, dict) or "data" not in data or "children" not in data["data"]:
            return []

        leads = []
        posts = data["data"]["children"]
        for post in posts:
            post_data = post.get("data", {})
            
            # Convert created_utc to readable date
            created_ts = post_data.get("created_utc", 0)
            created_date = ""
            if created_ts:
                try:
                    created_date = datetime.fromtimestamp(created_ts).strftime('%Y-%m-%d')
                except Exception:
                    pass
            
            permalink = post_data.get("permalink", "")
            url_link = f"https://reddit.com{permalink}" if permalink else ""
            
            leads.append({
                "id": post_data.get("id", ""),
                "title": post_data.get("title", ""),
                "subreddit": post_data.get("subreddit", ""),
                "author": post_data.get("author", ""),
                "created_utc": created_date,
                "ups": post_data.get("ups", 0),
                "url": url_link
            })
            
        return leads
