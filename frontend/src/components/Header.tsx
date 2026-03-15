import React from "react";
import { Building2 } from "lucide-react";

interface HeaderProps {
  source: "google" | "reddit";
  setSource: (source: "google" | "reddit") => void;
}

const Header: React.FC<HeaderProps> = ({ source, setSource }) => {
  return (
    <header className="bg-white shadow-md p-4 flex items-center justify-between relative">

      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
          <Building2 className="h-5 w-5 text-white" />
        </div>
        <span className="text-xl font-bold text-blue-900">
          Lead Generator
        </span>
      </div>

      {/* Navigation */}
      <nav className="absolute left-1/2 -translate-x-1/2 flex gap-8 text-lg">

        <button
          onClick={() => setSource("google")}
          className={`pb-1 border-b-2 transition-all${source === "google"
            ? "text-blue-600 font-semibold"
            : "text-gray-700 hover:text-blue-600"
            }`}
        >
          Google Maps
        </button>

        <button
          onClick={() => setSource("reddit")}
          className={`pb-1 border-b-2 transition-all${source === "reddit"
            ? "text-blue-600 font-semibold"
            : "text-gray-700 hover:text-blue-600"
            }`}
        >
          Reddit
        </button>

      </nav>

      {/* Spacer */}
      <div className="w-8"></div>

    </header>
  );
};

export default Header;