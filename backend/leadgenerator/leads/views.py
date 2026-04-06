import csv
import googlemaps  # type: ignore
from io import StringIO
from django.http import HttpResponse
from django.conf import settings
from rest_framework.decorators import api_view
from rest_framework.response import Response
from datetime import datetime
import time

# ─── Google Maps leads ────────────────────────────────────────────────────────

@api_view(['POST'])
def generate_leads(request):
    business_type = request.data.get('business_type')
    city_area = request.data.get('city_area')

    if not business_type or not city_area:
        return Response({'error': 'Please provide both business_type and city_area.'}, status=400)

    try:
        gmaps = googlemaps.Client(key=settings.GOOGLE_API_KEY)
        query = f"{business_type} in {city_area}"

        response = gmaps.places(query=query)
        leads = []

        def extract_leads(places):
            data = []
            for place in places.get('results', []):
                place_id = place.get('place_id')
                details = gmaps.place(place_id=place_id, fields=['formatted_phone_number', 'website']).get('result', {})
                data.append({
                    'name': place.get('name'),
                    'address': place.get('formatted_address'),
                    'phone': details.get('formatted_phone_number', 'N/A'),
                    'website': details.get('website', 'N/A'),
                    'rating': place.get('rating', 'N/A'),
                })
            return data

        leads.extend(extract_leads(response))

        while 'next_page_token' in response and len(leads) < 60:
            time.sleep(2)
            response = gmaps.places(query=query, page_token=response['next_page_token'])
            leads.extend(extract_leads(response))

        leads = leads[:60]
        return Response({'leads': leads})

    except Exception as e:
        return Response({'error': str(e)}, status=500)


@api_view(["GET", "POST"])
def export_leads_csv(request):
    """Accepts a JSON array of leads and returns downloadable CSV."""
    try:
        data = request.data.get("leads", [])
        if not isinstance(data, list) or not data:
            return HttpResponse("No data provided or invalid format.", status=400)

        filename = f"leads_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        response = HttpResponse(content_type="text/csv; charset=utf-8")
        response["Content-Disposition"] = f'attachment; filename="{filename}"'

        writer = csv.writer(response)
        headers = list(data[0].keys())
        writer.writerow(headers)

        for row in data:
            clean_row = [str(row.get(col, "")).replace("\n", " ").replace("\r", " ") for col in headers]
            writer.writerow(clean_row)

        return response

    except Exception as e:
        return HttpResponse(f"Error generating CSV: {str(e)}", status=500)


# ─── Reddit Leads (new architecture) ─────────────────────────────────────────

from leads.models import RedditLead, MonitoredSubreddit

SERVICE_CATEGORIES = [
    {"id": "web_development",    "label": "Web Development"},
    {"id": "seo",                "label": "SEO"},
    {"id": "shopify",            "label": "Shopify"},
    {"id": "digital_marketing",  "label": "Digital Marketing"},
    {"id": "design",             "label": "Design"},
    {"id": "app_development",    "label": "App Development"},
    {"id": "automation_ai",      "label": "Automation / AI"},
]


@api_view(["GET"])
def reddit_services(request):
    """Return the list of service categories."""
    return Response({"services": SERVICE_CATEGORIES})


@api_view(["GET"])
def reddit_leads(request):
    """
    Return stored leads for a service category.
    Query params:
        service_category  (required)
        sort              'newest' | 'top'  (default: newest)
        limit             int               (default: 50)
    """
    category = request.query_params.get("service_category")
    if not category:
        return Response({"error": "service_category query parameter is required."}, status=400)

    sort = request.query_params.get("sort", "newest")
    limit = int(request.query_params.get("limit", 50))

    qs = RedditLead.objects.filter(service_category=category)

    if sort == "top":
        qs = qs.order_by("-ups")
    else:
        qs = qs.order_by("-created_at")

    qs = qs[:limit]

    data = [
        {
            "id": lead.id,
            "reddit_post_id": lead.reddit_post_id,
            "title": lead.title,
            "subreddit": lead.subreddit,
            "author": lead.author,
            "url": lead.url,
            "ups": lead.ups,
            "created_at": lead.created_at.isoformat() if lead.created_at else None,
            "service_category": lead.service_category,
            "ai_confidence": lead.ai_confidence,
            "scraped_at": lead.scraped_at.isoformat() if lead.scraped_at else None,
        }
        for lead in qs
    ]

    return Response({"leads": data, "total": len(data), "service_category": category})


@api_view(["GET", "POST"])
def managed_subreddits(request):
    """
    GET  /api/reddit/subreddits?service_category=...  → list monitored subreddits
    POST /api/reddit/subreddits  {service_category, subreddit}  → add custom subreddit
    """
    if request.method == "GET":
        category = request.query_params.get("service_category")
        qs = MonitoredSubreddit.objects.all()
        if category:
            qs = qs.filter(service_category=category)
        data = [
            {"id": s.id, "service_category": s.service_category, "subreddit": s.subreddit, "is_custom": s.is_custom}
            for s in qs
        ]
        return Response({"subreddits": data})

    # POST — add a custom subreddit
    category = request.data.get("service_category")
    subreddit = request.data.get("subreddit", "").strip().lower()

    if not category or not subreddit:
        return Response({"error": "service_category and subreddit are required."}, status=400)

    obj, created = MonitoredSubreddit.objects.get_or_create(
        service_category=category,
        subreddit=subreddit,
        defaults={"is_custom": True},
    )

    return Response(
        {"message": "Added" if created else "Already exists", "subreddit": subreddit},
        status=201 if created else 200,
    )


