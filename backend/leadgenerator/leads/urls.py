from django.urls import path
from . import views

urlpatterns = [
    # ── Google Maps ──────────────────────────────────────────────────────────
    path('generate-leads/', views.generate_leads, name='generate_leads'),
    path('export-leads-csv/', views.export_leads_csv, name='export_leads_csv'),

    # ── Reddit (legacy keyword classifier) ───────────────────────────────────
    path('reddit/services/', views.reddit_services, name='reddit_services'),
    path('reddit/leads/', views.reddit_leads, name='reddit_leads'),
    path('reddit/subreddits/', views.managed_subreddits, name='managed_subreddits'),

    # ── Smart Reddit (Scoring & ML Pipeline) ───────────────────────────────────
    path('smart-reddit/services/', views.smart_reddit_services, name='smart_reddit_services'),
    path('smart-reddit/leads/', views.smart_reddit_leads, name='smart_reddit_leads'),
    path('smart-reddit/run/', views.smart_reddit_run_pipeline, name='smart_reddit_run'),

    # ── Lead Review & Labeling (Additive Feature) ─────────────────────────────
    path('smart-reddit/review/', views.review_leads_list, name='review_leads_list'),
    path('smart-reddit/label/', views.label_lead, name='label_lead'),
]