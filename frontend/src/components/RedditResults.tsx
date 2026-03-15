import React from "react";
import { Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RedditLead {
  id: string;
  title: string;
  subreddit: string;
  author: string;
  created_utc: string; // Formatting can be handled here or in backend
  ups: number;
  url: string;
}

interface RedditResultsProps {
  leads: RedditLead[];
  onDownloadCSV: () => void;
}

const RedditResults: React.FC<RedditResultsProps> = ({ leads, onDownloadCSV }) => {
  if (leads.length === 0) return null;

  return (
    <div className="w-full max-w-lg mx-auto space-y-6">
      <div className="flex justify-center">
        <Button
          onClick={onDownloadCSV}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-semibold shadow-sm h-auto"
        >
          <Download className="h-4 w-4" />
          Download CSV
        </Button>
      </div>

      <section className="main-card bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
          <h2 className="font-bold text-gray-800">Results</h2>
          <span className="text-xs text-gray-500">Found {leads.length} leads</span>
        </div>

        <div className="divide-y divide-gray-100">
          {leads.map((lead) => (
            <article key={lead.id} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-sm font-bold text-blue-900 leading-snug pr-4">
                  {lead.title}
                </h3>
                <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded whitespace-nowrap">
                  r/{lead.subreddit}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-y-2 text-xs text-gray-600 mb-4">
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-400">Author</p>
                  <p className="truncate">u/{lead.author}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-400">Posted</p>
                  <p>{lead.created_utc}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-400">Upvotes</p>
                  <p>{lead.ups}</p>
                </div>
              </div>
              <Button
                variant="secondary"
                className="w-full bg-gray-100 hover:bg-gray-200 text-blue-700 text-xs font-bold py-2 rounded transition-colors h-auto"
                asChild
              >
                <a href={lead.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3 w-3 mr-2" />
                  View Post
                </a>
              </Button>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};

export default RedditResults;
