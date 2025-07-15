import { useState, useEffect } from "react";

export interface ConversationFilters {
  code: string;
  name: string;
  status: string;
  customer: string;
  priority: string;
  startDay: string;
  startMonth: string;
  startYear: string;
}

export function useConversationFilters() {
  const [filters, setFilters] = useState<ConversationFilters>({
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
  const [isLoadingFilters, setIsLoadingFilters] = useState(true);

  // Load filter data in parallel (optimized)
  useEffect(() => {
    async function loadFilterData() {
      setIsLoadingFilters(true);
      try {
        const [customerResponse, commentsResponse] = await Promise.all([
          fetch('/data/customerMap.json'),
          fetch('/api/comments/database?limit=200')
        ]);

        if (customerResponse.ok) {
          const customerData = await customerResponse.json();
          setCustomers(customerData);
        }

        if (commentsResponse.ok) {
          const data = await commentsResponse.json();
          const uniqueCodes = [...new Set(data.comments?.map((comment: any) => comment.ticketCode))].filter(Boolean).sort() as string[];
          setTicketCodes(uniqueCodes);
        }
      } catch (error) {
        console.error('Failed to load filter data:', error);
      } finally {
        setIsLoadingFilters(false);
      }
    }
    loadFilterData();
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

  const updateFilter = (key: keyof ConversationFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return {
    filters,
    setFilters,
    filtersVisible,
    setFiltersVisible,
    customers,
    ticketCodes,
    isLoadingFilters,
    clearAllFilters,
    updateFilter
  };
}