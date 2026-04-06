import React, { useState } from 'react';
import Header from '@/components/Header';
import SearchForm from '@/components/SearchForm';
import LeadTable from '@/components/LeadTable';
import RedditLeadsPage from '@/components/RedditLeadsPage';
import SmartRedditPage from '@/components/SmartRedditPage';
import LeadReviewPage from '@/components/LeadReviewPage';
import { Lead } from '@/types/lead';
import { generateLeads } from '@/api/apiClient';
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

const Index: React.FC = () => {
  const [source, setSource] = useState<"google" | "reddit" | "smart_reddit" | "review">("google");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleGenerateLeads = async (businessType: string, cityArea: string) => {
    const toastId = toast.loading("Fetching leads…");
    setIsLoading(true);
    try {
      const fetchedLeads = await generateLeads(businessType, cityArea);
      if (!fetchedLeads || fetchedLeads.length === 0) {
        toast.info("No leads found for this area.", { id: toastId });
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

  const handleDownloadCSV = async () => {
    if (leads.length === 0) {
      toast.info("Please generate leads first.");
      return;
    }
    try {
      const response = await fetch(`http://${window.location.hostname}:8000/api/export-leads-csv/`, {
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

      <main className="flex-grow">
        {source === "google" && (
          <div className="container mx-auto p-4 flex flex-col items-center justify-center">
            <SearchForm onGenerateLeads={handleGenerateLeads} isLoading={isLoading} />
            {leads.length > 0 && (
              <div className="mt-6 text-right w-full max-w-5xl">
                <Button onClick={handleDownloadCSV} className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Download className="mr-2 h-4 w-4" /> Download CSV
                </Button>
              </div>
            )}
            <LeadTable leads={leads} />
          </div>
        )}

        {source === "reddit" && <RedditLeadsPage />}
        {source === "smart_reddit" && <SmartRedditPage />}
        {source === "review" && <LeadReviewPage />}
      </main>
    </div>
  );
};

export default Index;
