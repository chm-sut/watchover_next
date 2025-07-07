"use client";
import { useState } from "react";
import ConversationTable from "@/components/ConversationTable";

export default function LiveConversationPage() {
  const [filters] = useState({
    code: "",
    name: "",
    status: "",
    customer: "",
    startDay: "",
    startMonth: "",
    startYear: "",
  });

  const [filtersVisible, setFiltersVisible] = useState(false);

  return (
    <>
      {/* Toggle Filters Visibility */}
      <div className="flex justify-start mb-2">
        <button
          className="text-sm text-white bg-logoBlack bg-opacity-70 px-3 py-1 rounded hover:bg-logoBlue"
          onClick={() => setFiltersVisible(!filtersVisible)}
        >
          {filtersVisible ? "Hide Filters" : "Show Filters"}
        </button>
      </div>

      {/* Filters Section - Placeholder */}
      <div
        className={`transition-all duration-300 ease-in-out relative z-[1000] ${
          filtersVisible ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0 pointer-events-none"
        }`}
        style={{ overflow: filtersVisible ? 'visible' : 'hidden' }}
      >
        <div className="bg-black bg-opacity-20 p-3 rounded-2xl mb-4">
          <p className="text-white text-sm">Conversation filters will go here...</p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto rounded-2xl">
        <ConversationTable filters={filters} />
      </div>
    </>
  );
}