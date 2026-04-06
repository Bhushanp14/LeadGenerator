"""
Management command: scrape_smart_reddit_leads
Usage: python manage.py scrape_smart_reddit_leads

Runs the enhanced pipeline:
  1. Per-category keyword disqualifier filter
  2. Gemini 2.5 Flash individual LLM classification
  3. Stores only LLM-confirmed leads into SmartRedditLead table
"""

from django.core.management.base import BaseCommand
from leads.services.smart_pipeline import run_smart_pipeline, expire_old_smart_leads


class Command(BaseCommand):
    help = "Scrape Reddit, filter with disqualifiers, classify with Gemini, and store smart leads."

    def add_arguments(self, parser):
        parser.add_argument(
            "--expire-days",
            type=int,
            default=45,
            help="Delete smart leads older than this many days (default: 45).",
        )

    def handle(self, *args, **options):
        expire_days = options["expire_days"]

        self.stdout.write(self.style.MIGRATE_HEADING(">> Starting Smart Reddit lead scrape..."))

        # 1. Expire old leads first
        expired = expire_old_smart_leads(days=expire_days)
        if expired:
            self.stdout.write(self.style.WARNING(f"  Expired {expired} old smart leads."))

        # 2. Run the smart discovery pipeline
        stats = run_smart_pipeline()

        self.stdout.write(self.style.SUCCESS(
            f"\nSmart Pipeline complete:\n"
            f"   Posts scraped             : {stats['scraped']}\n"
            f"   Posts analyzed            : {stats['analyzed']}\n"
            f"   Scoring Classified LEAD   : {stats['classified_lead']}\n"
            f"   Scoring Classified MAYBE  : {stats['classified_maybe']}\n"
            f"   Leads stored              : {stats['stored']}\n"
            f"   Duplicates / noise skipped: {stats['skipped']}\n"
        ))
