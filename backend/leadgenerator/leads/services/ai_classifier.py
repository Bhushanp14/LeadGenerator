"""
AI Classifier Service
Classifies Reddit posts as service requests using keyword/heuristic analysis.
This intentionally uses no external LLM call so the pipeline works
immediately without additional API keys.  A real LLM call can be swapped
in here later by replacing _classify_with_keywords with an OpenAI/Gemini call.
"""

import re


# ---------------------------------------------------------------------------
# Category keyword maps
# Each key is the service_category slug; values are high-signal terms.
# ---------------------------------------------------------------------------
CATEGORY_KEYWORDS: dict[str, list[str]] = {
    # Short tokens catch real titles; intent phrases score higher when matched.
    "web_development": [
        # Short tokens
        "website", "web app", "web developer", "frontend", "backend",
        "full stack", "landing page", "web design", "build a site",
        "need a developer", "looking for a dev", "build me a",
        "create a website", "wordpress", "next.js", "react app", "django",
        # Intent phrases (higher signal)
        "looking for someone to build a website", "need help building a website",
        "hire someone to fix my website", "looking for frontend developer",
        "need backend developer help", "need a developer for my site",
        "website not working need help",
    ],
    "seo": [
        # Short tokens
        "seo", "search engine", "rank on google", "keyword research",
        "backlinks", "organic traffic", "google ranking", "on-page seo",
        "seo audit", "local seo", "serp",
        # Intent phrases
        "looking for someone to do seo", "i need help with seo",
        "hire seo expert", "website traffic dropped need help",
        "how to rank my website on google", "need backlinks help",
    ],
    "shopify": [
        # Short tokens
        "shopify", "ecommerce store", "online store", "dropshipping",
        "shopify developer", "shopify theme", "shopify app", "woocommerce",
        "shopify store",
        # Intent phrases
        "looking for a shopify developer", "need shopify expert",
        "i need help with my shopify store", "custom shopify theme help",
        "shopify store not converting", "optimize shopify store",
    ],
    "digital_marketing": [
        # Short tokens
        "digital marketing", "facebook ads", "google ads", "paid ads",
        "ppc", "social media marketing", "content marketing",
        "email marketing", "instagram ads", "tiktok ads",
        "marketing strategy", "grow my brand", "run ads",
        # Intent phrases
        "need help running ads", "hire digital marketer",
        "google ads expert needed", "need social media manager",
        "how to get more leads online", "increase conversions",
    ],
    "design": [
        # Short tokens
        "graphic design", "logo design", "ui design", "ux design",
        "branding", "brand identity", "figma", "illustrator",
        "design a logo", "need a designer", "create a logo",
        # Intent phrases
        "need someone to design a logo", "looking for someone to design a logo",
        "hire ui designer", "looking for graphic designer",
        "need brand identity design", "redesign my website ui",
    ],
    "app_development": [
        # Short tokens
        "mobile app", "ios app", "android app", "react native",
        "flutter", "app developer", "build an app", "native app",
        "app development", "publish to app store", "mvp app",
        # Intent phrases
        "looking for an app developer", "need someone to build an app",
        "hire mobile app developer", "need mvp app developer",
        "i want to create an app", "how to build app quickly",
    ],
    "automation_ai": [
        # Short tokens
        "automation", "zapier", "n8n", "make.com", "workflow automation",
        "chatbot", "ai bot", "python script", "automate",
        "web scraping", "openai api", "gpt integration", "llm",
        "machine learning model",
        # Intent phrases
        "need help automating tasks", "looking for ai automation expert",
        "build chatbot for my business", "hire automation developer",
        "need gpt integration help", "automate business processes",
    ],
}

# Phrases that signal someone is looking to HIRE / get help
HIRING_SIGNALS: list[str] = [
    "looking for", "need a", "need help", "want to hire", "hire a",
    "can someone", "anyone know", "recommend a", "recommendation",
    "seeking", "help me", "how do i find", "where can i find",
    "who can", "please help", "any suggestions", "any advice",
    "help with", "looking to outsource", "need someone",
    "building a", "starting a", "launching",
]

