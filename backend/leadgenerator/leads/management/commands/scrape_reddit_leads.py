"""
Management command: scrape_reddit_leads
Usage: python manage.py scrape_reddit_leads
Run via cron every hour for continuous lead discovery.
"""

from django.core.management.base import BaseCommand
from leads.services.reddit_pipeline import run_pipeline, expire_old_leads


class Command(BaseCommand):
    help = "Scrape Reddit subreddits, classify posts, and store leads."

    def add_arguments(self, parser):
        parser.add_argument(
            "--expire-days",
            type=int,
            default=45,
            help="Delete leads older than this many days (default: 45).",
        )

    def handle(self, *args, **options):
        expire_days = options["expire_days"]

        self.stdout.write(self.style.MIGRATE_HEADING(">> Starting Reddit lead scrape..."))

        # 1. Expire old leads first
        expired = expire_old_leads(days=expire_days)
        if expired:
            self.stdout.write(self.style.WARNING(f"  Expired {expired} old leads."))

        # 2. Run the discovery pipeline
        stats = run_pipeline()

        self.stdout.write(self.style.SUCCESS(
            f"\nPipeline complete:\n"
            f"   Posts scraped      : {stats['scraped']}\n"
            f"   Posts classified   : {stats['classified']}\n"
            f"   Leads stored       : {stats['stored']}\n"
            f"   Duplicates skipped : {stats['skipped']}\n"
        ))