# ─── Smart Reddit Leads (Gemini LLM-verified) ─────────────────────────────────

from leads.models import SmartRedditLead, RedditLeadTrainingData  # noqa: E402
from leads.services.smart_pipeline import run_smart_pipeline, expire_old_smart_leads  # noqa: E402


@api_view(["GET"])
def smart_reddit_services(request):
    """Return the list of service categories (same set as regular Reddit)."""
    return Response({"services": SERVICE_CATEGORIES})


@api_view(["GET"])
def smart_reddit_leads(request):
    """
    Return Gemini-verified leads for a service category.
    Query params:
        service_category  (required)
        sort              'newest' | 'top'  (default: newest)
        limit             int               (default: 50)
    """
    category = request.query_params.get("service_category")
    if not category:
        return Response({"error": "service_category query parameter is required."}, status=400)

    sort = request.query_params.get("sort", "newest")
    limit = int(request.query_params.get("limit", 50))

    qs = SmartRedditLead.objects.filter(service_category=category)
    qs = qs.order_by("-ups") if sort == "top" else qs.order_by("-created_at")
    qs = qs[:limit]

    data = [
        {
            "id": lead.id,
            "reddit_post_id": lead.reddit_post_id,
            "title": lead.title,
            "subreddit": lead.subreddit,
            "author": lead.author,
            "url": lead.url,
            "ups": lead.ups,
            "created_at": lead.created_at.isoformat() if lead.created_at else None,
            "service_category": lead.service_category,
            "scraped_at": lead.scraped_at.isoformat() if lead.scraped_at else None,
            # New smart fields
            "classification": lead.classification,
            "confidence_score": lead.confidence_score,
            "reason_tags": lead.reason_tags,
            "explanation": lead.explanation,
        }
        for lead in qs
    ]

    return Response({"leads": data, "total": len(data), "service_category": category})


@api_view(["POST"])
def smart_reddit_run_pipeline(request):
    """
    Trigger the smart pipeline manually via API.
    POST /api/smart-reddit/run/
    """
    try:
        expire_days = int(request.data.get("expire_days", 45))
        expired = expire_old_smart_leads(days=expire_days)
        stats = run_smart_pipeline()
        return Response({"expired": expired, "stats": stats})
    except Exception as exc:
        return Response({"error": str(exc)}, status=500)


# ─── Lead Review & Labeling (Additive) ──────────────────────────────────────────

@api_view(["GET"])
def review_leads_list(request):
    """
    Fetch leads from SmartRedditLead for manual review.
    Exclude those already in RedditLeadTrainingData.
    """
    labeled_ids = RedditLeadTrainingData.objects.values_list("post_id", flat=True)
    qs = SmartRedditLead.objects.exclude(reddit_post_id__in=labeled_ids)
    
    classification = request.query_params.get("classification")
    if classification:
        qs = qs.filter(classification=classification)
        
    sort = request.query_params.get("sort", "newest")
    if sort == "top":
        qs = qs.order_by("-ups")
    elif sort == "intent":
        qs = qs.order_by("-confidence_score")
    elif sort == "confidence_low":
        qs = qs.order_by("confidence_score")
    else:
        qs = qs.order_by("-created_at")
        
    data = [
        {
            "id": lead.id,
            "reddit_post_id": lead.reddit_post_id,
            "title": lead.title,
            "subreddit": lead.subreddit,
            "author": lead.author,
            "url": lead.url,
            "ups": lead.ups,
            "created_at": lead.created_at.isoformat() if lead.created_at else None,
            "service_category": lead.service_category,
            "classification": lead.classification,
            "confidence_score": lead.confidence_score,
            "reason_tags": lead.reason_tags,
            "explanation": lead.explanation,
        }
        for lead in qs[:100] # Limit to 100 for review productivity
    ]
    return Response({"leads": data})


@api_view(["POST"])
def label_lead(request):
    """
    Save a user label for a lead.
    Expected data: {post_id, user_label}
    """
    post_id = request.data.get("post_id")
    user_label = request.data.get("user_label") # Boolean
    
    if post_id is None or user_label is None:
        return Response({"error": "post_id and user_label are required."}, status=400)
    
    try:
        original = SmartRedditLead.objects.get(reddit_post_id=post_id)
        
        training_obj, created = RedditLeadTrainingData.objects.update_or_create(
            post_id=post_id,
            defaults={
                "title": original.title,
                "subreddit": original.subreddit,
                "category": original.service_category,
                "final_score": original.confidence_score,
                "matched_signals": original.reason_tags,
                "user_label": user_label,
            }
        )
        
        return Response({"message": "Labeled successfully", "id": training_obj.id})
    except SmartRedditLead.DoesNotExist:
        return Response({"error": "Original lead not found"}, status=404)
