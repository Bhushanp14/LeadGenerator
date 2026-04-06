import os
import json
import re
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")

def _build_bulk_prompt(posts: list[dict]) -> str:
    posts_data = []
    for i, p in enumerate(posts):
        category_label = p["service_category"].replace("_", " ").title()
        posts_data.append({
            "index": i,
            "category": category_label,
            "subreddit": f"r/{p['subreddit']}",
            "title": p["title"]
        })

    return f"""You are a lead qualification assistant. You will be given a list of Reddit posts.
For each post, determine whether the author is SEEKING to hire or get help with the specified category (i.e., they are a potential client lead).

Posts to analyze:
{json.dumps(posts_data, indent=2)}

Answer ONLY with a JSON object where the key "results" is a list of booleans corresponding to the indices of the posts.
True if it's a lead, False otherwise.
Format: {{"results": [true, false, true, ...]}}
Do not include explanations. Only output the JSON.
"""

def test_bulk_gemini():
    client = genai.Client(api_key=api_key)
    dummy_posts = [
        {"title": "Looking for a Shopify expert to fix my theme", "subreddit": "shopify", "service_category": "shopify"},
        {"title": "I am a Shopify developer offering my services", "subreddit": "shopify", "service_category": "shopify"},
        {"title": "Need help with SEO for my local business", "subreddit": "seo", "service_category": "seo"},
        {"title": "How to improve ranking on Google?", "subreddit": "seo", "service_category": "seo"},
        {"title": "Check out my new website portfolio", "subreddit": "webdev", "service_category": "web_development"}
    ]
    
    prompt = _build_bulk_prompt(dummy_posts)
    print("--- Bulk Prompt ---")
    print(prompt)
    print("-------------------")

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.0,
                max_output_tokens=4096,
                response_mime_type="application/json",
                thinking_config=types.ThinkingConfig(
                    thinking_budget=2048,
                    include_thoughts=False
                ),
            ),
        )

        raw_text = response.text.strip()
        print(f"Raw Response: {raw_text}")
        
        raw_text = re.sub(r"^```[a-z]*\n?", "", raw_text)
        raw_text = re.sub(r"\n?```$", "", raw_text)

        answer = json.loads(raw_text)
        results = answer.get("results", [])
        
        print("\nResults:")
        for i, res in enumerate(results):
            print(f"Post {i}: {res} (expected: 0:T, 1:F, 2:T, 3:T, 4:F)")
            
        if len(results) == len(dummy_posts):
            print("\nSuccess! Bulk classification worked correctly with single prompt.")
        else:
            print(f"\nWarning: Expected {len(dummy_posts)} results, got {len(results)}.")

    except Exception as exc:
        print(f"Error: {exc}")

if __name__ == "__main__":
    test_bulk_gemini()
