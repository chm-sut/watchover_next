"use client";
import { useEffect, useState, useRef } from "react";
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hoverInfo, setHoverInfo] = useState<{stepName: string; date: string; author: string; status: string; x: number; y: number} | null>(null);


  const stepNames = ["Create Ticket", "Acknowledge", "Investigate", "Engineer Plan & Update", "Request for Update", "Waiting", "Resolve", "Complete"];
  
  const getInvestigateSubProcess = (ticket: Ticket) => {
    // Check which sub-process of Investigate is currently active
    if (hasStepOccurred(ticket, 5) && (ticket.steps?.[5] || 0) > 0) { // Waiting
      return { name: "Waiting", status: ticket.steps?.[5] || 0, stepIndex: 5 };
    }
    if (hasStepOccurred(ticket, 4) && (ticket.steps?.[4] || 0) > 0) { // Request Update
      return { name: "Request Update", status: ticket.steps?.[4] || 0, stepIndex: 4 };
    }
    if (hasStepOccurred(ticket, 3) && (ticket.steps?.[3] || 0) > 0) { // Engineer Plan
      return { name: "Engineer Plan", status: ticket.steps?.[3] || 0, stepIndex: 3 };
    }
    if (hasStepOccurred(ticket, 2) && (ticket.steps?.[2] || 0) > 0) { // Basic Investigate
      return { name: "Investigate", status: ticket.steps?.[2] || 0, stepIndex: 2 };
    }
    return { name: "Investigate", status: 0, stepIndex: 2 };
  };

  const getSubProcessStatusText = (subProcess: { name: string; status: number }) => {
    if (subProcess.status === 0) {
      return "Not Started";
    } else if (subProcess.status === 2) {
      return "Done";
    } else {
      // Status 1 - in progress, show specific activity
      switch (subProcess.name) {
        case "Investigate":
          return "Investigating";
        case "Engineer Plan":
          return "Engineer Planning";
        case "Request Update":
          return "Update Requesting";
        case "Waiting":
          return "Waiting";
        default:
          return "In Progress";
      }
    }
  };

  const getStepStatusText = (stepName: string, status: number) => {
    if (status === 0) {
      return "Not Started";
    } else if (status === 2) {
      return "Done";
    } else {
      // Status 1 - for all other columns, show "Processing"
      return "Processing";
    }
  };

  const hasStepOccurred = (ticket: Ticket, stepIndex: number) => {
    const stepName = stepNames[stepIndex];
    
    // Create Ticket always occurs
    if (stepName === "Create Ticket") return true;
    
    // Check status history for step occurrence
    const stepToStatusMap: { [key: string]: string[] } = {
      "Acknowledge": ["ASSIGN ENGINEER", "ASSIGN ENGINNER"],
      "Investigate": ["In Progress", "Investigating"],
      "Engineer Plan & Update": ["Engineer plan & update", "Engineering Planning", "Planning"],
      "Request for Update": ["Request for update", "Pending Update", "Update Requested"],
      "Waiting": ["Waiting"],
      "Resolve": ["Resolved", "Resolving"],
      "Complete": ["Closed", "Done", "Completed"]
    };

    const statusPatterns = stepToStatusMap[stepName] || [];
    const hasStatusHistory = ticket.statusHistory?.some(h => 
      statusPatterns.some(pattern => 
        h.toStatus?.toLowerCase() === pattern.toLowerCase()
      )
    );

    // Also check current status for in-progress steps
    const isCurrentStatus = statusPatterns.some(pattern =>
      ticket.status?.name?.toLowerCase() === pattern.toLowerCase()
    );

    // Special check for Waiting
    if (stepName === "Waiting") {
      return hasStatusHistory || ticket.status?.name === "Waiting" || ticket.isCurrentlyWaiting;
    }

    return hasStatusHistory || isCurrentStatus;
  };

  const getStepDetails = (ticket: Ticket, stepIndex: number) => {
    const stepName = stepNames[stepIndex];
    if (!stepName) return { date: '-', author: '-' };

    // For Create Ticket step, always use creation time
    if (stepName === "Create Ticket") {
      const createDate = ticket.timeline?.created || ticket.created;
      const createAuthor = ticket.statusHistory?.find(h => h.fromStatus === null)?.authorName || 
                          (typeof ticket.reporter === 'string' ? ticket.reporter : ticket.reporter?.displayName) || '-';
      return {
        date: createDate ? new Date(createDate).toLocaleDateString('en-GB') + ' ' + new Date(createDate).toLocaleTimeString('en-GB', {hour12: true}) : '-',
        author: createAuthor
      };
    }

    // Special handling for Waiting step
    if (stepName === "Waiting") {
      const waitingHistory = ticket.statusHistory?.find(h => h.toStatus === "Waiting");
      if (waitingHistory && waitingHistory.changedAt) {
        return {
          date: new Date(waitingHistory.changedAt).toLocaleDateString('en-GB') + ' ' + new Date(waitingHistory.changedAt).toLocaleTimeString('en-GB', {hour12: true}),
          author: waitingHistory.authorName || '-'
        };
      }
      return { date: '-', author: '-' };
    }

    // For other steps, find the appropriate status change
    const stepToStatusMap: { [key: string]: string[] } = {
      "Acknowledge": ["ASSIGN ENGINEER", "ASSIGN ENGINNER"],
      "Investigate": ["In Progress", "Investigating"],
      "Engineer Plan & Update": ["Engineer plan & update", "Engineering Planning", "Planning"],
      "Request for Update": ["Request for update", "Pending Update", "Update Requested"],
      "Resolve": ["Resolved", "Resolving"],
      "Complete": ["Closed", "Done", "Completed"]
    };

    const statusPatterns = stepToStatusMap[stepName] || [];
    const statusEntry = ticket.statusHistory?.find(h => 
      statusPatterns.some(pattern => 
        h.toStatus?.toLowerCase().includes(pattern.toLowerCase()) ||
        pattern.toLowerCase().includes(h.toStatus?.toLowerCase() || '')
      )
    );

    if (statusEntry && statusEntry.changedAt) {
      return {
        date: new Date(statusEntry.changedAt).toLocaleDateString('en-GB') + ' ' + new Date(statusEntry.changedAt).toLocaleTimeString('en-GB', {hour12: true}),
        author: statusEntry.authorName || '-'
      };
    }

    return { date: '-', author: '-' };
  };

  const getLatestStep = (ticket: Ticket) => {
    // Check if all steps are completed
    const allCompleted = ticket.steps?.every((s: number) => s === 2);
    if (allCompleted) {
      return { stepName: "Complete", status: 2, stepIndex: 7 };
    }
    
    // Check Resolve
    if (hasStepOccurred(ticket, 6) && (ticket.steps?.[6] || 0) > 0) {
      return { stepName: "Resolve", status: ticket.steps?.[6] || 0, stepIndex: 6 };
    }
    
    // Check Investigate sub-processes (prioritize latest)
    const subProcess = getInvestigateSubProcess(ticket);
    if (subProcess.status > 0) {
      return { stepName: subProcess.name, status: subProcess.status, stepIndex: subProcess.stepIndex };
    }
    
    // Check Acknowledge
    if (hasStepOccurred(ticket, 1) && (ticket.steps?.[1] || 0) > 0) {
      return { stepName: "Acknowledge", status: ticket.steps?.[1] || 0, stepIndex: 1 };
    }
    
    // Default to Create Ticket
    return { stepName: "Create Ticket", status: ticket.steps?.[0] || 1, stepIndex: 0 };
  };

  const getStatusIcon = (status: number, ticket: Ticket, stepIndex: number) => {
    const className = "inline-block align-middle w-6 h-6";
    
    // Override status to grey if step never occurred
    const actualStatus = hasStepOccurred(ticket, stepIndex) ? status : 0;
    
    const stepDetails = getStepDetails(ticket, stepIndex);
    const stepName = stepNames[stepIndex];
    
    const getStatusText = (status: number) => {
      switch (status) {
        case 0: return "Not Started";
        case 1: return "In Progress";  
        case 2: return "Completed";
        default: return "Not Started";
      }
    };
    
    const handleMouseEnter = (e: React.MouseEvent) => {
      const rect = e.currentTarget.getBoundingClientRect();
      
      setHoverInfo({
        stepName,
        date: stepDetails.date,
        author: stepDetails.author,
        status: getStatusText(actualStatus),
        x: rect.left + rect.width / 2,
        y: rect.top - 10
      });
    };
    
    const handleMouseLeave = () => {
      setHoverInfo(null);
    };
    
    const iconElement = (() => {
      switch (actualStatus) {
        case 0:
          return <Image src="/icons/notStart.svg" alt="Not Started" width={36} height={36} className={className} />;
        case 1:
          return <Image src="/icons/inProgress.svg" alt="In Progress" width={36} height={36} className={className} />;
        case 2:
          return <Image src="/icons/Done.svg" alt="Done" width={36} height={36} className={className} />;
        default:
          return <Image src="/icons/notStart.svg" alt="Not Started" width={36} height={36} className={className} />;
      }
    })();

    return (
      <div 
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="inline-block cursor-pointer"
      >
        {iconElement}
      </div>
    );
  };


  const filteredTickets = (Array.isArray(ticketData) ? ticketData : []).filter((t) => {
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
      // Fallback to regular tickets endpoint if database fails
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

    // Auto-refresh disabled
    // intervalRef.current = setInterval(async () => {
    //   const hasUpdates = await checkForUpdates();
    //   if (hasUpdates) {
    //     console.log("📊 Updates detected, refreshing ticket data...");
    //     fetchTickets();
    //   }
    // }, 30000); // Check for updates every 30 seconds, but only refresh if needed

    // Cleanup interval on component unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []); // Empty dependency array - only run once on mount

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
    <div className="w-full h-full flex flex-col rounded-md bg-black bg-opacity-10 relative">
      {/* Smart refresh indicator */}
      {isRefreshing && (
        <div className="bg-green-600 bg-opacity-80 text-white text-xs px-3 py-1 text-center flex-shrink-0">
          📊 New updates detected - refreshing data...
        </div>
      )}
      
      {/* Mobile/Tablet Card View - visible on mobile and tablet screens */}
      <div className="block lg:hidden flex-1 overflow-auto p-4 space-y-3">
        {paginatedTickets.map((t, idx) => {
          const latestStep = getLatestStep(t);
          return (
            <div 
              key={idx}
              className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-4 cursor-pointer hover:bg-opacity-20 transition-all"
              onClick={() => router.push(`/ticket/ticket-info?ticketCode=${t.code}`)}
            >
              {/* Header with Code and Priority */}
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-white font-semibold text-lg">{t.code}</h3>
                  <p className="text-gray-300 text-sm truncate max-w-[200px]">{t.name}</p>
                </div>
                <PriorityBadge priority={t.priority?.name || 'LOW'} />
              </div>
              
              {/* Latest Step Status */}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8">
                  {getStatusIcon(latestStep.status, t, latestStep.stepIndex)}
                </div>
                <div>
                  <p className="text-white font-medium">{latestStep.stepName}</p>
                  <p className="text-gray-400 text-xs">
                    {(() => {
                      // For mobile, if it's an investigate step, show the detailed status
                      if ([2, 3, 4, 5].includes(latestStep.stepIndex)) {
                        const subProcess = getInvestigateSubProcess(t);
                        return getSubProcessStatusText(subProcess);
                      }
                      // For other steps, use the general status text function
                      return getStepStatusText(latestStep.stepName, latestStep.status);
                    })()}
                  </p>
                </div>
              </div>
              
              {/* Customer and Date */}
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-300">{t.customer}</span>
                <span className="text-gray-400">
                  {t.startDate ? formatDate(t.startDate) : (t.created ? formatDate(t.created) : 'Unknown')}
                </span>
              </div>
              
              {/* Escalation Badge */}
              <div className="mt-3 flex items-center gap-2">
                <EscalationBadge ticket={t} size="sm" />
                <EscalationNotificationButton 
                  ticket={t} 
                  escalationLevel={t.escalationLevel || getEscalationLevelForFilter(t)} 
                  size="sm"
                />
              </div>
            </div>
          );
        })}
      </div>
      

      {/* Desktop Table View - visible on large screens */}
      <div className="hidden lg:block flex-1 overflow-auto">
        <div className="min-w-[900px]">
          <table className="w-full text-left text-sm text-white table-auto font-body">
          <thead className="sticky top-0 z-10 bg-logoBlack bg-opacity-10 backdrop-blur-md border-b border-gray-600">
            <tr>
              <th className="px-4 py-2 whitespace-nowrap">
                Code
                {isRefreshing && <span className="ml-2 text-green-400">📊</span>}
              </th>
              <th className="px-4 py-2">Name</th>
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
                  <td className="px-4 py-2" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      <EscalationBadge ticket={t} size="sm" />
                      <EscalationNotificationButton 
                        ticket={t} 
                        escalationLevel={t.escalationLevel || getEscalationLevelForFilter(t)} 
                        size="sm"
                      />
                    </div>
                  </td>
                  <td className="px-4 py-2">{t.customer}</td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    {t.startDate ? formatDate(t.startDate) : (t.created ? formatDate(t.created) : 'Unknown')}
                  </td>
                  {/* Create Ticket */}
                  <td className="text-center px-4 py-2">
                    {getStatusIcon(t.steps?.[0] || 0, t, 0)}
                  </td>
                  
                  {/* Acknowledge */}
                  <td className="text-center px-4 py-2">
                    {getStatusIcon(t.steps?.[1] || 0, t, 1)}
                  </td>
                  
                  {/* Investigate (show text only when in progress) */}
                  <td className="text-center px-4 py-2">
                    {(() => {
                      const subProcess = getInvestigateSubProcess(t);
                      
                      // Only show text when status is 1 (in progress/orange)
                      if (subProcess.status === 1) {
                        const displayName = (() => {
                          switch (subProcess.name) {
                            case "Investigate": return "Investigating";
                            case "Engineer Plan": return "Engineer Planning";
                            case "Request Update": return "Update Requesting";
                            case "Waiting": return "Waiting";
                            default: return subProcess.name;
                          }
                        })();
                        
                        return (
                          <div className="flex items-center justify-center gap-1">
                            <div className="flex-shrink-0">
                              {getStatusIcon(subProcess.status, t, subProcess.stepIndex)}
                            </div>
                            <span className="text-xs text-orange-400 font-medium">
                              {displayName}
                            </span>
                          </div>
                        );
                      } else {
                        // Just show icon for not started (grey) or completed (green)
                        return getStatusIcon(subProcess.status, t, subProcess.stepIndex);
                      }
                    })()}
                  </td>
                  
                  {/* Resolve */}
                  <td className="text-center px-4 py-2">
                    {getStatusIcon(t.steps?.[6] || 0, t, 6)}
                  </td>
                  
                  {/* Complete */}
                  <td className="text-center px-4 py-2">
                    {getStatusIcon(allCompleted ? 2 : 0, t, 7)}
                  </td>
                </tr>
              );
            })}
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

      {/* Tooltip that follows cursor */}
      {hoverInfo && (
        <div 
          className="fixed z-50 bg-black bg-opacity-30 backdrop-blur-sm border border-gray-600 rounded-lg p-3 pointer-events-none transform -translate-x-1/2 -translate-y-full"
          style={{
            left: hoverInfo.x,
            top: hoverInfo.y
          }}
        >
          <div className="space-y-2">
            <h4 className="text-logoWhite font-semibold text-sm">{hoverInfo.stepName}</h4>
            <div className="space-y-1 text-xs text-gray-300">
              <div className="flex items-center gap-2">
                <span>🎯</span>
                <span className="text-white">{hoverInfo.status}</span>
              </div>
              <div className="flex items-center gap-2">
                <span>📅</span>
                <span className="text-white">{hoverInfo.date}</span>
              </div>
              <div className="flex items-center gap-2">
                <span>👤</span>
                <span className="text-white">{hoverInfo.author}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}