"""
Smart Classifier Service (Scoring-Based)
Replacing hard filters with a weighted scoring system + ML model combination.
Categorizes leads into: Lead, Maybe Lead, or Noise.
"""

import os
import re
import logging
import joblib

logger = logging.getLogger(__name__)

# Path to the locally trained model
MODEL_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "lead_classifier_model.joblib")

# ──────────────────────────────────────────────────────────────────────────────
# Scoring Weights
# ──────────────────────────────────────────────────────────────────────────────

POSITIVE_SIGNALS = {
    "looking for": 5, "need": 5, "hire": 5, "seeking": 5, 
    "recommend": 5, "help me find": 5,
    "who can build": 4, "anyone know": 4, "need help with": 4,
    "budget": 3, "quote": 3, "price": 3, "cost": 3, 
    "asap": 3, "this week": 3, "launch": 3
}

BUSINESS_CONTEXT = {
    "website": 3, "shopify": 3, "seo": 3, "ads": 3, 
    "landing page": 3, "store": 3,
    "developer": 2, "designer": 2, "agency": 2, "freelancer": 2
}

NEGATIVE_SIGNALS = {
    "tutorial": -3, "course": -3, "interview": -3, 
    "learning": -3, "guide": -3,
    "i offer": -4, "my service": -4, "portfolio showcase": -4, "dm me": -4
}

HIGH_CONFIDENCE_BOOSTS = [
    "looking for someone", "need help with", "seeking recommendations",
    "who can build", "anyone know a good", "budget for"
]

# ──────────────────────────────────────────────────────────────────────────────
# Logic Functions
# ──────────────────────────────────────────────────────────────────────────────

def calculate_lead_score_details(text: str):
    """
    Computes a raw intent score and returns matched tags.
    Returns: (score, reason_tags)
    """
    text_lower = text.lower()
    score = 0
    reason_tags = []

    # 1. Positive Signals
    for phrase, points in POSITIVE_SIGNALS.items():
        if phrase in text_lower:
            score += points
            reason_tags.append(phrase.replace(" ", "_"))

    # 2. Business Context
    for phrase, points in BUSINESS_CONTEXT.items():
        if phrase in text_lower:
            score += points
            reason_tags.append(phrase.replace(" ", "_"))

    # 3. Negative Signals (Reduces score, doesn't reject)
    for phrase, points in NEGATIVE_SIGNALS.items():
        if phrase in text_lower:
            score += points
            reason_tags.append(f"minus_{phrase.replace(' ', '_')}")

    # 4. High Confidence Boost
    has_boost = False
    for phrase in HIGH_CONFIDENCE_BOOSTS:
        if phrase in text_lower:
            score += 5
            reason_tags.append("high_intent_boost")
            has_boost = True
            break # Only apply boost once

    return score, reason_tags


def classify_posts(posts: list[dict], service_category: str = "") -> list[dict]:
    """
    Main classification entry point.
    Combines Keyword Scoring + ML Model Prediction.
    Returns a list of result dicts with explainability tags.
    """
    if not posts:
        return []

    # Load ML Model
    ml_model = None
    if os.path.exists(MODEL_PATH):
        try:
            ml_model = joblib.load(MODEL_PATH)
        except Exception as e:
            logger.error(f"Failed to load ML model: {e}")

    results = []

    for post in posts:
        title = post.get("title", "")
        body = post.get("body", "")
        combined_text = f"{title}\n{body}".strip()

        raw_intent_score, reason_tags = calculate_lead_score_details(combined_text)
        
        # Normalize intent score to 0-1 range (clamped)
        # We consider a score of 12-15 to be 'perfect' intent
        normalized_intent = min(max(raw_intent_score / 15.0, 0.0), 1.0)

        # Get ML Confidence (probability of being a lead)
        model_conf = 0.5 # Default if model missing
        if ml_model:
            try:
                # predict_proba returns [prob_not_lead, prob_lead]
                # We assume column 0 is 'lead' if that's how it was trained, 
                # but better to check labels.
                labels = ml_model.classes_
                probs = ml_model.predict_proba([combined_text])[0]
                
                # Find index of 'lead' label
                lead_idx = -1
                for idx, label in enumerate(labels):
                    if label == 'lead':
                        lead_idx = idx
                        break
                
                if lead_idx != -1:
                    model_conf = probs[lead_idx]
                else:
                    # Fallback if 'lead' label not found (unlikely)
                    model_conf = probs.max() 
            except Exception:
                pass

        # Final Formula: (Intent * 0.6) + (ML * 0.4)
        final_score = (normalized_intent * 0.6) + (model_conf * 0.4)

        # 3-Way Classification
        classification = "noise"
        if final_score >= 0.75:
            classification = "lead"
        elif final_score >= 0.45:
            classification = "maybe_lead"

        # Generate Explanation String
        explanation = f"Matched: {', '.join(reason_tags) if reason_tags else 'none'}"
        if normalized_intent > 0.7:
            explanation = "High Buyer Intent + " + explanation

        results.append({
            "confidence_score": round(final_score, 3),
            "classification": classification,
            "reason_tags": reason_tags,
            "explanation": f"Score {round(final_score, 2)}: " + explanation
        })

    return results
