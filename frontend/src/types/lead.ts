export interface Lead {
  name: string;
  address: string;
  phone: string;
  website?: string;
  rating: number;
}

// Stored Reddit lead (from DB, new architecture)
export interface RedditLead {
  id: number;
  reddit_post_id: string;
  title: string;
  subreddit: string;
  author: string;
  url: string;
  ups: number;
  created_at: string;
  service_category: string;
  ai_confidence: number;
  scraped_at: string;
}

export interface ServiceCategory {
  id: string;
  label: string;
}