# Strong disqualifiers
DISQUALIFY_PHRASES: list[str] = [
    "i am a developer", "i'm a developer", "i offer",
    "i provide", "my service", "dm me for freelance",
    "portfolio", "hiring for my team", "job posting",
]


def classify_post(title: str, subreddit: str) -> dict:
    """
    Classify a Reddit post.

    Returns:
        {
            "is_service_request": bool,
            "service_category": str | None,
            "confidence": float  (0.0–1.0)
        }
    """
    title_lower = title.lower()
    subreddit_lower = subreddit.lower()

    # --- Disqualify obvious non-requests ---
    for phrase in DISQUALIFY_PHRASES:
        if phrase in title_lower:
            return {"is_service_request": False, "service_category": None, "confidence": 0.0}

    # --- Check for hiring signals ---
    has_hiring_signal = any(signal in title_lower for signal in HIRING_SIGNALS)

    # --- Score each category ---
    best_category: str | None = None
    best_score = 0.0
    best_keyword_score = 0.0  # raw keyword hits, excluding subreddit boost

    for category, keywords in CATEGORY_KEYWORDS.items():
        kw_score = sum(1.0 for kw in keywords if kw in title_lower)
        score = kw_score
        # Slight boost if subreddit matches the category (cannot substitute keyword match)
        if _subreddit_matches_category(subreddit_lower, category):
            score += 0.5
        if score > best_score:
            best_score = score
            best_category = category
            best_keyword_score = kw_score

    # HARD GATE: at least one keyword must have matched.
    # Subreddit boost alone is NOT enough to classify a post.
    if best_category is None or best_keyword_score == 0:
        return {"is_service_request": False, "service_category": None, "confidence": 0.0}

    # Confidence: normalise and apply hiring-signal boost
    confidence = min(best_score / 3.0, 1.0)  # cap at 1.0
    if has_hiring_signal:
        confidence = min(confidence + 0.25, 1.0)

    is_request = confidence >= 0.25  # threshold

    return {
        "is_service_request": is_request,
        "service_category": best_category if is_request else None,
        "confidence": round(confidence, 2),
    }


def _subreddit_matches_category(subreddit: str, category: str) -> bool:
    mapping = {
        "web_development": [
            "startups", "webdev", "entrepreneur", "smallbusiness", "learnprogramming",
            "javascript", "reactjs", "node", "wordpress", "learnwebdev",
            "frontend", "forhire", "webmasters"
        ],
        "seo": [
            "seo", "marketing", "entrepreneur", "bigseo", "localseo",
            "askmarketing", "webmasters", "smallbusiness", "growthhacking",
            "content_marketing", "forhire"
        ],
        "shopify": [
            "shopify", "ecommerce", "entrepreneur", "shopifyplus", "shopifywebsites",
            "shopify_hustlers", "shopifydev", "shopifythemes", "websiteservices",
            "forhire", "webdev"
        ],
        "digital_marketing": [
            "marketing", "entrepreneur", "askmarketing", "advertising",
            "socialmediamarketing", "growthhacking", "smallbusiness", "startups",
            "forhire", "content_marketing", "digitalmarketing"
        ],
        "design": [
            "design", "graphic_design", "uxdesign", "designjobs", "web_design",
            "ui_design", "logodesign", "branding", "forhire", "freelancedesign",
            "graphicdesignrequests"
        ],
        "app_development": [
            "startups", "androiddev", "iosprogramming", "entrepreneur", "appdevelopers",
            "flutterdev", "reactnative", "appdev", "gamedev", "unity3d", "forhire",
            "learnprogramming", "iosdev"
        ],
        "automation_ai": [
            "automation", "python", "artificial", "machinelearning", "chatgpt",
            "openai", "n8n", "make", "rpa", "nocode", "powerautomate", "forhire",
            "artificialintelligence"
        ],
    }
    return subreddit in mapping.get(category, [])
