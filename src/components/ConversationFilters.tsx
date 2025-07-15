import { Trash2 } from "lucide-react";
import type { ConversationFilters } from "../hooks/useConversationFilters";
import CustomerDropdown from "./CustomerDropdown";
import CodeDropdown from "./CodeDropdown";
import PriorityDropdown from "./PriorityDropdown";
import DateDropdown from "./DateDropdown";
import StatusDropdown from "./StatusDropdown";

interface ConversationFiltersProps {
  filters: ConversationFilters;
  filtersVisible: boolean;
  setFiltersVisible: (visible: boolean) => void;
  customers: Record<string, string>;
  ticketCodes: string[];
  isLoadingFilters: boolean;
  clearAllFilters: () => void;
  updateFilter: (key: keyof ConversationFilters, value: string) => void;
}

export default function ConversationFiltersComponent({
  filters,
  filtersVisible,
  setFiltersVisible,
  customers,
  ticketCodes,
  isLoadingFilters,
  clearAllFilters,
  updateFilter
}: ConversationFiltersProps) {
  return (
    <>
      {/* Toggle Filters Visibility */}
      <div className="flex justify-start mb-2">
        <button
          className="text-sm text-white bg-logoBlack bg-opacity-70 px-3 py-1 rounded hover:bg-logoBlue disabled:opacity-50"
          onClick={() => setFiltersVisible(!filtersVisible)}
          disabled={isLoadingFilters}
        >
          {isLoadingFilters ? "Loading Filters..." : filtersVisible ? "Hide Filters" : "Show Filters"}
        </button>
      </div>

      {/* Filters Section */}
      <div
        className={`transition-all duration-300 ease-in-out relative z-[1000] ${
          filtersVisible ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0 pointer-events-none"
        }`}
        style={{ overflow: filtersVisible ? 'visible' : 'hidden' }}
      >
        <div className="bg-black bg-opacity-20 p-4 rounded-2xl mb-4 relative z-[1000] space-y-4">
          {/* Conversation Information Category */}
          <div className="space-y-2">
            <h3 className="text-logoWhite text-sm font-semibold font-heading">Conversation Information</h3>
            <div className="flex gap-2 flex-wrap">
              <CodeDropdown
                value={filters.code}
                onChange={(value) => updateFilter('code', value)}
                codes={ticketCodes}
              />
              <CustomerDropdown
                value={filters.customer}
                onChange={(value) => updateFilter('customer', value)}
                customers={customers}
              />
            </div>
          </div>

          {/* Status & Priority Category */}
          <div className="space-y-2">
            <h3 className="text-logoWhite text-sm font-semibold font-heading">Status & Priority</h3>
            <div className="flex gap-2 flex-wrap">
              <StatusDropdown
                value={filters.status}
                onChange={(value) => updateFilter('status', value)}
              />
              <PriorityDropdown
                value={filters.priority}
                onChange={(value) => updateFilter('priority', value)}
              />
            </div>
          </div>

          {/* Date Filters Category */}
          <div className="space-y-2">
            <h3 className="text-logoWhite text-sm font-semibold font-heading">Date Filters</h3>
            <div className="flex gap-2 flex-wrap">
              <DateDropdown
                value={filters.startDay}
                onChange={(value) => updateFilter('startDay', value)}
                type="day"
              />
              <DateDropdown
                value={filters.startMonth}
                onChange={(value) => updateFilter('startMonth', value)}
                type="month"
              />
              <DateDropdown
                value={filters.startYear}
                onChange={(value) => updateFilter('startYear', value)}
                type="year"
              />
            </div>
          </div>

          {/* Clear Button */}
          <div className="flex justify-end pt-2 border-t border-darkWhite border-opacity-20">
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-md border border-logoRed text-logoRed hover:bg-logoRed hover:text-logoWhite transition-colors font-body text-body"
              onClick={clearAllFilters}
            >
              <Trash2 className="w-4 h-4" />
              Clear All Filters
            </button>
          </div>
        </div>
      </div>
    </>
  );
}