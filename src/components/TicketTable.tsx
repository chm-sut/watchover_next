"use client";
import { useEffect, useState, useRef } from "react";
import TablePagination from "@mui/material/TablePagination";
import type { Ticket, Filters } from "../types";
import { useTicketFiltering } from "../hooks/useTicketFiltering";
import MobileTicketCard from "./MobileTicketCard";
import DesktopTicketRow from "./DesktopTicketRow";
import TicketTooltip from "./TicketTooltip";

export default function TicketTable({ filters }: { filters: Filters }) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [ticketData, setTicketData] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hoverInfo, setHoverInfo] = useState<{stepName: string; date: string; author: string; status: string; x: number; y: number} | null>(null);

  const filteredTickets = useTicketFiltering(ticketData, filters);

  const handleStatusIconHover = (_e: React.MouseEvent, newHoverInfo: {stepName: string; date: string; author: string; status: string; x: number; y: number}) => {
    setHoverInfo(newHoverInfo);
  };

  const handleStatusIconLeave = () => {
    setHoverInfo(null);
  };

  const paginatedTickets = filteredTickets.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const logoWhite = "#F5F7FA";

  const fetchTickets = async (isInitialLoad = false) => {
    if (!isInitialLoad) setIsRefreshing(true);
    
    try {
      const res = await fetch("/api/tickets/database");
      if (!res.ok) throw new Error("Network response was not ok");
      const data = await res.json();
      console.log("Fetched database ticket data:", data);
      setTicketData(data);
      setIsLoading(false);
    } catch (err) {
      console.error("Error fetching database ticket data:", err);
      try {
        const res = await fetch("/api/tickets");
        const data = await res.json();
        console.log("Fetched fallback ticket data:", data);
        setTicketData(data);
        setIsLoading(false);
      } catch (fallbackErr) {
        console.error("Error fetching fallback ticket data:", fallbackErr);
        setIsLoading(false);
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setIsLoading(true);
    fetchTickets(true);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  if (isLoading) {
    return (
      <div className="w-full overflow-x-auto h-full rounded-md bg-black bg-opacity-10">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <h2 className="text-h6 text-logoWhite mb-2 font-heading">Loading Tickets...</h2>
            <p className="text-darkWhite text-sm font-body">
              Fetching the latest ticket data from JIRA
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col rounded-md bg-black bg-opacity-10 relative">
      {/* Smart refresh indicator */}
      {isRefreshing && (
        <div className="bg-green-600 bg-opacity-80 text-white text-xs px-3 py-1 text-center flex-shrink-0">
          📊 New updates detected - refreshing data...
        </div>
      )}
      
      {/* Mobile/Tablet Card View - visible on mobile and tablet screens */}
      <div className="block lg:hidden flex-1 overflow-auto p-4 space-y-3">
        {paginatedTickets.map((ticket, idx) => (
          <MobileTicketCard
            key={idx}
            ticket={ticket}
            onStatusIconHover={handleStatusIconHover}
            onStatusIconLeave={handleStatusIconLeave}
          />
        ))}
      </div>
      
      {/* Desktop Table View - visible on large screens */}
      <div className="hidden lg:block flex-1 overflow-auto">
        <div className="min-w-[900px]">
          <table className="w-full text-left text-sm text-white table-auto font-body">
          <thead className="sticky top-0 z-10 bg-logoBlack bg-opacity-10 backdrop-blur-md border-b border-gray-600">
            <tr>
              <th className="px-4 py-2 whitespace-nowrap">
                Ticket
                {isRefreshing && <span className="ml-2 text-green-400">📊</span>}
              </th>
              <th className="px-4 py-2">Summary</th>
              <th className="px-4 py-2">Priority</th>
              <th className="px-4 py-2 whitespace-nowrap">Escalation Lv.</th>
              <th className="px-4 py-2">Customer</th>
              <th className="px-4 py-2 whitespace-nowrap">Start Date</th>
              <th className="px-4 py-2 text-center">Create</th>
              <th className="px-4 py-2 text-center">Acknowledge</th>
              <th className="px-4 py-2 text-center">Investigate</th>
              <th className="px-4 py-2 text-center">Resolve</th>
              <th className="px-4 py-2 text-center">Complete</th>
            </tr>
          </thead>
          <tbody>
            {paginatedTickets.map((ticket, idx) => (
              <DesktopTicketRow
                key={idx}
                ticket={ticket}
                onStatusIconHover={handleStatusIconHover}
                onStatusIconLeave={handleStatusIconLeave}
              />
            ))}
          </tbody>
          </table>
        </div>
      </div>

      {/* Pagination - fixed at bottom for both mobile and desktop */}
      <div className="flex justify-end border-t border-gray-600 flex-shrink-0">
        <TablePagination
          component="div"
          count={filteredTickets.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 20, 25]}
          sx={{
            ".MuiTablePagination-toolbar": {
              color: logoWhite,
            },
            ".MuiTablePagination-selectLabel": {
              color: logoWhite,
            },
            ".MuiTablePagination-input": {
              color: logoWhite,
            },
            ".MuiTablePagination-actions svg": {
              color: logoWhite,
            },
            ".MuiSelect-icon": {
              color: logoWhite,
            },
          }}
        />
      </div>

      <TicketTooltip hoverInfo={hoverInfo} />
    </div>
  );
}