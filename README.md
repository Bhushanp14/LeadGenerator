# LeadGenerator 🚀

A high-performance full-stack application designed for automated lead extraction from Google Maps and Reddit. This tool helps businesses find targeted prospects by niche and location, streamlining the sales outreach process.

## ✨ Key Features

-   **Google Maps Scraping:** Extracts business names, addresses, ratings, and contact info using the Google Places API.
-   **Reddit Lead Discovery:** A background engine that continuously monitors subreddits, classifies posts using AI, and stores service requests by category.
-   **AI Classification:** Heuristic-based intent detection that identifies users looking to hire specific services while filtering out self-promotion.
-   **CSV Export:** Automated conversion of leads into CRM-ready CSV files.
-   **Premium UI:** Modern dashboard with a category-based discovery interface and real-time filtering.

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Shadcn UI |
| **Backend** | Django 5.2.7, Django REST Framework (DRF) |
| **Database** | SQLite (Development) / PostgreSQL (Production) |
| **Data Extraction** | Google Maps API, Reddit Public JSON API |

## 📂 Project Structure

```text
LeadGenerator/
├── backend/            # Django Backend
│   └── leadgenerator/
│       ├── leads/      # Leads App (Models, Views, Commands)
│       │   ├── services/ # Scraper, AI Classifier, and Pipeline
│       │   └── management/commands/ # Background Scraper Job
├── frontend/           # React Frontend
│   ├── src/
│   │   ├── components/ # RedditLeadsPage, LeadTable, etc.
│   │   ├── api/        # API Client for Backend interaction
│   │   └── types/      # TypeScript Definitions
└── README.md           # Project Documentation
```

## 📦 Installation & Setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- Google Cloud API Key (with Places API enabled)

### 1. Backend Setup
```bash
cd backend/leadgenerator
python -m venv venv
venv\Scripts\activate # Windows (PowerShell)
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

**To run on a Local Network (LAN):**
Run the server bound to all IPs so other devices can access it:
```bash
python manage.py runserver 0.0.0.0:8000
```
*(The React frontend is configured to automatically detect your network IP address for API calls)*

**Environment Variables (`.env`):**
```env
GOOGLE_API_KEY=your_key
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

**To run on a Local Network (LAN):**
If you are using Vite, expose the dev server to your network:
```bash
npm run dev -- --host
```

---

## 🤖 Reddit Background Scraper

Unlike Google Maps which is search-on-demand, the Reddit leads are discovered by a background job to avoid rate limits and provide instant results to the user.

### Run Scraper Manually
To discover and categorize new leads from the monitored subreddits, run:
```bash
python manage.py scrape_reddit_leads
```

### Automation (Production)
In a production environment, set up a Cron Job (Linux) or Task Scheduler (Windows) to run this command every hour.

---

## 🔌 API Documentation

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/generate-leads/` | `POST` | Fetches leads from Google Maps |
| `/api/reddit/services/` | `GET` | Lists available service categories |
| `/api/reddit/leads/` | `GET` | Fetches stored Reddit leads (requires `service_category`) |
| `/api/reddit/subreddits/` | `POST` | Adds a custom subreddit to the monitor |
| `/api/export-leads-csv/` | `POST` | Generates a downloadable CSV file |

## 🚀 Roadmap
- [ ] **LLM Integration:** Swap the keyword classifier for GPT-4o or Gemini for deeper intent analysis.
- [ ] **Instagram Scraper:** Native integration for business profile extraction.
- [ ] **X (Twitter) Monitoring:** Real-time lead discovery via tweet analysis.
- [ ] **Email Automation:** Direct outreach integration with SMTP services.
- [ ] **Lead CRM:** Built-in dashboard to manage and track lead status.

---
Built with ❤️ by [Bhushanp14](https://github.com/Bhushanp14)
