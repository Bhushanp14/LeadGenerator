import React, { useState, useEffect, useCallback } from "react";
import {
  Brain,
  Check,
  Clock,
  ExternalLink,
  Filter,
  Loader2,
  RefreshCw,
  TrendingUp,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { fetchReviewLeads, labelLead } from "@/api/apiClient";
import { Button } from "@/components/ui/button";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ReviewLead {
  id: number;
  reddit_post_id: string;
  title: string;
  subreddit: string;
  author: string;
  url: string;
  ups: number;
  created_at: string;
  service_category: string;
  classification: "lead" | "maybe_lead" | "noise";
  confidence_score: number;
  reason_tags: string[];
  explanation: string;
}

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

// ─── Review Lead Card ─────────────────────────────────────────────────────────

const ReviewLeadCard: React.FC<{ 
  lead: ReviewLead; 
  onLabel: (post_id: string, isLead: boolean) => void;
  isProcessing: boolean;
}> = ({ lead, onLabel, isProcessing }) => {
  const isMaybe = lead.classification === "maybe_lead";
  
  return (
    <article className={`bg-white rounded-2xl border p-5 hover:shadow-lg transition-all duration-200 group flex flex-col justify-between ${isMaybe ? "border-amber-100 bg-amber-50/5" : "border-gray-100"}`}>
      <div>
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="text-sm font-bold text-gray-800 leading-snug flex-1 group-hover:text-purple-700 transition-colors">
            {lead.title}
          </h3>
          <span className={`shrink-0 text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-tighter ${isMaybe ? "bg-amber-100 text-amber-700" : "bg-purple-100 text-purple-700"}`}>
            {lead.classification.replace('_', ' ')}
          </span>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gray-500 mb-4">
          <span className="flex items-center gap-1">
            <span className="text-orange-500 font-bold">r/</span>
            <span className="font-medium text-gray-700">{lead.subreddit}</span>
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{timeAgo(lead.created_at)}</span>
          </span>
          <span className="flex items-center gap-1 font-bold text-emerald-600">
            <TrendingUp className="h-3 w-3" />
            {(lead.confidence_score * 100).toFixed(0)}% AI
          </span>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-5">
           {lead.reason_tags.slice(0, 4).map(tag => (
             <span key={tag} className="px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded text-[9px] font-medium border border-gray-200/50">
                {tag.replace('_', ' ')}
             </span>
           ))}
        </div>
      </div>

      <div className="space-y-2 mt-auto">
        <div className="grid grid-cols-2 gap-2">
          <Button
            size="sm"
            onClick={() => onLabel(lead.reddit_post_id, true)}
            disabled={isProcessing}
            className="bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-bold h-9 gap-1.5 shadow-sm shadow-emerald-100"
          >
            <Check className="w-3.5 h-3.5" />
            Potential
          </Button>
          <Button
            size="sm"
            onClick={() => onLabel(lead.reddit_post_id, false)}
            disabled={isProcessing}
            variant="destructive"
            className="bg-rose-500 hover:bg-rose-600 text-white text-[11px] font-bold h-9 gap-1.5 shadow-sm shadow-rose-100"
          >
            <X className="w-3.5 h-3.5" />
            Noise
          </Button>
        </div>
        
        <a
          href={lead.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl bg-gray-50 hover:bg-purple-600 text-gray-400 hover:text-white text-[10px] font-bold transition-all duration-150 border border-gray-100 hover:border-transparent cursor-pointer"
        >
          <ExternalLink className="h-3 w-3" />
          View on Reddit
        </a>
      </div>
    </article>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const LeadReviewPage: React.FC = () => {
  const [leads, setLeads] = useState<ReviewLead[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [sort, setSort] = useState<"newest" | "intent" | "confidence_low">("newest");
  const [filterMode, setFilterMode] = useState<"all" | "maybe_lead">("all");

  const loadLeads = useCallback(async () => {
    setIsLoading(true);
    try {
      const classification = filterMode === "all" ? undefined : "maybe_lead";
      const data = await fetchReviewLeads({ classification, sort });
      setLeads(data);
    } catch {
      toast.error("Failed to fetch leads for review.");
    } finally {
      setIsLoading(false);
    }
  }, [sort, filterMode]);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  const handleLabel = async (post_id: string, isLead: boolean) => {
    setProcessingId(post_id);

    try {
      await labelLead({ post_id, user_label: isLead });
      toast.success(isLead ? "Marked as Potential Lead" : "Marked as Noise", {
        duration: 1000,
        position: "bottom-center"
      });
      
      // Remove from list locally
      setLeads(prev => prev.filter(l => l.reddit_post_id !== post_id));
    } catch {
      toast.error("Failed to save label.");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FDFCFE] to-[#F5F3FF] py-10">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 border-b border-purple-100 pb-8">
          <div>
            <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-3">
              <Brain className="h-3 w-3" />
              Training Data Curator
            </div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2">
              Review Queue
            </h1>
            <p className="text-gray-500 text-sm max-w-xl">
              Clean your data and improve the model. Items labeled here are saved to the <span className="font-bold text-gray-700">RedditLeadTrainingData</span> table for future fine-tuning.
            </p>
          </div>
          
          <div className="mt-6 md:mt-0 flex flex-wrap gap-3">
             <div className="flex bg-gray-100 p-1 rounded-xl">
               <button 
                  onClick={() => setFilterMode("all")}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filterMode === "all" ? "bg-white text-purple-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
               >
                 All Unreviewed
               </button>
               <button 
                  onClick={() => setFilterMode("maybe_lead")}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filterMode === "maybe_lead" ? "bg-white text-purple-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
               >
                 Maybe Leads Only
               </button>
             </div>

            <select 
              className="text-xs font-bold border-2 border-gray-100 rounded-xl bg-white px-4 py-2 outline-none focus:border-purple-300"
              value={sort}
              onChange={(e) => setSort(e.target.value as any)}
            >
              <option value="newest">Sort: Newest</option>
              <option value="intent">Sort: High Intent</option>
              <option value="confidence_low">Sort: Uncertain First</option>
            </select>
            
            <Button
              variant="outline"
              onClick={loadLeads}
              className="gap-2 bg-white border-2 border-gray-100 text-xs font-black rounded-xl h-10 px-5"
              disabled={isLoading}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="flex items-center gap-6 mb-8 text-xs font-bold text-gray-400">
           <div className="flex items-center gap-1.5">
             <span className="w-2 h-2 rounded-full bg-purple-500" />
             {leads.length} Items Pending Review
           </div>
           <div className="flex items-center gap-1.5">
             <span className="w-2 h-2 rounded-full bg-emerald-500" />
             Labels guide the classifier
           </div>
        </div>

        {/* Grid Area */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-50 rounded-3xl animate-pulse border-2 border-gray-100 border-dashed" />
            ))}
          </div>
        ) : leads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[2rem] border-2 border-dashed border-purple-100 text-center">
            <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center mb-6">
              <Check className="w-10 h-10 text-purple-400" />
            </div>
            <h2 className="text-3xl font-black text-gray-800 mb-2">Queue is Empty!</h2>
            <p className="text-gray-400 max-w-sm mb-8 font-medium">
              You've successfully labeled all extracted leads in this batch. 
            </p>
            <Button onClick={loadLeads} className="bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl px-8 h-12 shadow-lg shadow-purple-200">
              Refresh to fetch more
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-20 transition-all">
            {leads.map((lead) => (
              <ReviewLeadCard 
                key={lead.reddit_post_id} 
                lead={lead} 
                onLabel={handleLabel}
                isProcessing={processingId === lead.reddit_post_id}
              />
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default LeadReviewPage;
