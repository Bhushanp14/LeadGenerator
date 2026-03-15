import React, { useState } from 'react';
import Header from '@/components/Header';
import SearchForm from '@/components/SearchForm';
import LeadTable from '@/components/LeadTable';
import RedditSearch from '@/components/RedditSearch';
import RedditResults from '@/components/RedditResults';
import { Lead, RedditLead } from '@/types/lead';
import { generateLeads, generateRedditLeads } from '@/api/apiClient';
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

const Index: React.FC = () => {

  const [source, setSource] = useState<"google" | "reddit">("google");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [redditLeads, setRedditLeads] = useState<RedditLead[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchParams, setSearchParams] = useState<{ businessType: string; cityArea: string } | null>(null);

  const handleGenerateLeads = async (businessType: string, cityArea: string) => {
    const toastId = toast.loading("Fetching leads...");
    setIsLoading(true);

    try {
      const fetchedLeads = await generateLeads(businessType, cityArea);
      setSearchParams({ businessType, cityArea });

      if (!fetchedLeads || fetchedLeads.length === 0) {
        toast.info("No leads found for this area.");
        setLeads([]);
      } else {
        setLeads(fetchedLeads);
        toast.success("✅ Leads fetched successfully!", { id: toastId });
      }
    } catch (error) {
      console.error("Lead fetch error:", error);
      toast.error("❌ Failed to fetch leads. Please try again.", { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ POST leads and download CSV
  const handleDownloadCSV = async () => {
    if (leads.length === 0) {
      toast.info("Please generate leads first.");
      return;
    }

    try {
      const response = await fetch("http://127.0.0.1:8000/api/export-leads-csv/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leads }),
      });

      if (!response.ok) throw new Error("Failed to download CSV");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `leads_${new Date().toISOString().replace(/[:.]/g, "-")}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast.success("✅ CSV downloaded successfully!");
    } catch (error) {
      console.error("CSV download failed:", error);
      toast.error("❌ Failed to download CSV. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header source={source} setSource={setSource} />
      <main className="flex-grow container mx-auto p-4 flex flex-col items-center justify-center">


        {source === "google" && (
          <>
            <SearchForm
              onGenerateLeads={handleGenerateLeads}
              isLoading={isLoading}
            />

            {leads.length > 0 && (
              <div className="mt-6 text-right">
                <Button onClick={handleDownloadCSV} className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Download className="mr-2 h-4 w-4" /> Download CSV
                </Button>
              </div>
            )}

            <LeadTable leads={leads} />
          </>
        )}

        {source === "reddit" && (
          <div className="w-full">
            <RedditSearch
              onSearch={async (params) => {
                setIsLoading(true);
                const toastId = toast.loading(`Searching Reddit for ${params.role}...`);
                try {
                  const data = await generateRedditLeads(params);
                  setRedditLeads(data);
                  toast.success("✅ Reddit leads found!", { id: toastId });
                } catch (error) {
                  toast.error("❌ Failed to fetch Reddit leads.", { id: toastId });
                } finally {
                  setIsLoading(false);
                }
              }}
              isLoading={isLoading}
            />
            <RedditResults
              leads={redditLeads}
              onDownloadCSV={async () => {
                if (redditLeads.length === 0) {
                  toast.info("Please generate leads first.");
                  return;
                }

                try {
                  const response = await fetch("http://127.0.0.1:8000/api/export-leads-csv/", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ leads: redditLeads }),
                  });

                  if (!response.ok) throw new Error("Failed to download CSV");

                  const blob = await response.blob();
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `reddit_leads_${new Date().toISOString().replace(/[:.]/g, "-")}.csv`;
                  document.body.appendChild(a);
                  a.click();
                  a.remove();
                  window.URL.revokeObjectURL(url);

                  toast.success("✅ Reddit CSV downloaded successfully!");
                } catch (error) {
                  console.error("CSV download failed:", error);
                  toast.error("❌ Failed to download CSV.");
                }
              }}
            />
          </div>
        )}


      </main>
    </div>
  );
};

export default Index;
