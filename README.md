# LeadGenerator 🚀

A high-performance full-stack application designed for automated lead extraction from Google Maps and Reddit. This tool helps businesses find targeted prospects by niche and location, streamlining the sales outreach process.

## ✨ Key Features

-   **Google Maps Scraping:** Extracts business names, addresses, ratings, and contact info using the Google Places API.
-   **Reddit Lead Generation:** Monitors subreddits for "buying intent" posts (e.g., users looking for specific services).
-   **CSV Export:** Automated conversion of leads into CRM-ready CSV files.
-   **State Management:** Real-time search tracking and lead filtering.
-   **Responsive UI:** Clean, modern dashboard built with React and Tailwind CSS.

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Shadcn UI |
| **Backend** | Django 5.2.7, Django REST Framework (DRF) |
| **Data Extraction** | Google Maps API, PRAW (Reddit API), BeautifulSoup4 |
| **State/Caching** | TanStack React Query |

## 📂 Project Structure

```text
LeadGenerator/
├── backend/            # Django Backend
│   ├── leadgenerator/  # Main Project Configuration
│   └── leads/          # Leads App (Scrapers & API Views)
│       ├── services/   # Business Logic (Reddit/Google API wrappers)
│       └── views.py    # API Endpoints
├── frontend/           # React Frontend
│   ├── src/
│   │   ├── components/ # Reusable UI Components
│   │   ├── pages/      # Application Pages (Index)
│   │   └── api/        # API Client (Axios/Fetch)
└── README.md           # Project Documentation
```

## 📦 Installation & Setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- Google Cloud API Key (with Places API enabled)
- Reddit API Credentials

### 1. Backend Setup
```bash
cd backend/leadgenerator
python -m venv venv
# Activate venv
venv\Scripts\activate # Windows
source venv/bin/activate # Mac/Linux

pip install -r requirements.txt
```

**Environment Variables (`.env`):**
```env
GOOGLE_API_KEY=your_key
REDDIT_CLIENT_ID=your_id
REDDIT_CLIENT_SECRET=your_secret
REDDIT_USER_AGENT=LeadGenerator/1.0
```

```bash
python manage.py migrate
python manage.py runserver
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## 🔌 API Documentation

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/generate-leads/` | `POST` | Fetches leads from Google Maps |
| `/api/generate-reddit-leads/` | `POST` | Fetches leads from Reddit |
| `/api/export-leads-csv/` | `POST` | Generates a downloadable CSV file |

## 🚀 Roadmap
- [ ] **Instagram Scraper:** Native integration for business profile extraction.
- [ ] **X (Twitter) Monitoring:** Real-time lead discovery via tweet analysis.
- [ ] **Email Automation:** Direct outreach integration with SMTP services.
- [ ] **Lead CRM:** Built-in dashboard to manage and track lead status.

---
Built with ❤️ by [Bhushanp14](https://github.com/Bhushanp14)
