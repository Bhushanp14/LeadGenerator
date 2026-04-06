import React, { useState, useEffect, useCallback } from "react";
import {
  ArrowUpCircle,
  Clock,
  ExternalLink,
  Filter,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { fetchRedditLeads, fetchRedditServices, addCustomSubreddit } from "@/api/apiClient";
import { RedditLead, ServiceCategory } from "@/types/lead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// ─── helpers ─────────────────────────────────────────────────────────────────

function timeAgo(isoString: string): string {
  if (!isoString) return "Unknown";
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (days > 0) return `${days}d ago`;
  if (hrs > 0) return `${hrs}h ago`;
  if (mins > 0) return `${mins}m ago`;
  return "Just now";
}

function confidenceBadge(conf: number) {
  if (conf >= 0.75) return { label: "High", cls: "bg-emerald-100 text-emerald-700" };
  if (conf >= 0.45) return { label: "Med", cls: "bg-amber-100 text-amber-700" };
  return { label: "Low", cls: "bg-rose-100 text-rose-700" };
}

// ─── Service Category Card ────────────────────────────────────────────────────

const CATEGORY_META: Record<string, { icon: string; gradient: string }> = {
  web_development:   { icon: "🌐", gradient: "from-blue-500 to-indigo-600" },
  seo:               { icon: "🔍", gradient: "from-violet-500 to-purple-600" },
  shopify:           { icon: "🛒", gradient: "from-green-500 to-emerald-600" },
  digital_marketing: { icon: "📣", gradient: "from-orange-500 to-rose-500" },
  design:            { icon: "🎨", gradient: "from-pink-500 to-fuchsia-600" },
  app_development:   { icon: "📱", gradient: "from-sky-500 to-cyan-600" },
  automation_ai:     { icon: "🤖", gradient: "from-yellow-500 to-amber-600" },
};

interface ServiceCardProps {
  category: ServiceCategory;
  isSelected: boolean;
  onClick: () => void;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ category, isSelected, onClick }) => {
  const meta = CATEGORY_META[category.id] ?? { icon: "🔧", gradient: "from-slate-500 to-gray-600" };
  return (
    <button
      id={`service-card-${category.id}`}
      onClick={onClick}
      className={`
        relative flex flex-col items-center gap-2 p-5 rounded-2xl border-2 transition-all duration-200
        hover:scale-[1.03] hover:shadow-lg active:scale-[0.98] cursor-pointer
        ${isSelected
          ? `bg-gradient-to-br ${meta.gradient} border-transparent text-white shadow-xl shadow-blue-200/40`
          : "bg-white border-gray-100 text-gray-700 hover:border-blue-200"}
      `}
    >
      <span className="text-3xl">{meta.icon}</span>
      <span className={`text-sm font-semibold text-center leading-tight ${isSelected ? "text-white" : "text-gray-700"}`}>
        {category.label}
      </span>
      {isSelected && (
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow">
          <span className="w-2.5 h-2.5 bg-blue-500 rounded-full" />
        </span>
      )}
    </button>
  );
};

// ─── Lead Card ────────────────────────────────────────────────────────────────

