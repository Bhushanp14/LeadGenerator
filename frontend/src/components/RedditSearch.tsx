import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";

interface RedditSearchProps {
  onSearch: (params: { role: string; subreddits: string[]; keyword: string; limit: string }) => void;
  isLoading: boolean;
}

const SUBREDDIT_MAPPING: Record<string, string[]> = {
  "Web Developer": ["webdev", "reactjs", "startups"],
  "SEO Expert": ["SEO", "marketing", "smallbusiness"],
  "Shopify Developer": ["shopify", "ecommerce", "dropshipping"],
  "Digital Marketer": ["marketing", "socialmedia", "digitalmarketing"],
  "App Developer": ["programming", "startups", "SideProject"],
  "AI / Automation Developer": ["artificialintelligence", "automation", "Python"],
  "Android Developer": ["androiddev", "java", "kotlin"],
  "IOS Developer": ["iOSDev", "swift", "apple"],
  "UI/UX Designer": ["UXDesign", "UIUX", "design"],
  "Content Writer": ["copywriting", "freelanceWriters", "writing"],
  "Video Editor": ["videoediting", "filmmakers", "youtube"],
  "Social Media Manager": ["socialmedia", "SMM", "marketing"],
  "Virtual Assistant": ["VirtualAssistant", "freelance", "remote_writer"],
  "Data Analyst": ["dataisbeautiful", "analytics", "excel"],
  "Data Scientist": ["datascience", "machinelearning", "statistics"],
  "Machine Learning Engineer": ["machinelearning", "LanguageTechnology", "LearnMachineLearning"],
  "Data Engineer": ["dataengineering", "SQL", "bigdata"],
};

const RedditSearch: React.FC<RedditSearchProps> = ({ onSearch, isLoading }) => {
  const [role, setRole] = useState("Web Developer");
  const [subreddits, setSubreddits] = useState<string[]>(SUBREDDIT_MAPPING["Web Developer"]);
  const [newSubreddit, setNewSubreddit] = useState("");
  const [keyword, setKeyword] = useState("");
  const [limit, setLimit] = useState("50");

  const handleRoleChange = (newRole: string) => {
    setRole(newRole);
    if (SUBREDDIT_MAPPING[newRole]) {
      setSubreddits(SUBREDDIT_MAPPING[newRole]);
    }
  };

  const addSubreddit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && newSubreddit.trim()) {
      e.preventDefault();
      if (!subreddits.includes(newSubreddit.trim())) {
        setSubreddits([...subreddits, newSubreddit.trim().toLowerCase()]);
      }
      setNewSubreddit("");
    }
  };

  const removeSubreddit = (sub: string) => {
    setSubreddits(subreddits.filter((s) => s !== sub));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({ role, subreddits, keyword, limit });
  };

  return (
    <section className="main-card bg-white rounded-xl border border-gray-100 p-6 mb-6 w-full max-w-lg mx-auto">
      <h1 className="text-xl font-bold text-gray-800 text-center mb-6">Find Reddit Leads</h1>
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Role / Service Selection */}
        <div className="space-y-1">
          <label className="block text-sm font-semibold text-gray-700" htmlFor="role">
            Service Category
          </label>
          <Select value={role} onValueChange={handleRoleChange}>
            <SelectTrigger className="w-full bg-gray-50 border-gray-300">
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Web Developer">Web Developer</SelectItem>
              <SelectItem value="SEO Expert">SEO Expert</SelectItem>
              <SelectItem value="Shopify Developer">Shopify Developer</SelectItem>
              <SelectItem value="Digital Marketer">Digital Marketer</SelectItem>
              <SelectItem value="App Developer">App Developer</SelectItem>
              <SelectItem value="AI / Automation Developer">AI / Automation Developer</SelectItem>
              <SelectItem value="Android Developer">Android Developer</SelectItem>
              <SelectItem value="IOS Developer">IOS Developer</SelectItem>
              <SelectItem value="UI/UX Designer">UI/UX Designer</SelectItem>
              <SelectItem value="Content Writer">Content Writer</SelectItem>
              <SelectItem value="Video Editor">Video Editor</SelectItem>
              <SelectItem value="Social Media Manager">Social Media Manager</SelectItem>
              <SelectItem value="Virtual Assistant">Virtual Assistant</SelectItem>
              <SelectItem value="Data Analyst">Data Analyst</SelectItem>
              <SelectItem value="Data Scientist">Data Scientist</SelectItem>
              <SelectItem value="Machine Learning Engineer">Machine Learning Engineer</SelectItem>
              <SelectItem value="Data Engineer">Data Engineer</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Subreddits Multi-select */}
        <div className="space-y-1">
          <label className="block text-sm font-semibold text-gray-700" htmlFor="subreddits">
            Subreddits
          </label>
          <div className="flex flex-wrap gap-2 p-2 border border-gray-300 rounded-lg bg-gray-50 mb-2 min-h-[42px]">
            {subreddits.map((sub) => (
              <span key={sub} className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium flex items-center">
                {sub}
                <button
                  type="button"
                  onClick={() => removeSubreddit(sub)}
                  className="ml-1 text-blue-400 hover:text-blue-600 focus:outline-none"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            {subreddits.length === 0 && <span className="text-gray-400 text-xs self-center">No subreddits added</span>}
          </div>
          <Input
            className="bg-gray-50 border-gray-300"
            id="subreddits"
            placeholder="Add subreddit (e.g. smallbusiness) and press Enter"
            value={newSubreddit}
            onChange={(e) => setNewSubreddit(e.target.value)}
            onKeyDown={addSubreddit}
          />
        </div>

        {/* Keyword Input */}
        <div className="space-y-1">
          <label className="block text-sm font-semibold text-gray-700" htmlFor="keyword">
            Keyword (optional)
          </label>
          <Input
            className="bg-gray-50 border-gray-300"
            id="keyword"
            placeholder="e.g. looking for web developer"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>

        {/* Posts Limit */}
        <div className="space-y-1">
          <label className="block text-sm font-semibold text-gray-700" htmlFor="limit">
            Posts Limit
          </label>
          <Select value={limit} onValueChange={setLimit}>
            <SelectTrigger className="w-full bg-gray-50 border-gray-300">
              <SelectValue placeholder="Select limit" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-6 rounded-lg transition-colors shadow-md text-lg"
          disabled={isLoading}
        >
          {isLoading ? "Searching..." : "Find Reddit Leads"}
        </Button>
      </form>
    </section>
  );
};

export default RedditSearch;
