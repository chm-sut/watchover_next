"use client";
import { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";
import ConversationTable from "@/components/ConversationTable";
import CustomerDropdown from "@/components/CustomerDropdown";
import CodeDropdown from "@/components/CodeDropdown";
import PriorityDropdown from "@/components/PriorityDropdown";
import DateDropdown from "@/components/DateDropdown";
import StatusDropdown from "@/components/StatusDropdown";

export default function LiveConversationPage() {
  const [filters, setFilters] = useState({
    code: "",
    name: "",
    status: "",
    customer: "",
    priority: "",
    startDay: "",
    startMonth: "",
    startYear: "",
  });

  const [filtersVisible, setFiltersVisible] = useState(false);
  const [customers, setCustomers] = useState<Record<string, string>>({});
  const [ticketCodes, setTicketCodes] = useState<string[]>([]);

  // Load customer data
  useEffect(() => {
    async function loadCustomers() {
      try {
        const response = await fetch('/data/customerMap.json');
        if (response.ok) {
          const customerData = await response.json();
          setCustomers(customerData);
        }
      } catch (error) {
        console.error('Failed to load customer data:', error);
      }
    }
    loadCustomers();
  }, []);

  // Load ticket codes from comments API
  useEffect(() => {
    async function loadTicketCodes() {
      try {
        const response = await fetch('/api/comments/database?limit=1000');
        if (response.ok) {
          const data = await response.json();
          const uniqueCodes = [...new Set(data.comments?.map((comment: any) => comment.ticketCode))].filter(Boolean).sort() as string[];
          setTicketCodes(uniqueCodes);
        }
      } catch (error) {
        console.error('Failed to load ticket codes:', error);
      }
    }
    loadTicketCodes();
  }, []);


  const clearAllFilters = () => {
    setFilters({
      code: "",
      name: "",
      status: "",
      customer: "",
      priority: "",
      startDay: "",
      startMonth: "",
      startYear: "",
    });
  };

  useEffect(() => {
    document.title = "Live Conversation";
  }, []);

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
                onChange={(value) => setFilters({ ...filters, code: value })}
                codes={ticketCodes}
              />
              <CustomerDropdown
                value={filters.customer}
                onChange={(value) => setFilters({ ...filters, customer: value })}
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
                onChange={(value) => setFilters({ ...filters, status: value })}
              />
              <PriorityDropdown
                value={filters.priority}
                onChange={(value) => setFilters({ ...filters, priority: value })}
              />
            </div>
          </div>

          {/* Date Filters Category */}
          <div className="space-y-2">
            <h3 className="text-logoWhite text-sm font-semibold font-heading">Date Filters</h3>
            <div className="flex gap-2 flex-wrap">
              <DateDropdown
                value={filters.startDay}
                onChange={(value) => setFilters({ ...filters, startDay: value })}
                type="day"
              />
              <DateDropdown
                value={filters.startMonth}
                onChange={(value) => setFilters({ ...filters, startMonth: value })}
                type="month"
              />
              <DateDropdown
                value={filters.startYear}
                onChange={(value) => setFilters({ ...filters, startYear: value })}
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

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto rounded-2xl">
        <ConversationTable filters={filters} />
      </div>
    </>
  );
}