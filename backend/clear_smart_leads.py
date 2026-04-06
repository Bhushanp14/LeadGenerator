import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'leadgenerator.settings')
django.setup()

from leads.models import SmartRedditLead

def clear_leads():
    count = SmartRedditLead.objects.all().count()
    print(f"Found {count} Smart Reddit Leads in the database.")
    
    if count > 0:
        confirm = input(f"Are you sure you want to delete ALL {count} leads? (y/n): ")
        if confirm.lower() == 'y':
            SmartRedditLead.objects.all().delete()
            print("Successfully deleted all smart leads.")
        else:
            print("Operation cancelled.")
    else:
        print("Nothing to delete.")

if __name__ == "__main__":
    clear_leads()
