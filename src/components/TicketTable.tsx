"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import TablePagination from "@mui/material/TablePagination";
import Image from "next/image";
import type { Ticket, Filters } from "../types";
import EscalationBadge, { getEscalationLevelForFilter } from "./EscalationBadge";
import EscalationNotificationButton from "./EscalationNotificationButton";
import PriorityBadge from "./PriorityBadge";

function formatDate(dateString: string): string {
  const [year, month, day] = dateString.split("-");
  return `${day}-${month}-${year}`;
}

export default function TicketTable({ filters }: { filters: Filters }) {
  const router = useRouter();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [ticketData, setTicketData] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);


  const getStatusIcon = (status: number) => {
    const className = "inline-block align-middle w-auto h-auto";
    switch (status) {
      case 0:
        return <Image src="/icons/notStart.svg" alt="Not Started" width={20} height={20} className={className} />;
      case 1:
        return <Image src="/icons/inProgress.svg" alt="In Progress" width={20} height={20} className={className} />;
      case 2:
        return <Image src="/icons/Done.svg" alt="Done" width={20} height={20} className={className} />;
      default:
        return <Image src="/icons/notStart.svg" alt="Not Started" width={20} height={20} className={className} />;
    }
  };


  const filteredTickets = ticketData.filter((t) => {
    const matchCode = !filters.code || t.code === filters.code;
    const matchName = !filters.name || t.name === filters.name;
    const matchPriority = !filters.priority || t.priority?.name === filters.priority;
    const matchCustomer = !filters.customer || t.customer === filters.customer;
    
    // Use escalation level from database if available, otherwise calculate
    const escalationLevel = t.escalationLevel || getEscalationLevelForFilter(t);
    const matchEscalation = !filters.escalationLevel || escalationLevel === filters.escalationLevel;

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
      matchDay &&
      matchMonth &&
      matchYear
    );
  });

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

  useEffect(() => {
    setIsLoading(true);
    // Use database endpoint to fetch tickets from JIRA webhook database
    fetch("/api/tickets/database")
      .then((res) => {
        if (!res.ok) throw new Error("Network response was not ok");
        return res.json();
      })
      .then((data) => {
        console.log("Fetched database ticket data:", data);
        setTicketData(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching database ticket data:", err);
        // Fallback to regular tickets endpoint if database fails
        fetch("/api/tickets")
          .then((res) => res.json())
          .then((data) => {
            console.log("Fetched fallback ticket data:", data);
            setTicketData(data);
            setIsLoading(false);
          })
          .catch((fallbackErr) => {
            console.error("Error fetching fallback ticket data:", fallbackErr);
            setIsLoading(false);
          });
      });
  }, []);

  // Loading screen component
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
    <div className="w-full overflow-x-auto h-full rounded-md bg-black bg-opacity-10">
      <div className="min-w-[900px]">
        <table className="w-full text-left text-sm text-white table-auto font-body">
          <thead className="sticky top-0 z-10 bg-logoBlack bg-opacity-10 backdrop-blur-md border-b border-gray-600">
            <tr>
              <th className="px-4 py-2 whitespace-nowrap">Code</th>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Priority</th>
              <th className="px-4 py-2 whitespace-nowrap">Escalation Lv.</th>
              <th className="px-4 py-2">Customer</th>
              <th className="px-4 py-2 whitespace-nowrap">Start Date</th>
              <th className="px-4 py-2 text-center">Notify</th>
              <th className="px-4 py-2 text-center">Create</th>
              <th className="px-4 py-2 text-center">Acknowledge</th>
              <th className="px-4 py-2 text-center">Investigate</th>
              <th className="px-4 py-2 text-center">Resolve</th>
              <th className="px-4 py-2 text-center">Completed</th>
            </tr>
          </thead>
          <tbody>
            {paginatedTickets.map((t, idx) => {
              const allCompleted = t.steps?.every((s: number) => s === 2);
              return (
                <tr 
                  key={idx} 
                  className="border-b border-gray-700 hover:bg-white hover:bg-opacity-10 cursor-pointer transition-colors h-12"
                  onClick={() => router.push(`/ticket/ticket-info?ticketCode=${t.code}`)}
                >
                  <td className="px-4 py-2 whitespace-nowrap">{t.code}</td>
                  <td className="px-4 py-2">{t.name}</td>
                  <td className="px-4 py-2">
                    <PriorityBadge priority={t.priority?.name || 'LOW'} />
                  </td>
                  <td className="px-4 py-2">
                    <EscalationBadge ticket={t} size="sm" />
                  </td>
                  <td className="px-4 py-2">{t.customer}</td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    {t.startDate ? formatDate(t.startDate) : (t.created ? formatDate(t.created) : 'Unknown')}
                  </td>
                  <td className="px-4 py-2 text-center" onClick={(e) => e.stopPropagation()}>
                    <EscalationNotificationButton 
                      ticket={t} 
                      escalationLevel={t.escalationLevel || getEscalationLevelForFilter(t)} 
                      size="sm"
                    />
                  </td>
                  {t.steps?.slice(0, 4).map((status: number, i: number) => (
                    <td key={i} className="text-center">
                      {getStatusIcon(status)}
                    </td>
                  )) || Array.from({length: 4}).map((_, i) => (
                    <td key={i} className="text-center">
                      {getStatusIcon(0)}
                    </td>
                  ))}
                  <td className="text-center">
                    {getStatusIcon(allCompleted ? 2 : 0)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end">
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
    </div>
  );
}