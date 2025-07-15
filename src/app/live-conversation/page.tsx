"use client";
import { useEffect } from "react";
import ConversationTable from "@/components/ConversationTable";
import ConversationFilters from "@/components/ConversationFilters";
import { useConversationFilters } from "@/hooks/useConversationFilters";

export default function LiveConversationPage() {
  const {
    filters,
    filtersVisible,
    setFiltersVisible,
    customers,
    ticketCodes,
    isLoadingFilters,
    clearAllFilters,
    updateFilter
  } = useConversationFilters();

  useEffect(() => {
    document.title = "Live Conversation";
  }, []);

  return (
    <>
      <ConversationFilters
        filters={filters}
        filtersVisible={filtersVisible}
        setFiltersVisible={setFiltersVisible}
        customers={customers}
        ticketCodes={ticketCodes}
        isLoadingFilters={isLoadingFilters}
        clearAllFilters={clearAllFilters}
        updateFilter={updateFilter}
      />

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto rounded-2xl">
        <ConversationTable filters={filters} />
      </div>
    </>
  );
}