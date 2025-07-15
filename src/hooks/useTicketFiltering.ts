import { useMemo } from "react";
import type { Ticket, Filters } from "../types";
import { getTicketProgressFilter } from "../utils/ticketUtils";
import { getEscalationLevelForFilter } from "../components/EscalationBadge";

export function useTicketFiltering(ticketData: Ticket[], filters: Filters) {
  const filteredTickets = useMemo(() => {
    return (Array.isArray(ticketData) ? ticketData : []).filter((t) => {
      const matchCode = !filters.code || t.code === filters.code;
      const matchName = !filters.name || t.name === filters.name;
      const matchPriority = !filters.priority || t.priority?.name === filters.priority;
      const matchCustomer = !filters.customer || t.customer === filters.customer;
      
      const escalationLevel = t.escalationLevel || getEscalationLevelForFilter(t);
      const matchEscalation = !filters.escalationLevel || escalationLevel === filters.escalationLevel;

      const ticketProgress = getTicketProgressFilter(t);
      const matchProgress = !filters.progress || ticketProgress === filters.progress;

      const [year, month, day] = t.startDate?.split("-") || [];
      const matchDay = !filters.startDay || filters.startDay === day;
      const matchMonth = !filters.startMonth || filters.startMonth === month;
      const matchYear = !filters.startYear || filters.startYear === year;

      return (
        matchCode &&
        matchName &&
        matchPriority &&
        matchCustomer &&
        matchEscalation &&
        matchProgress &&
        matchDay &&
        matchMonth &&
        matchYear
      );
    });
  }, [ticketData, filters]);

  return filteredTickets;
}