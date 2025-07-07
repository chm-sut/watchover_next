"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import TicketTimelineLoader from "@/components/TicketTimelineLoader";
import EscalationBadge from "@/components/EscalationBadge";
import type { Ticket } from "@/types";

export default function TicketInformationPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const ticketCode = searchParams.get('ticketCode');
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (ticketCode) {
      fetch(`/api/tickets/${ticketCode}/full`)
        .then((res) => {
          if (!res.ok) throw new Error("Network response was not ok");
          return res.json();
        })
        .then((data) => {
          setTicket(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Error fetching ticket data:", err);
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
    }
  }, [ticketCode]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }) + ' ' + date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getPriorityColor = (level: string) => {
    switch (level.toUpperCase()) {
      case "CRITICAL":
        return "bg-logoRed text-logoWhite";
      case "HIGH":
        return "bg-lightRed text-darkRed";
      case "MEDIUM":
        return "bg-lightOrange text-darkRed";
      case "LOW":
        return "bg-lightYellow text-logoBlack";
      default:
        return "bg-darkWhite text-logoWhite";
    }
  };


  const getStepStatus = (stepIndex: number) => {
    if (!ticket || !ticket.steps || !Array.isArray(ticket.steps)) return 0;
    return ticket.steps[stepIndex] || 0;
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

  const stepNames = ["Create Ticket", "Acknowledge", "Investigate", "Resolve", "Complete"];

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
                  onClick={() => router.back()}
                  className="flex items-center gap-2 px-4 py-2 rounded-md text-logoWhite hover:bg-logoBlue hover:text-logoWhite transition-colors font-body text-body"
                >
                  ← Back
                </button>
                <div className="flex items-center gap-3">
                  <span className="text-logoWhite font-heading text-base font-semibold px-3 py-1 bg-white bg-opacity-20 rounded">
                    {ticket.code}
                  </span>
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
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getPriorityColor(ticket.priority?.name || 'LOW')}`}>
                  {ticket.priority?.name || 'LOW'}
                </span>
              </div>
              
              <div>
                <EscalationBadge ticket={ticket} showLabel={true} size="md" />
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
                <p className="text-logoWhite font-medium">{ticket.currentStatus || ticket.status?.name || 'Unknown'}</p>
              </div>
              
              <div>
                <label className="text-darkWhite text-sm block mb-1">Created:</label>
                <p className="text-logoWhite font-medium">{ticket.timeline?.created ? formatDate(ticket.timeline.created) : (ticket.startDate ? formatDate(ticket.startDate) : 'Unknown')}</p>
              </div>
              
              {ticket.assignee && (
                <div>
                  <label className="text-darkWhite text-sm block mb-1">Assignee:</label>
                  <p className="text-logoWhite font-medium">{ticket.assignee.displayName}</p>
                  <p className="text-darkWhite text-xs">{ticket.assignee.emailAddress}</p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-darkWhite text-sm block mb-1">Last Update:</label>
                <p className="text-logoWhite font-medium">{ticket.timeline?.updated ? formatDate(ticket.timeline.updated) : (ticket.startDate ? formatDate(ticket.startDate) : 'Unknown')}</p>
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
                  <p className="text-logoWhite font-medium">{ticket.reporter.displayName}</p>
                  <p className="text-darkWhite text-xs">{ticket.reporter.emailAddress}</p>
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
                
                return (
                  <div key={stepName} className="relative mb-6 sm:mb-8 last:mb-0">
                    {/* Timeline Icon */}
                    <div className="absolute left-[-50px] sm:left-[-58px] top-0 w-10 h-10 sm:w-11 sm:h-11 z-10">
                      {getStatusIcon(isCompleted ? 2 : isInProgress ? 1 : 0)}
                    </div>
                    
                    {/* Step Card */}
                    <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-4 sm:p-6 w-fit min-w-[200px] sm:min-w-[250px] ">
                      <h4 className="text-logoWhite font-semibold text-base sm:text-lg mb-2 sm:mb-3 whitespace-nowrap">{stepName}</h4>
                      <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-darkWhite">
                        <div className="flex items-center gap-2">
                          <span className="text-xs sm:text-sm whitespace-nowrap">Date:</span>
                          <span className="whitespace-nowrap">
                            {ticket.statusHistory && ticket.statusHistory[index] && ticket.statusHistory[index].created
                              ? formatDate(ticket.statusHistory[index].created) 
                              : (isCompleted || isInProgress ? (ticket.startDate ? formatDate(ticket.startDate) : '-') : '-')
                            }
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs sm:text-sm whitespace-nowrap">Author:</span>
                          <span className="whitespace-nowrap">
                            {ticket.statusHistory && ticket.statusHistory[index] && ticket.statusHistory[index].author
                              ? ticket.statusHistory[index].author?.displayName
                              : (isCompleted || isInProgress ? ticket.reporter?.displayName || 'System' : '-')
                            }
                          </span>
                        </div>
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