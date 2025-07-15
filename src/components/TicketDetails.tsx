import { useRouter } from "next/navigation";
import type { Ticket } from "../types";
import { formatDate, formatWaitingTime, getTotalWaitingTime } from "../utils/ticketInfoUtils";
import EscalationBadge from "./EscalationBadge";
import PriorityBadge from "./PriorityBadge";

interface TicketDetailsProps {
  ticket: Ticket;
  hasConversation: boolean;
}

export default function TicketDetails({ ticket, hasConversation }: TicketDetailsProps) {
  const router = useRouter();

  return (
    <>
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
          
          {hasConversation && (
            <div>
              <label className="text-darkWhite text-sm block mb-1">Conversation:</label>
              <button
                onClick={() => router.push(`/live-conversation/${ticket.code}`)}
                className="bg-logoBlue hover:bg-blue-600 text-logoWhite px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4v3c0 .6.4 1 1 1h.5c.2 0 .5-.1.7-.3L14.6 18H20c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
                </svg>
                View Live Conversation
              </button>
            </div>
          )}
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
                  {formatWaitingTime(getTotalWaitingTime(ticket))}
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
            <p className="text-logoWhite font-medium">
              {ticket.timeline?.created ? formatDate(ticket.timeline.created) : (ticket.created ? formatDate(ticket.created) : 'Unknown')}
            </p>
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
            <p className="text-logoWhite font-medium">
              {ticket.timeline?.updated ? formatDate(ticket.timeline.updated) : (ticket.created ? formatDate(ticket.created) : 'Unknown')}
            </p>
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
    </>
  );
}