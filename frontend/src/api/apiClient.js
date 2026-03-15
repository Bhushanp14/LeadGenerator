const API_BASE_URL = "http://127.0.0.1:8000/api/";

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

export async function generateRedditLeads(params) {
  try {
    const response = await fetch(`${API_BASE_URL}generate-reddit-leads/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });

    const data = await response.json();
    
    if (!response.ok) {
        throw new Error(data.error || "Failed to fetch Reddit leads");
    }
    
    return data.leads || [];
  } catch (error) {
    console.error("Error fetching Reddit leads:", error);
    throw error; // Rethrow to let the UI handle the error toast
  }
}