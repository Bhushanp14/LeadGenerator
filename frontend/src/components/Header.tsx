import React from "react";
import { Brain, Building2, ShieldCheck } from "lucide-react";

interface HeaderProps {
  source: "google" | "reddit" | "smart_reddit" | "review";
  setSource: (source: "google" | "reddit" | "smart_reddit" | "review") => void;
}

const Header: React.FC<HeaderProps> = ({ source, setSource }) => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-100 px-6 py-3 flex items-center justify-between">

      {/* Logo */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
          <Building2 className="h-4.5 w-4.5 text-white" />
        </div>
        <span className="text-lg font-bold text-gray-900 tracking-tight">
          Lead Generator
        </span>
      </div>

      {/* Tab Navigation */}
      <nav className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
        <button
          id="tab-google-maps"
          onClick={() => setSource("google")}
          className={`
            px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200
            ${source === "google"
              ? "bg-white text-blue-700 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
            }
          `}
        >
          Google Maps
        </button>
        <button
          id="tab-reddit-leads"
          onClick={() => setSource("reddit")}
          className={`
            px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200
            ${source === "reddit"
              ? "bg-white text-orange-600 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
            }
          `}
        >
          Reddit Leads
        </button>
        <button
          id="tab-smart-reddit"
          onClick={() => setSource("smart_reddit")}
          className={`
            px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-1.5
            ${source === "smart_reddit"
              ? "bg-white text-purple-700 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
            }
          `}
        >
          <Brain className="h-3.5 w-3.5" />
          Smart Leads
        </button>
        <button
          id="tab-lead-review"
          onClick={() => setSource("review")}
          className={`
            px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-1.5
            ${source === "review"
              ? "bg-white text-emerald-700 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
            }
          `}
        >
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
          Lead Review
        </button>
      </nav>

      {/* Spacer */}
      <div className="w-10" />

    </header>
  );
};

export default Header;