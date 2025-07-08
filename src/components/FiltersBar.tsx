"use client";
import { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";
import CustomerDropdown from "./CustomerDropdown";
import CodeDropdown from "./CodeDropdown";
import PriorityDropdown from "./PriorityDropdown";
import DateDropdown from "./DateDropdown";
import NameDropdown from "./NameDropdown";
import EscalationDropdown from "./EscalationDropdown";

interface Filters {
  code: string;
  name: string;
  priority: string;
  customer: string;
  escalationLevel: string;
  startDay: string;
  startMonth: string;
  startYear: string;
}

interface FiltersBarProps {
  filters: Filters;
  setFilters: (filters: Filters) => void;
}

export default function FiltersBar({ filters, setFilters }: FiltersBarProps) {
  const [customers, setCustomers] = useState<Record<string, string>>({});
  const [codes, setCodes] = useState<string[]>([]);
  const [names, setNames] = useState<string[]>([]);

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

  // Load ticket codes and names from database API
  useEffect(() => {
    async function loadTicketData() {
      try {
        const response = await fetch('/api/tickets/database');
        if (response.ok) {
          const tickets = await response.json();
          const uniqueCodes = [...new Set(tickets.map((ticket: { code: string }) => ticket.code as string))].filter(Boolean).sort() as string[];
          const uniqueNames = [...new Set(tickets.map((ticket: { name: string }) => ticket.name as string))].filter(Boolean).sort() as string[];
          setCodes(uniqueCodes);
          setNames(uniqueNames);
        }
      } catch (error) {
        console.error('Failed to load ticket data:', error);
      }
    }
    loadTicketData();
  }, []);

  return (
    <div className="bg-black bg-opacity-20 p-4 rounded-2xl mb-4 relative z-[1000] space-y-4">
      {/* Ticket Information Category */}
      <div className="space-y-2">
        <h3 className="text-logoWhite text-sm font-semibold font-heading">Ticket Information</h3>
        <div className="flex gap-2 flex-wrap">
          <CodeDropdown
            value={filters.code}
            onChange={(value) => setFilters({ ...filters, code: value })}
            codes={codes}
          />
          <NameDropdown
            value={filters.name}
            onChange={(value) => setFilters({ ...filters, name: value })}
            names={names}
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
        <h3 className="text-logoWhite text-sm font-semibold font-heading">Priority & Escalation</h3>
        <div className="flex gap-2 flex-wrap">
          <PriorityDropdown
            value={filters.priority}
            onChange={(value) => setFilters({ ...filters, priority: value })}
          />
          <EscalationDropdown
            value={filters.escalationLevel}
            onChange={(value) => setFilters({ ...filters, escalationLevel: value })}
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
          onClick={() =>
            setFilters({
              code: "",
              name: "",
              priority: "",
              customer: "",
              escalationLevel: "",
              startDay: "",
              startMonth: "",
              startYear: "",
            })
          }
        >
          <Trash2 className="w-4 h-4" />
          Clear All Filters
        </button>
      </div>
    </div>
  );
}