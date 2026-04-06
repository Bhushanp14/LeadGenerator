import React, { useState, useEffect, useCallback } from "react";
import {
  ArrowUpCircle,
  Brain,
  Clock,
  ExternalLink,
  Filter,
  Loader2,
  Play,
  RefreshCw,
  Search,
  Sparkles,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { fetchSmartRedditLeads, runSmartRedditPipeline } from "@/api/apiClient";
import { ServiceCategory } from "@/types/lead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SmartLead {
  id: number;
  reddit_post_id: string;
  title: string;
  subreddit: string;
  author: string;
  url: string;
  ups: number;
  created_at: string;
  service_category: string;
  scraped_at: string;
  // New fields
  classification: "lead" | "maybe_lead" | "noise";
  confidence_score: number;
  reason_tags: string[];
  explanation: string;
}

// ─── Static category metadata ─────────────────────────────────────────────────

const CATEGORIES: ServiceCategory[] = [
  { id: "web_development", label: "Web Development" },
  { id: "seo", label: "SEO" },
  { id: "shopify", label: "Shopify" },
  { id: "digital_marketing", label: "Digital Marketing" },
  { id: "design", label: "Design" },
  { id: "app_development", label: "App Development" },
  { id: "automation_ai", label: "Automation / AI" },
];

