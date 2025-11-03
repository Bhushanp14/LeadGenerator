import csv
import googlemaps
from io import StringIO
from django.http import HttpResponse
from django.conf import settings
from rest_framework.decorators import api_view
from rest_framework.response import Response
from datetime import datetime
import time
@api_view(['POST'])
def generate_leads(request):
    business_type = request.data.get('business_type')
    city_area = request.data.get('city_area')

    if not business_type or not city_area:
        return Response({'error': 'Please provide both business_type and city_area.'}, status=400)

    try:
        gmaps = googlemaps.Client(key=settings.GOOGLE_API_KEY)
        query = f"{business_type} in {city_area}"

        # Initial search
        response = gmaps.places(query=query)
        leads = []

        # Function to extract lead data
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

        # Add first page of results
        leads.extend(extract_leads(response))

        # Follow pagination tokens (max 2 more pages)
        while 'next_page_token' in response and len(leads) < 60:
            time.sleep(2)  # Required delay before using next_page_token
            response = gmaps.places(query=query, page_token=response['next_page_token'])
            leads.extend(extract_leads(response))

        # Optional limit safeguard (max 60)
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
