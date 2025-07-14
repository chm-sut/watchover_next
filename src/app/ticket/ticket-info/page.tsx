"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import TicketTimelineLoader from "@/components/TicketTimelineLoader";
import EscalationBadge from "@/components/EscalationBadge";
import PriorityBadge from "@/components/PriorityBadge";
import type { Ticket } from "@/types";

function TicketInformationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const ticketCode = searchParams.get('ticketCode');
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (ticketCode) {
      // First try to get ticket from database API (same as TicketTable)
      fetch("/api/tickets/database")
        .then((res) => {
          if (!res.ok) throw new Error("Database API response was not ok");
          return res.json();
        })
        .then((data) => {
          // Find the specific ticket by code
          const foundTicket = data.find((t: Record<string, unknown>) => t.code === ticketCode);
          if (foundTicket) {
            setTicket(foundTicket);
            setLoading(false);
          } else {
            throw new Error("Ticket not found in database");
          }
        })
        .catch((err) => {
          console.error("Error fetching from database API:", err);
          // Fallback to full endpoint for additional details
          fetch(`/api/tickets/${ticketCode}/full`)
            .then((res) => {
              if (!res.ok) throw new Error("Network response was not ok");
              return res.json();
            })
            .then((data) => {
              setTicket(data);
              setLoading(false);
            })
            .catch((fullErr) => {
              console.error("Error fetching ticket data:", fullErr);
              // Try fallback to basic endpoint
              fetch(`/api/tickets/${ticketCode}`)
                .then((res) => {
                  if (!res.ok) throw new Error("Fallback network response was not ok");
                  return res.json();
                })
                .then((data) => {
                  console.log("Using fallback endpoint data:", data);
                  setTicket(data);
                  setLoading(false);
                })
                .catch((fallbackErr) => {
                  console.error("Error fetching fallback ticket data:", fallbackErr);
                  setLoading(false);
                });
            });
        });
    }
  }, [ticketCode]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'Asia/Bangkok'
    }) + ' ' + date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Bangkok'
    });
  };

  const formatWaitingTime = (hours: number) => {
    if (hours < 1) {
      return `${Math.round(hours * 60)} minutes`;
    } else if (hours < 24) {
      return `${hours.toFixed(1)} hours`;
    } else {
      const days = Math.floor(hours / 24);
      const remainingHours = Math.round(hours % 24);
      return `${days} day${days > 1 ? 's' : ''} ${remainingHours}h`;
    }
  };


  const stepNames = ["Create Ticket", "Acknowledge", "Investigate", "Engineer Plan & Update", "Request for Update", "Waiting", "Resolve", "Complete"];

  const hasStepOccurred = (stepIndex: number) => {
    if (!ticket) return false;
    
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

  const getStepStatus = (stepIndex: number) => {
    if (!ticket || !ticket.steps || !Array.isArray(ticket.steps)) return 0;
    const originalStatus = ticket.steps[stepIndex] || 0;
    
    // Override to grey if step never occurred
    return hasStepOccurred(stepIndex) ? originalStatus : 0;
  };

  const getStatusIcon = (status: number) => {
    const iconClass = "w-full h-full";
    switch (status) {
      case 0:
        return <img src="/icons/notStart.svg" alt="Not Started" className={iconClass} />;
      case 1:
        return <img src="/icons/inProgress.svg" alt="In Progress" className={iconClass} />;
      case 2:
        return <img src="/icons/Done.svg" alt="Done" className={iconClass} />;
      default:
        return <img src="/icons/notStart.svg" alt="Not Started" className={iconClass} />;
    }
  };

  if (loading) {
    return <TicketTimelineLoader />;
  }

  if (!ticket) {
    return (
      <div className="flex items-center justify-center h-full text-white">
        <div className="text-xl">Ticket not found</div>
      </div>
    );
  }

  return (
    <div className="flex-1 relative">
          {/* Scrollable Content */}
          <div className="absolute rounded-2xl inset-0 bg-logoBlack bg-opacity-40 overflow-y-auto">
          {/* Floating Header */}
          {ticket && (
            <div className="sticky rounded-t-2xl top-0 z-20 bg-logoBlack bg-opacity-10 backdrop-blur-md px-4 sm:px-6 md:px-8 py-2 sm:py-3 md:py-4 relative overflow-hidden border-b border-white border-opacity-20">
              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <button
                  onClick={() => router.push('/ticket')}
                  className="flex items-center gap-2 px-4 py-2 rounded-md text-logoWhite hover:bg-logoBlue hover:text-logoWhite transition-colors font-body text-body"
                >
                  ← Back
                </button>
                <div className="flex items-center gap-3 flex-1">
                  <button
                    onClick={() => window.open(`https://cloud-hm.atlassian.net/browse/${ticket.code}`, '_blank')}
                    className="text-logoWhite font-mono text-base font-semibold px-3 py-1 bg-white bg-opacity-20 hover:bg-logoBlue hover:text-logoWhite rounded transition-colors cursor-pointer flex items-center gap-2"
                    title="Open in JIRA"
                  >
                    {ticket.code}
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.11 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/>
                    </svg>
                  </button>
                  <span className="text-logoWhite font-heading text-h6 sm:text-h5 font-medium">
                    {ticket.name}
                  </span>
                </div>
              </div>
            </div>
          )}
            {/* Ticket Information Card */}
            <div className="rounded-2xl p-4 sm:p-6 md:p-8 w-full">
          {/* Ticket Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div className="space-y-4">
              <div>
                <label className="text-darkWhite text-sm block mb-1">Ticket Name:</label>
                <p className="text-logoWhite font-medium">{ticket.name}</p>
              </div>
              <div>
                <label className="text-darkWhite text-sm block mb-1">Priority:</label>
                <PriorityBadge priority={ticket.priority?.name || 'LOW'} size="md" />
              </div>
              
              <div>
                <label className="text-darkWhite text-sm block mb-1">Escalation Level:</label>
                <EscalationBadge ticket={ticket} showLabel={false} size="md" />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-darkWhite text-sm block mb-1">Ticket Code:</label>
                <p className="text-logoWhite font-medium">{ticket.code}</p>
              </div>
              
              <div>
                <label className="text-darkWhite text-sm block mb-1">Customer:</label>
                <p className="text-logoWhite font-medium">{ticket.customer}</p>
              </div>
            </div>
          </div>

          {/* Additional Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div className="space-y-4">
              <div>
                <label className="text-darkWhite text-sm block mb-1">Status:</label>
                <p className="text-logoWhite font-medium">
                  {ticket.currentStatus || (typeof ticket.status === 'string' ? ticket.status : ticket.status?.name) || 'Unknown'}
                </p>
              </div>
              
              {/* Show waiting time if ticket has waiting data */}
              {((ticket.totalWaitingHours && ticket.totalWaitingHours > 0) || ticket.isCurrentlyWaiting) && (
                <div>
                  <label className="text-darkWhite text-sm block mb-1">Waiting Time:</label>
                  <div className="flex items-center gap-2">
                    <p className="text-logoWhite font-medium">
                      {formatWaitingTime(ticket.totalWaitingHours || 0)}
                    </p>
                    {ticket.isCurrentlyWaiting && (
                      <span className="px-2 py-1 bg-yellow-600 bg-opacity-80 text-yellow-100 text-xs rounded-full">
                        Currently Waiting
                      </span>
                    )}
                  </div>
                </div>
              )}
              
              <div>
                <label className="text-darkWhite text-sm block mb-1">Created:</label>
                <p className="text-logoWhite font-medium">{ticket.timeline?.created ? formatDate(ticket.timeline.created) : (ticket.created ? formatDate(ticket.created) : 'Unknown')}</p>
              </div>
              
              {ticket.assignee && (
                <div>
                  <label className="text-darkWhite text-sm block mb-1">Assignee:</label>
                  <p className="text-logoWhite font-medium">
                    {typeof ticket.assignee === 'string' ? ticket.assignee : ticket.assignee.displayName}
                  </p>
                  {typeof ticket.assignee === 'object' && ticket.assignee.emailAddress && (
                    <p className="text-darkWhite text-xs">{ticket.assignee.emailAddress}</p>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-darkWhite text-sm block mb-1">Last Update:</label>
                <p className="text-logoWhite font-medium">{ticket.timeline?.updated ? formatDate(ticket.timeline.updated) : (ticket.created ? formatDate(ticket.created) : 'Unknown')}</p>
              </div>
              
              {ticket.timeline?.resolved && (
                <div>
                  <label className="text-darkWhite text-sm block mb-1">Resolved:</label>
                  <p className="text-logoWhite font-medium">{formatDate(ticket.timeline.resolved)}</p>
                </div>
              )}
              
              {ticket.reporter && (
                <div>
                  <label className="text-darkWhite text-sm block mb-1">Reporter:</label>
                  <p className="text-logoWhite font-medium">
                    {typeof ticket.reporter === 'string' ? ticket.reporter : ticket.reporter.displayName}
                  </p>
                  {typeof ticket.reporter === 'object' && ticket.reporter.emailAddress && (
                    <p className="text-darkWhite text-xs">{ticket.reporter.emailAddress}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Description Section */}
          {ticket.description && (
            <div className="mb-6 sm:mb-8">
              <label className="text-darkWhite text-sm block mb-2">Description:</label>
              <div className="bg-white bg-opacity-5 rounded-lg p-4 text-logoWhite">
                <p className="whitespace-pre-wrap">{ticket.description}</p>
              </div>
            </div>
          )}

          {/* Status Information Section */}
          <div>
            <h3 className="font-heading text-body sm:text-h6 text-logoWhite mb-4 sm:mb-6">Status Information</h3>
            
            {/* Vertical Timeline */}
            <div className="relative pl-16 sm:pl-20">
              {/* Single Continuous Timeline Line */}
              <div 
                className="absolute left-[-32px] sm:left-[-40px] top-3 sm:top-4 w-0.5 bg-darkWhite z-0" 
                style={{ height: `${(stepNames.length - 1) * 6.5 * 16}px` }}
              />
              
              {stepNames.map((stepName, index) => {
                const isCompleted = getStepStatus(index) === 2;
                const isInProgress = getStepStatus(index) === 1;
                
                // Skip individual sub-process steps (3, 4, 5) as they'll be shown under Investigate
                if (index >= 3 && index <= 5) {
                  return null;
                }
                
                return (
                  <div key={stepName} className="relative mb-6 sm:mb-8 last:mb-0">
                    {/* Timeline Icon */}
                    <div className="absolute left-[-50px] sm:left-[-58px] top-0 w-10 h-10 sm:w-11 sm:h-11 z-10">
                      {getStatusIcon(isCompleted ? 2 : isInProgress ? 1 : 0)}
                    </div>
                    
                    {/* Step Card */}
                    <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl p-4 sm:p-6 w-fit min-w-[200px] sm:min-w-[250px]">
                      <h4 className="text-logoWhite font-semibold text-base sm:text-lg mb-2 sm:mb-3 whitespace-nowrap">{stepName}</h4>
                      
                      <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-darkWhite">
                        <div className="flex items-center gap-2">
                          <span className="text-xs sm:text-sm whitespace-nowrap">Date:</span>
                          <span className="whitespace-nowrap">
                            {(() => {
                              // For Create Ticket step, always use creation time
                              if (stepName === "Create Ticket") {
                                return ticket.timeline?.created ? formatDate(ticket.timeline.created) : (ticket.created ? formatDate(ticket.created) : '-');
                              }
                              
                              // Special handling for Waiting step
                              if (stepName === "Waiting") {
                                // Only show time if there was actually a waiting period
                                if (ticket.statusHistory && ticket.statusHistory.some(h => h.toStatus === "Waiting")) {
                                  const waitingHistory = ticket.statusHistory.find(h => h.toStatus === "Waiting");
                                  if (waitingHistory && waitingHistory.changedAt) {
                                    return formatDate(waitingHistory.changedAt);
                                  }
                                }
                                // No waiting occurred, show dash
                                return '-';
                              }
                              
                              // For other steps, find the appropriate status change
                              if (ticket.statusHistory && (isCompleted || isInProgress)) {
                                // Map step names to status patterns
                                const stepToStatusMap: { [key: string]: string[] } = {
                                  "Acknowledge": ["ASSIGN ENGINEER", "ASSIGN ENGINNER"],
                                  "Investigate": ["In Progress", "Investigating"],
                                  "Engineer Plan & Update": ["Engineer plan & update", "Engineering Planning", "Planning"],
                                  "Request for Update": ["Request for update", "Pending Update", "Update Requested"],
                                  "Resolve": ["Resolved", "Resolving"],
                                  "Complete": ["Closed", "Done", "Completed"]
                                };
                                
                                const statusPatterns = stepToStatusMap[stepName];
                                if (statusPatterns) {
                                  // Find the status history entry that matches this step
                                  const relevantHistory = ticket.statusHistory.find(h => 
                                    statusPatterns.some(pattern => h.toStatus === pattern)
                                  );
                                  
                                  if (relevantHistory && relevantHistory.changedAt) {
                                    return formatDate(relevantHistory.changedAt);
                                  }
                                }
                                
                                // Fallback to creation time if no specific status found
                                return ticket.timeline?.created ? formatDate(ticket.timeline.created) : (ticket.created ? formatDate(ticket.created) : '-');
                              }
                              
                              return '-';
                            })()}
                          </span>
                        </div>
                        {/* Always show author field, but only show waiting author if there was actual waiting */}
                        {!(stepName === "Waiting" && !ticket.statusHistory?.some(h => h.toStatus === "Waiting")) && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs sm:text-sm whitespace-nowrap">Updated by:</span>
                            <span className="whitespace-nowrap">
                              {(() => {
                                // For Create Ticket step, use reporter (who created the ticket)
                                if (stepName === "Create Ticket") {
                                  // Check if we have initial status history entry
                                  const initialHistory = ticket.statusHistory?.find(h => h.fromStatus === null);
                                  if (initialHistory?.authorName) {
                                    return initialHistory.authorName;
                                  }
                                  // Fallback to reporter
                                  return (typeof ticket.reporter === 'string' ? ticket.reporter : ticket.reporter?.displayName) || 'Reporter';
                                }
                                
                                // For steps that haven't been reached yet, show dash
                                if (!isCompleted && !isInProgress) {
                                  return '-';
                                }
                                
                                // For other steps, find the appropriate status change author
                                const stepToStatusMap: { [key: string]: string[] } = {
                                  "Acknowledge": ["ASSIGN ENGINEER", "ASSIGN ENGINNER"],
                                  "Investigate": ["In Progress", "Investigating"],
                                  "Engineer Plan & Update": ["Engineer plan & update", "Engineering Planning", "Planning"],
                                  "Request for Update": ["Request for update", "Pending Update", "Update Requested"],
                                  "Waiting": ["Waiting"],
                                  "Resolve": ["Resolved", "Resolving"],
                                  "Complete": ["Closed", "Done", "Completed"]
                                };
                                
                                const statusPatterns = stepToStatusMap[stepName];
                                if (statusPatterns && ticket.statusHistory) {
                                  // Find the status history entry that matches this step
                                  const relevantHistory = ticket.statusHistory.find(h => 
                                    statusPatterns.some(pattern => h.toStatus === pattern)
                                  );
                                  
                                  if (relevantHistory?.authorName) {
                                    return relevantHistory.authorName;
                                  }
                                }
                                
                                // Fallback to dash if no specific author found
                                return '-';
                              })()}
                            </span>
                          </div>
                        )}
                        
                        {/* Show sub-processes for Investigate step */}
                        {index === 2 && (() => {
                          // Check if any sub-processes have occurred or are in progress
                          const hasAnySubProcess = [3, 4, 5].some(subIndex => {
                            const subStepName = stepNames[subIndex];
                            
                            // For sub-processes, require explicit status history evidence ONLY
                            const stepToStatusMap: { [key: string]: string[] } = {
                              "Engineer Plan & Update": ["engineer plan & update", "engineering planning", "planning"],
                              "Request for Update": ["request for update", "pending update", "update requested"],
                              "Waiting": ["waiting"]
                            };
                            
                            const statusPatterns = stepToStatusMap[subStepName] || [];
                            
                            // Check for exact status history match (case insensitive)
                            const hasExactStatusHistory = ticket.statusHistory?.some(h => {
                              const toStatus = h.toStatus?.toLowerCase().trim() || '';
                              return statusPatterns.some(pattern => 
                                toStatus === pattern || toStatus.includes(pattern)
                              );
                            });
                            
                            // Check if there's actual date/time information for this sub-process
                            const getSubProcessDate = () => {
                              if (subStepName === "Waiting") {
                                if (ticket.statusHistory && ticket.statusHistory.some(h => h.toStatus === "Waiting")) {
                                  const waitingHistory = ticket.statusHistory.find(h => h.toStatus === "Waiting");
                                  return waitingHistory?.changedAt;
                                }
                              } else {
                                const relevantHistory = ticket.statusHistory?.find(h => 
                                  statusPatterns.some(pattern => 
                                    h.toStatus?.toLowerCase().trim() === pattern
                                  )
                                );
                                return relevantHistory?.changedAt;
                              }
                              return null;
                            };
                            
                            const subProcessDate = getSubProcessDate();
                            
                            // Special case for Waiting - also check waiting indicators
                            if (subStepName === "Waiting") {
                              const hasWaitingEvidence = hasExactStatusHistory || ticket.isCurrentlyWaiting || (ticket.totalWaitingHours && ticket.totalWaitingHours > 0);
                              return hasWaitingEvidence && (subProcessDate || ticket.isCurrentlyWaiting || (ticket.totalWaitingHours && ticket.totalWaitingHours > 0));
                            }
                            
                            // For Engineer Plan and Request Update, ONLY show if explicit status history exists AND has date
                            return hasExactStatusHistory && subProcessDate;
                          });
                          
                          // Only show the sub-processes section if there are any sub-processes
                          if (!hasAnySubProcess) {
                            return null;
                          }
                          
                          return (
                            <div className="mt-4 space-y-3">
                              <div className="text-xs sm:text-sm text-gray-400 mb-3 border-b border-gray-600 pb-2">Investigation Sub-processes:</div>
                              {[3, 4, 5].map((subIndex) => {
                                const subStepName = stepNames[subIndex];
                                const subCompleted = getStepStatus(subIndex) === 2;
                                const subInProgress = getStepStatus(subIndex) === 1;
                                
                                // Only show sub-processes that have actually occurred with status history evidence
                                
                                // For sub-processes, require explicit status history evidence ONLY
                                const stepToStatusMap: { [key: string]: string[] } = {
                                  "Engineer Plan & Update": ["engineer plan & update", "engineering planning", "planning"],
                                  "Request for Update": ["request for update", "pending update", "update requested"],
                                  "Waiting": ["waiting"]
                                };
                                
                                const statusPatterns = stepToStatusMap[subStepName] || [];
                                
                                // Check for exact status history match (case insensitive)
                                const hasExactStatusHistory = ticket.statusHistory?.some(h => {
                                  const toStatus = h.toStatus?.toLowerCase().trim() || '';
                                  return statusPatterns.some(pattern => 
                                    toStatus === pattern || toStatus.includes(pattern)
                                  );
                                });
                                
                                // Check if there's actual date/time information for this sub-process
                                const getSubProcessDate = () => {
                                  if (subStepName === "Waiting") {
                                    if (ticket.statusHistory && ticket.statusHistory.some(h => h.toStatus === "Waiting")) {
                                      const waitingHistory = ticket.statusHistory.find(h => h.toStatus === "Waiting");
                                      return waitingHistory?.changedAt;
                                    }
                                  } else {
                                    const relevantHistory = ticket.statusHistory?.find(h => 
                                      statusPatterns.some(pattern => 
                                        h.toStatus?.toLowerCase().trim() === pattern
                                      )
                                    );
                                    return relevantHistory?.changedAt;
                                  }
                                  return null;
                                };
                                
                                const subProcessDate = getSubProcessDate();
                                
                                // Special case for Waiting - also check waiting indicators
                                if (subStepName === "Waiting") {
                                  if (!hasExactStatusHistory && !ticket.isCurrentlyWaiting && (!ticket.totalWaitingHours || ticket.totalWaitingHours === 0)) {
                                    return null;
                                  }
                                  // For waiting, if no date and no current waiting indicators, don't show
                                  if (!subProcessDate && !ticket.isCurrentlyWaiting && (!ticket.totalWaitingHours || ticket.totalWaitingHours === 0)) {
                                    return null;
                                  }
                                } else {
                                  // For Engineer Plan and Request Update, ONLY show if explicit status history exists AND has date
                                  if (!hasExactStatusHistory || !subProcessDate) {
                                    return null;
                                  }
                                }
                              
                              return (
                                <div key={subStepName} className="bg-white bg-opacity-5 rounded-2xl p-3 border border-white border-opacity-10">
                                  <div className="flex items-center gap-3 mb-2">
                                    <div className="w-5 h-5 flex-shrink-0">
                                      {getStatusIcon(subCompleted ? 2 : subInProgress ? 1 : 0)}
                                    </div>
                                    <span className={`font-medium ${subCompleted ? 'text-green-400' : subInProgress ? 'text-orange-400' : 'text-gray-400'}`}>
                                      {subStepName}
                                    </span>
                                  </div>
                                  
                                  {/* Show waiting time for Waiting sub-process */}
                                  {subIndex === 5 && ((ticket.totalWaitingHours && ticket.totalWaitingHours > 0) || ticket.isCurrentlyWaiting) && (
                                    <div className="ml-8 mt-3">
                                      <div className="px-3 py-2 bg-yellow-600 bg-opacity-60 text-yellow-100 text-xs font-medium rounded text-center">
                                        ⏳ Currently waiting for {formatWaitingTime(ticket.totalWaitingHours || 0)}
                                      </div>
                                    </div>
                                  )}
                                  
                                  {/* Show date and author for sub-process - same format as main step */}
                                  <div className="ml-8 mt-3 space-y-1 text-xs text-darkWhite">
                                    <div className="flex items-center gap-2">
                                      <span className="whitespace-nowrap">Date:</span>
                                      <span className="whitespace-nowrap">
                                        {(() => {
                                          if (subStepName === "Waiting") {
                                            if (ticket.statusHistory && ticket.statusHistory.some(h => h.toStatus === "Waiting")) {
                                              const waitingHistory = ticket.statusHistory.find(h => h.toStatus === "Waiting");
                                              if (waitingHistory && waitingHistory.changedAt) {
                                                return formatDate(waitingHistory.changedAt);
                                              }
                                            }
                                          } else {
                                            // For other sub-processes, find the appropriate status change
                                            const stepToStatusMap: { [key: string]: string[] } = {
                                              "Engineer Plan & Update": ["Engineer plan & update", "Engineering Planning", "Planning"],
                                              "Request for Update": ["Request for update", "Pending Update", "Update Requested"]
                                            };
                                            
                                            const statusPatterns = stepToStatusMap[subStepName];
                                            if (statusPatterns && ticket.statusHistory) {
                                              const relevantHistory = ticket.statusHistory.find(h => 
                                                statusPatterns.some(pattern => h.toStatus === pattern)
                                              );
                                              
                                              if (relevantHistory && relevantHistory.changedAt) {
                                                return formatDate(relevantHistory.changedAt);
                                              }
                                            }
                                          }
                                          return '-';
                                        })()}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="whitespace-nowrap">Updated by:</span>
                                      <span className="whitespace-nowrap">
                                        {(() => {
                                          if (subStepName === "Waiting") {
                                            if (ticket.statusHistory && ticket.statusHistory.some(h => h.toStatus === "Waiting")) {
                                              const waitingHistory = ticket.statusHistory.find(h => h.toStatus === "Waiting");
                                              if (waitingHistory && waitingHistory.authorName) {
                                                return waitingHistory.authorName;
                                              }
                                            }
                                          } else {
                                            // For other sub-processes, find the appropriate status change
                                            const stepToStatusMap: { [key: string]: string[] } = {
                                              "Engineer Plan & Update": ["Engineer plan & update", "Engineering Planning", "Planning"],
                                              "Request for Update": ["Request for update", "Pending Update", "Update Requested"]
                                            };
                                            
                                            const statusPatterns = stepToStatusMap[subStepName];
                                            if (statusPatterns && ticket.statusHistory) {
                                              const relevantHistory = ticket.statusHistory.find(h => 
                                                statusPatterns.some(pattern => h.toStatus === pattern)
                                              );
                                              
                                              if (relevantHistory && relevantHistory.authorName) {
                                                return relevantHistory.authorName;
                                              }
                                            }
                                          }
                                          return '-';
                                        })()}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              );
                              })}
                            </div>
                          );
                        })()}
                        
                        {/* Show waiting time details for Waiting step */}
                        {stepName === "Waiting" && ((ticket.totalWaitingHours && ticket.totalWaitingHours > 0) || ticket.isCurrentlyWaiting) && (
                          <>
                            <div className="flex items-center gap-2">
                              <span className="text-xs sm:text-sm whitespace-nowrap">Duration:</span>
                              <span className="whitespace-nowrap text-yellow-300">
                                {formatWaitingTime(ticket.totalWaitingHours || 0)}
                              </span>
                            </div>
                            {ticket.isCurrentlyWaiting && (
                              <div className="px-2 py-1 bg-yellow-600 bg-opacity-60 text-yellow-100 text-xs rounded text-center">
                                ⏳ Currently Waiting
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
            </div>
          </div>
    </div>
  );
}

export default function TicketInformationPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TicketInformationContent />
    </Suspense>
  );
}