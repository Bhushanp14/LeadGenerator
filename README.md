# LeadGenerator

A powerful full-stack lead generation platform designed to extract business contact information from Google Maps and Instagram.

## 🚀 Overview

LeadGenerator helps marketers and sales teams find high-quality leads by searching for businesses based on niche and location. It automates the data extraction process, providing details like phone numbers, emails, website links, and social media metrics.

## ✨ Key Features

-   **Google Maps Scraping:** Fetch business names, addresses, ratings, and websites directly using the Google Places API.
-   **Instagram Profile Scraper:** 
    -   Identify business accounts by niche and location.
    -   Extract follower counts, biographies, and external links.
    -   Auto-parse email addresses and phone numbers from bios.
-   **CSV Export:** Download all generated leads into a clean, CRM-ready CSV file.
-   **Modern Dashboard:** A sleek, responsive React-based interface for managing searches and viewing results.
-   **Anti-Blocking:** Integrated delays and randomized User-Agents for reliable scraping.

## 🛠️ Tech Stack

### Frontend
-   **Framework:** React 18 with Vite
-   **Language:** TypeScript
-   **Styling:** Tailwind CSS + Shadcn UI
-   **State/Data Fetching:** TanStack React Query

### Backend
-   **Framework:** Django 5.2.7
-   **API:** Django REST Framework (DRF)
-   **Scraping:** BeautifulSoup4, Requests
-   **Database:** SQLite (Development)

## 📦 Installation & Setup

### Prerequisites
-   Python 3.10+
-   Node.js & npm
-   Google Cloud Console API Key (with Places API enabled)

### Backend Setup
1.  Navigate to the backend directory:
    ```bash
    cd backend/leadgenerator
    ```
2.  Create and activate a virtual environment:
    ```bash
    python -m venv venv
    # Windows
    venv\Scripts\activate
    # macOS/Linux
    source venv/bin/activate
    ```
3.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
4.  Create a `.env` file in `backend/leadgenerator/` and add your Google API Key:
    ```env
    GOOGLE_API_KEY=your_google_maps_api_key_here
    ```
5.  Run migrations:
    ```bash
    python manage.py migrate
    ```
6.  Start the server:
    ```bash
    python manage.py runserver
    ```

### Frontend Setup
1.  Navigate to the frontend directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm run dev
    ```

## 🖥️ Usage

1.  Open the frontend application (usually at `http://localhost:8080`).
2.  Enter the **Business Type** (e.g., "Dentist") and **City/Area** (e.g., "Los Angeles").
3.  Click **Generate Leads** to fetch data.
4.  Once the table populates, click **Download CSV** to save your leads.

---
Built with ❤️ for rapid lead generation.
