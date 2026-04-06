const API_BASE_URL = `http://${window.location.hostname}:8000/api/`;

// ── Google Maps ──────────────────────────────────────────────────────────────

export async function generateLeads(businessType, cityArea) {
  try {
    const response = await fetch(`${API_BASE_URL}generate-leads/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ business_type: businessType, city_area: cityArea }),
    });

    if (!response.ok) throw new Error("Failed to fetch leads");
    const data = await response.json();
    return data.leads || [];
  } catch (error) {
    console.error("Error fetching leads:", error);
    return [];
  }
}

// ── Reddit (legacy keyword classifier) ─────────────────────────────────

/**
 * Fetch the list of service categories from the backend.
 */
export async function fetchRedditServices() {
  const response = await fetch(`${API_BASE_URL}reddit/services/`);
  if (!response.ok) throw new Error("Failed to fetch service categories");
  const data = await response.json();
  return data.services || [];
}

/**
 * Fetch stored leads for a service category.
 */
export async function fetchRedditLeads({ serviceCategory, sort = "newest", limit = 50 }) {
  const params = new URLSearchParams({
    service_category: serviceCategory,
    sort,
    limit: String(limit),
  });

  const response = await fetch(`${API_BASE_URL}reddit/leads/?${params}`);
  if (!response.ok) throw new Error("Failed to fetch Reddit leads");
  const data = await response.json();
  return data.leads || [];
}

/**
 * Add a custom subreddit to monitor.
 */
export async function addCustomSubreddit(serviceCategory, subreddit) {
  const response = await fetch(`${API_BASE_URL}reddit/subreddits/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ service_category: serviceCategory, subreddit }),
  });
  if (!response.ok) throw new Error("Failed to add subreddit");
  return response.json();
}

// ── Smart Reddit (Scoring & ML Pipeline) ──────────────────────────────────

/**
 * Fetch smart (Gemini-verified) leads for a service category.
 */
export async function fetchSmartRedditLeads({ serviceCategory, sort = "newest", limit = 50 }) {
  const params = new URLSearchParams({
    service_category: serviceCategory,
    sort,
    limit: String(limit),
  });
  const response = await fetch(`${API_BASE_URL}smart-reddit/leads/?${params}`);
  if (!response.ok) throw new Error("Failed to fetch Smart Reddit leads");
  const data = await response.json();
  return data.leads || [];
}

/**
 * Trigger the smart pipeline via API (scrape + filter + classify + store).
 */
export async function runSmartRedditPipeline() {
  const response = await fetch(`${API_BASE_URL}smart-reddit/run/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  if (!response.ok) throw new Error("Failed to run smart pipeline");
  return response.json();
}

// ── Lead Review & Labeling (Additive) ──────────────────────────────────────────

/**
 * Fetch unreviewed leads for manual labeling.
 */
export async function fetchReviewLeads({ classification, sort = "newest" }) {
  const params = new URLSearchParams();
  if (classification) params.append("classification", classification);
  params.append("sort", sort);

  const response = await fetch(`${API_BASE_URL}smart-reddit/review/?${params}`);
  if (!response.ok) throw new Error("Failed to fetch review leads");
  const data = await response.json();
  return data.leads || [];
}

/**
 * Save manual label for training dataset.
 */
export async function labelLead({ post_id, user_label }) {
  const response = await fetch(`${API_BASE_URL}smart-reddit/label/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ post_id, user_label }),
  });
  if (!response.ok) throw new Error("Failed to label lead");
  return response.json();
}