const LeadCard: React.FC<{ lead: RedditLead }> = ({ lead }) => {
  const badge = confidenceBadge(lead.ai_confidence);
  return (
    <article className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md hover:border-blue-100 transition-all duration-200 group">
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="text-sm font-semibold text-gray-800 leading-snug flex-1 group-hover:text-blue-700 transition-colors">
          {lead.title}
        </h3>
        <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.cls}`}>
          AI: {badge.label}
        </span>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 mb-4">
        <span className="flex items-center gap-1">
          <span className="text-orange-500 font-bold">r/</span>
          <span className="font-medium text-gray-700">{lead.subreddit}</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="text-gray-400">u/{lead.author}</span>
        </span>
        <span className="flex items-center gap-1">
          <ArrowUpCircle className="h-3 w-3 text-orange-500" />
          <span>{lead.ups} upvotes</span>
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>{timeAgo(lead.created_at)}</span>
        </span>
      </div>

      <a
        href={lead.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white text-xs font-semibold transition-all duration-150"
      >
        <ExternalLink className="h-3.5 w-3.5" />
        View Post on Reddit
      </a>
    </article>
  );
};

// ─── Empty State ──────────────────────────────────────────────────────────────

const EmptyState: React.FC<{ categoryLabel: string }> = ({ categoryLabel }) => (
  <div className="flex flex-col items-center justify-center py-20 text-center">
    <div className="w-20 h-20 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-full flex items-center justify-center mb-5">
      <Zap className="h-8 w-8 text-blue-400" />
    </div>
    <h3 className="text-lg font-bold text-gray-800 mb-2">No leads yet for {categoryLabel}</h3>
    <p className="text-sm text-gray-500 max-w-xs">
      Run the background scraper to discover leads:
    </p>
    <code className="mt-3 px-4 py-2 bg-gray-900 text-green-400 text-xs rounded-lg font-mono">
      python manage.py scrape_reddit_leads
    </code>
  </div>
);

// ─── Main Page Component ──────────────────────────────────────────────────────

const RedditLeadsPage: React.FC = () => {
  const [services, setServices] = useState<ServiceCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | null>(null);
  const [leads, setLeads] = useState<RedditLead[]>([]);
  const [sort, setSort] = useState<"newest" | "top">("newest");
  const [isLoadingServices, setIsLoadingServices] = useState(true);
  const [isLoadingLeads, setIsLoadingLeads] = useState(false);
  const [newSubreddit, setNewSubreddit] = useState("");
  const [isAddingSubreddit, setIsAddingSubreddit] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Load services on mount
  useEffect(() => {
    fetchRedditServices()
      .then(setServices)
      .catch(() => toast.error("Failed to load service categories."))
      .finally(() => setIsLoadingServices(false));
  }, []);

  // Load leads when category or sort changes
  const loadLeads = useCallback(async () => {
    if (!selectedCategory) return;
    setIsLoadingLeads(true);
    try {
      const data = await fetchRedditLeads({ serviceCategory: selectedCategory.id, sort });
      setLeads(data);
    } catch {
      toast.error("Failed to fetch leads. Is the backend running?");
    } finally {
      setIsLoadingLeads(false);
    }
  }, [selectedCategory, sort]);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  const handleAddSubreddit = async () => {
    if (!selectedCategory || !newSubreddit.trim()) return;
    setIsAddingSubreddit(true);
    try {
      await addCustomSubreddit(selectedCategory.id, newSubreddit.trim().toLowerCase());
      toast.success(`r/${newSubreddit.trim()} added to monitoring for ${selectedCategory.label}`);
      setNewSubreddit("");
    } catch {
      toast.error("Failed to add subreddit.");
    } finally {
      setIsAddingSubreddit(false);
    }
  };

  const filteredLeads = searchQuery.trim()
    ? leads.filter((l) =>
        l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.subreddit.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : leads;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40">
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* ── Page Title ─────────────────────────────────────────────────── */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-600/10 text-blue-700 px-4 py-1.5 rounded-full text-xs font-semibold mb-4">
            <Zap className="h-3.5 w-3.5" />
            Background Discovery Engine
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2 tracking-tight">
            Find Reddit Leads
          </h1>
          <p className="text-gray-500 text-sm max-w-lg mx-auto">
            AI-classified service requests scraped from Reddit in the background.
            Select a category to browse opportunities.
          </p>
        </div>

        {/* ── Service Category Selector ───────────────────────────────────── */}
        <section className="mb-8">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
            Select a Service Category
          </h2>
          {isLoadingServices ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              {services.map((cat) => (
                <ServiceCard
                  key={cat.id}
                  category={cat}
                  isSelected={selectedCategory?.id === cat.id}
                  onClick={() => {
                    setSelectedCategory(cat);
                    setSearchQuery("");
                  }}
                />
              ))}
            </div>
          )}
        </section>

        {/* ── Content Area (only when category selected) ──────────────────── */}
        {selectedCategory && (
          <>
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="lead-search"
                  placeholder="Filter leads by title or subreddit…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-white border-gray-200"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Sort */}
              <div className="flex gap-2">
                <Button
                  id="sort-newest"
                  size="sm"
                  variant={sort === "newest" ? "default" : "outline"}
                  onClick={() => setSort("newest")}
                  className="gap-1.5"
                >
                  <Clock className="h-3.5 w-3.5" /> Newest
                </Button>
                <Button
                  id="sort-top"
                  size="sm"
                  variant={sort === "top" ? "default" : "outline"}
                  onClick={() => setSort("top")}
                  className="gap-1.5"
                >
                  <TrendingUp className="h-3.5 w-3.5" /> Top
                </Button>
                <Button
                  id="refresh-leads"
                  size="sm"
                  variant="outline"
                  onClick={loadLeads}
                  disabled={isLoadingLeads}
                  className="gap-1.5"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isLoadingLeads ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              </div>
            </div>

            {/* Stats bar */}
            <div className="flex items-center justify-between mb-5 px-1">
              <span className="text-sm font-semibold text-gray-600">
                {isLoadingLeads ? (
                  <span className="text-blue-500">Loading…</span>
                ) : (
                  <>
                    <span className="text-blue-600 font-bold">{filteredLeads.length}</span>
                    {" "}
                    {filteredLeads.length === 1 ? "lead" : "leads"}
                    {searchQuery && " matching your filter"}
                    {" "}in{" "}
                    <span className="text-gray-800 font-bold">{selectedCategory.label}</span>
                  </>
                )}
              </span>
            </div>

            {/* Leads grid */}
            {isLoadingLeads ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-10 w-10 animate-spin text-blue-400" />
              </div>
            ) : filteredLeads.length === 0 ? (
              <EmptyState categoryLabel={selectedCategory.label} />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                {filteredLeads.map((lead) => (
                  <LeadCard key={lead.id} lead={lead} />
                ))}
              </div>
            )}

            {/* ── Add Subreddit ──────────────────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 mt-2">
              <h3 className="text-sm font-bold text-gray-700 mb-1 flex items-center gap-2">
                <Filter className="h-4 w-4 text-blue-500" />
                Add Subreddit to Monitor
              </h3>
              <p className="text-xs text-gray-400 mb-4">
                The background scraper will include this subreddit when searching for{" "}
                <span className="font-semibold text-gray-600">{selectedCategory.label}</span> leads.
              </p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">r/</span>
                  <Input
                    id="add-subreddit-input"
                    placeholder="subredditname"
                    value={newSubreddit}
                    onChange={(e) => setNewSubreddit(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddSubreddit()}
                    className="pl-8 bg-gray-50 border-gray-200"
                  />
                </div>
                <Button
                  id="add-subreddit-btn"
                  onClick={handleAddSubreddit}
                  disabled={isAddingSubreddit || !newSubreddit.trim()}
                  className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isAddingSubreddit ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  Add
                </Button>
              </div>
            </div>
          </>
        )}

        {/* ── No category selected placeholder ────────────────────────────── */}
        {!selectedCategory && !isLoadingServices && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-full flex items-center justify-center mb-6 shadow-inner">
              <Search className="h-10 w-10 text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Choose a service category</h2>
            <p className="text-gray-500 text-sm max-w-xs">
              Select one of the categories above to browse AI-discovered Reddit leads.
            </p>
          </div>
        )}

      </div>
    </div>
  );
};

export default RedditLeadsPage;
