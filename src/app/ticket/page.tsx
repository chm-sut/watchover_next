"use client";
import { useState } from "react";
import FiltersBar from "@/components/FiltersBar";
import TicketTable from "@/components/TicketTable";

export default function TicketLifecyclePage() {
  const [filters, setFilters] = useState({
    code: "",
    name: "",
    priority: "",
    customer: "",
    escalationLevel: "",
    progress: "",
    startDay: "",
    startMonth: "",
    startYear: "",
  });

  const [filtersVisible, setFiltersVisible] = useState(false);

  return (
    <>
      {/* Toggle FiltersBar Visibility */}
      <div className="flex justify-start mb-2">
        <button
          className="text-sm text-white bg-logoBlack bg-opacity-70 px-3 py-1 rounded hover:bg-logoBlue"
          onClick={() => setFiltersVisible(!filtersVisible)}
        >
          {filtersVisible ? "Hide Filters" : "Show Filters"}
        </button>
      </div>

      <div
        className={`transition-all duration-300 ease-in-out relative z-[1000] ${
          filtersVisible ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0 pointer-events-none"
        }`}
        style={{ overflow: filtersVisible ? 'visible' : 'hidden' }}
      >
        <FiltersBar filters={filters} setFilters={setFilters} />
      </div>

      <div className="flex-1 overflow-auto rounded-2xl">
        <TicketTable filters={filters} />
      </div>
    </>
  );
}
