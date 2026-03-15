export interface Lead {
  name: string;
  address: string;
  phone: string;
  website?: string;
  rating: number;
}

export interface RedditLead {
  id: string;
  title: string;
  subreddit: string;
  author: string;
  created_utc: string;
  ups: number;
  url: string;
}