import os
import json
import re
from dotenv import load_dotenv
from google import genai
from google.genai import types

# Load environment variables from .env
load_dotenv()

# Attempt to retrieve API keys
api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")

if not api_key:
    print("Error: No GEMINI_API_KEY or GOOGLE_API_KEY found in .env file.")
    exit(1)

print(f"Using API Key: {api_key[:5]}...{api_key[-5:]}")

def test_gemini_classification():
    client = genai.Client(api_key=api_key)
    
    # Dummy data: A Reddit post looking for help with Shopify SEO
    dummy_post = {
        "title": "Need help with Shopify store SEO and conversion optimization",
        "subreddit": "shopify"
    }
    service_category = "shopify"
    
    category_label = service_category.replace("_", " ").title()
    prompt = f"""You are a lead qualification assistant for a freelance agency that offers {category_label} services.

Analyze the following Reddit post and determine whether the author is SEEKING to hire or get help with {category_label} (i.e., they are a potential client lead).

Post Title: "{dummy_post["title"]}"
Subreddit: r/{dummy_post["subreddit"]}

Answer ONLY with a JSON object: {{"is_lead": true}} or {{"is_lead": false}}.
Do not include explanations. Only output the JSON.
"""

    print("--- Sending Prompt ---")
    print(prompt)
    print("----------------------")

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.0,
                max_output_tokens=1024,
                response_mime_type="application/json",
                thinking_config=types.ThinkingConfig(
                    thinking_budget=2048,
                    include_thoughts=False
                ),
            ),
        )

        raw_text = response.text.strip()
        print(f"Raw Response: {raw_text}")
        
        # Clean up potential markdown blocks
        raw_text = re.sub(r"^```[a-z]*\n?", "", raw_text)
        raw_text = re.sub(r"\n?```$", "", raw_text)

        answer = json.loads(raw_text)
        print(f"Parsed Content: {answer}")
        
        if "is_lead" in answer:
            print(f"Success! Gemini Response Received. is_lead: {answer['is_lead']}")
        else:
            print("Response received, but 'is_lead' key not found.")

    except Exception as exc:
        print(f"Error during API call: {exc}")

if __name__ == "__main__":
    test_gemini_classification()