const CATEGORY_META: Record<string, { icon: string; gradient: string; accent: string }> = {
  web_development: { icon: "🌐", gradient: "from-blue-500 to-indigo-600", accent: "blue" },
  seo: { icon: "🔍", gradient: "from-violet-500 to-purple-600", accent: "violet" },
  shopify: { icon: "🛒", gradient: "from-green-500 to-emerald-600", accent: "green" },
  digital_marketing: { icon: "📣", gradient: "from-orange-500 to-rose-500", accent: "orange" },
  design: { icon: "🎨", gradient: "from-pink-500 to-fuchsia-600", accent: "pink" },
  app_development: { icon: "📱", gradient: "from-sky-500 to-cyan-600", accent: "sky" },
  automation_ai: { icon: "🤖", gradient: "from-yellow-500 to-amber-600", accent: "yellow" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── Category Pill ────────────────────────────────────────────────────────────

const CategoryPill: React.FC<{
  category: ServiceCategory;
  isSelected: boolean;
  onClick: () => void;
}> = ({ category, isSelected, onClick }) => {
  const meta = CATEGORY_META[category.id] ?? { icon: "🔧", gradient: "from-slate-500 to-gray-600", accent: "slate" };
  return (
    <button
      id={`smart-cat-${category.id}`}
      onClick={onClick}
      className={`
        relative flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200
        hover:scale-[1.04] hover:shadow-lg active:scale-[0.97] cursor-pointer select-none
        ${isSelected
          ? `bg-gradient-to-br ${meta.gradient} border-transparent text-white shadow-xl`
          : "bg-white border-gray-100 text-gray-700 hover:border-purple-200 hover:shadow-md"}
      `}
    >
      <span className="text-2xl">{meta.icon}</span>
      <span className={`text-xs font-semibold text-center leading-tight ${isSelected ? "text-white" : "text-gray-700"}`}>
        {category.label}
      </span>
      {isSelected && (
        <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-md">
          <Sparkles className="w-3 h-3 text-purple-500" />
        </span>
      )}
    </button>
  );
};

// ─── Smart Lead Card ──────────────────────────────────────────────────────────

const SmartLeadCard: React.FC<{ lead: SmartLead }> = ({ lead }) => {
  const isMaybe = lead.classification === "maybe_lead";
  return (
    <article className={`bg-white rounded-2xl border p-5 hover:shadow-lg transition-all duration-200 group ${isMaybe ? "border-amber-100 bg-amber-50/10" : "border-gray-100"}`}>
      {/* AI verified badge */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="text-sm font-semibold text-gray-800 leading-snug flex-1 group-hover:text-purple-700 transition-colors">
          {lead.title}
        </h3>
        {isMaybe ? (
          <span className="shrink-0 flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
            <Filter className="w-2.5 h-2.5" />
            Maybe Lead
          </span>
        ) : (
          <span className="shrink-0 flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 border border-purple-200">
            <Brain className="w-2.5 h-2.5" />
            AI Lead
          </span>
        )}
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 mb-2">
        <span className="flex items-center gap-1">
          <span className="text-orange-500 font-bold">r/</span>
          <span className="font-medium text-gray-700">{lead.subreddit}</span>
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>{timeAgo(lead.created_at)}</span>
        </span>
        <span className="flex items-center gap-1">
          <TrendingUp className="h-3 w-3 text-emerald-500" />
          <span>{(lead.confidence_score * 100).toFixed(0)}% Match</span>
        </span>
      </div>

      {/* Explanation row */}
      <div className="mb-4 text-[11px] flex items-center gap-2">
        <div className={`px-2 py-0.5 rounded font-medium ${isMaybe ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>
          {isMaybe ? "Potentially Relevant" : "High Confidence"}
        </div>
        <span className="text-gray-400 font-mono overflow-hidden text-ellipsis whitespace-nowrap">
           {lead.explanation}
        </span>
      </div>

      <a
        href={lead.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-600 hover:to-indigo-600 text-purple-600 hover:text-white text-xs font-semibold transition-all duration-150 border border-purple-100 hover:border-transparent cursor-pointer"
      >
        <ExternalLink className="h-3.5 w-3.5" />
        View Post on Reddit
      </a>
    </article>
  );
};

// ─── Empty State ──────────────────────────────────────────────────────────────

const EmptyState: React.FC<{ categoryLabel: string; onRun: () => void; isRunning: boolean }> = ({
  categoryLabel,
  onRun,
  isRunning,
}) => (
  <div className="flex flex-col items-center justify-center py-20 text-center">
    <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-indigo-200 rounded-full flex items-center justify-center mb-5 shadow-inner">
      <Brain className="h-9 w-9 text-purple-400" />
    </div>
    <h3 className="text-lg font-bold text-gray-800 mb-2">No smart leads yet for {categoryLabel}</h3>
    <p className="text-sm text-gray-500 max-w-sm mb-6">
      Run the pipeline to discover and score leads from Reddit.
    </p>
    <div className="flex flex-col items-center gap-3">
      <Button
        id="run-pipeline-empty"
        onClick={onRun}
        disabled={isRunning}
        className="gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl px-6"
      >
        {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
        {isRunning ? "Running Analysis…" : "Run Smart Pipeline"}
      </Button>
    </div>
  </div>
);

// ─── Pipeline Stats Banner ────────────────────────────────────────────────────

const StatsBanner: React.FC<{ stats: Record<string, number>; onDismiss: () => void }> = ({
  stats,
  onDismiss,
}) => (
  <div className="bg-gradient-to-b from-white to-purple-50/50 border border-purple-100 rounded-2xl p-4 mb-6 flex items-start justify-between gap-4 shadow-sm">
    <div className="flex flex-wrap gap-8">
      {[
        { label: "Analyzed", value: stats.analyzed },
        { label: "High Intent", value: stats.classified_lead, accent: "text-emerald-600" },
        { label: "Maybe", value: stats.classified_maybe, accent: "text-amber-600" },
        { label: "New Stored", value: stats.stored, accent: "text-purple-600" },
      ].map((s) => (
        <div key={s.label} className="text-left">
          <div className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">{s.label}</div>
          <div className={`text-2xl font-black ${s.accent ?? "text-gray-900"}`}>{s.value}</div>
        </div>
      ))}
    </div>
    <button onClick={onDismiss} className="text-gray-400 hover:text-gray-600 mt-1">
      <X className="h-4 w-4" />
    </button>
  </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────

const SmartRedditPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | null>(null);
  const [leads, setLeads] = useState<SmartLead[]>([]);
  const [sort, setSort] = useState<"newest" | "top">("newest");
  const [isLoadingLeads, setIsLoadingLeads] = useState(false);
  const [isRunningPipeline, setIsRunningPipeline] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [pipelineStats, setPipelineStats] = useState<Record<string, number> | null>(null);

  const loadLeads = useCallback(async () => {
    if (!selectedCategory) return;
    setIsLoadingLeads(true);
    try {
      const data = await fetchSmartRedditLeads({ serviceCategory: selectedCategory.id, sort });
      setLeads(data);
    } catch {
      toast.error("Failed to fetch smart leads. Is the backend running?");
    } finally {
      setIsLoadingLeads(false);
    }
  }, [selectedCategory, sort]);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  const handleRunPipeline = async () => {
    setIsRunningPipeline(true);
    const toastId = toast.loading("Running Gemini smart pipeline… this may take a minute.");
    try {
      const result = await runSmartRedditPipeline();
      setPipelineStats(result.stats);
      toast.success(
        `Pipeline complete! ${result.stats.stored} new leads stored.`,
        { id: toastId }
      );
      await loadLeads();
    } catch {
      toast.error("Pipeline failed. Check if Reddit is accessible.", { id: toastId });
    } finally {
      setIsRunningPipeline(false);
    }
  };

  const filteredLeads = searchQuery.trim()
    ? leads.filter(
      (l) =>
        l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.subreddit.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : leads;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-indigo-50/40">
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* ── Page Title ───────────────────────────────────────────────────── */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 bg-purple-600/10 text-purple-700 px-4 py-1.5 rounded-full text-xs font-semibold mb-4">
            <Brain className="h-3.5 w-3.5" />
            AI Verified
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2 tracking-tight">
            Smart Reddit Leads
          </h1>
          <p className="text-gray-500 text-sm max-w-lg mx-auto">
            Every lead below has been individually verified by AI.
            Only genuine service-hire requests make it through.
          </p>
        </div>

        {/* ── Run Pipeline Button ───────────────────────────────────────────── */}
        <div className="flex justify-end mb-6">
          <Button
            id="run-smart-pipeline-btn"
            onClick={handleRunPipeline}
            disabled={isRunningPipeline}
            className="gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl shadow-lg shadow-purple-200"
          >
            {isRunningPipeline ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Zap className="h-4 w-4" />
            )}
            {isRunningPipeline ? "Running…" : "Run Smart Pipeline"}
          </Button>
        </div>

        {/* ── Pipeline Stats Banner ─────────────────────────────────────────── */}
        {pipelineStats && (
          <StatsBanner stats={pipelineStats} onDismiss={() => setPipelineStats(null)} />
        )}

        {/* ── Category Selector ─────────────────────────────────────────────── */}
        <section className="mb-8">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
            Select a Service Category
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {CATEGORIES.map((cat) => (
              <CategoryPill
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
        </section>

        {/* ── Content Area ─────────────────────────────────────────────────── */}
        {selectedCategory && (
          <>
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="smart-lead-search"
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

              <div className="flex gap-2">
                <Button
                  id="smart-sort-newest"
                  size="sm"
                  variant={sort === "newest" ? "default" : "outline"}
                  onClick={() => setSort("newest")}
                  className="gap-1.5"
                >
                  <Clock className="h-3.5 w-3.5" /> Newest
                </Button>
                <Button
                  id="smart-sort-top"
                  size="sm"
                  variant={sort === "top" ? "default" : "outline"}
                  onClick={() => setSort("top")}
                  className="gap-1.5"
                >
                  <TrendingUp className="h-3.5 w-3.5" /> Top
                </Button>
                <Button
                  id="smart-refresh"
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
                  <span className="text-purple-500">Loading…</span>
                ) : (
                  <>
                    <span className="text-purple-600 font-bold">{filteredLeads.length}</span>{" "}
                    {filteredLeads.length === 1 ? "lead" : "leads"}
                    {searchQuery && " matching your filter"} in{" "}
                    <span className="text-gray-800 font-bold">{selectedCategory.label}</span>
                  </>
                )}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-purple-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-100">
                <Filter className="h-3 w-3" />
                AI Filtered
              </span>
            </div>

            {/* Leads grid */}
            {isLoadingLeads ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-10 w-10 animate-spin text-purple-400" />
              </div>
            ) : filteredLeads.length === 0 ? (
              <EmptyState
                categoryLabel={selectedCategory.label}
                onRun={handleRunPipeline}
                isRunning={isRunningPipeline}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                {filteredLeads.map((lead) => (
                  <SmartLeadCard key={lead.id} lead={lead} />
                ))}
              </div>
            )}
          </>
        )}

        {/* ── No category selected placeholder ─────────────────────────────── */}
        {!selectedCategory && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-indigo-200 rounded-full flex items-center justify-center mb-6 shadow-inner">
              <Brain className="h-10 w-10 text-purple-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Choose a service category</h2>
            <p className="text-gray-500 text-sm max-w-xs">
              Select a category above to browse AI-verified Reddit leads.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartRedditPage;
