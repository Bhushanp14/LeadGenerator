from django.db import models
from django.utils import timezone


class SmartRedditLead(models.Model):
    """
    A Reddit post verified by a multi-stage scoring & AI classification pipeline.
    Categorizes posts into 'lead', 'maybe_lead', or 'noise'.
    """

    SERVICE_CATEGORY_CHOICES = [
        ("web_development", "Web Development"),
        ("seo", "SEO"),
        ("shopify", "Shopify"),
        ("digital_marketing", "Digital Marketing"),
        ("design", "Design"),
        ("app_development", "App Development"),
        ("automation_ai", "Automation / AI"),
    ]
    CLASSIFICATION_CHOICES = [
        ("lead", "Lead"),
        ("maybe_lead", "Maybe Lead"),
        ("noise", "Noise"),
    ]

    reddit_post_id = models.CharField(max_length=20, unique=True)
    title = models.TextField()
    subreddit = models.CharField(max_length=100)
    author = models.CharField(max_length=100, blank=True)
    url = models.URLField(max_length=500)
    ups = models.IntegerField(default=0)
    created_at = models.DateTimeField()
    service_category = models.CharField(max_length=50, choices=SERVICE_CATEGORY_CHOICES)
    
    # New classification fields
    classification = models.CharField(
        max_length=20, choices=CLASSIFICATION_CHOICES, default="lead"
    )
    confidence_score = models.FloatField(default=0.0)
    reason_tags = models.JSONField(default=list)  # Array of matched signals
    explanation = models.TextField(blank=True)  # Human-readable string for UI badges
    
    scraped_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["service_category"]),
            models.Index(fields=["scraped_at"]),
            models.Index(fields=["classification"]),
        ]

    def __str__(self):
        return f"[Smart][{self.classification}][{self.service_category}] {self.title[:80]}"


class MonitoredSubreddit(models.Model):
    """Subreddits monitored for a service category, including user-added ones."""

    SERVICE_CATEGORY_CHOICES = SmartRedditLead.SERVICE_CATEGORY_CHOICES

    service_category = models.CharField(max_length=50, choices=SERVICE_CATEGORY_CHOICES)
    subreddit = models.CharField(max_length=100)
    is_custom = models.BooleanField(default=False)  # True = added by user
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("service_category", "subreddit")
        ordering = ["service_category", "subreddit"]

    def __str__(self):
        return f"r/{self.subreddit} → {self.service_category}"


class RedditLeadTrainingData(models.Model):
    """
    Independent table to store human-labeled leads for future ML model training.
    """
    post_id = models.CharField(max_length=20, unique=True)
    title = models.TextField()
    subreddit = models.CharField(max_length=100)
    category = models.CharField(max_length=50)
    intent_score = models.FloatField(default=0.0)
    model_confidence = models.FloatField(default=0.0)
    final_score = models.FloatField(default=0.0) # Corresponds to confidence_score in SmartRedditLead
    matched_signals = models.JSONField(default=list) # Corresponds to reason_tags in SmartRedditLead
    user_label = models.BooleanField()  # True = Potential Lead, False = Not a Lead
    labeled_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-labeled_at"]

    def __str__(self):
        label_text = "LEAD" if self.user_label else "NOISE"
        return f"[{label_text}] {self.title[:50]}"
