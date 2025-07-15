import { useRouter } from "next/navigation";
import type { Ticket } from "../types";
import { 
  getLatestStep, 
  getInvestigateSubProcess, 
  getSubProcessStatusText, 
  getStepStatusText,
  formatDate 
} from "../utils/ticketUtils";
import { getEscalationLevelForFilter } from "./EscalationBadge";
import EscalationBadge from "./EscalationBadge";
import EscalationNotificationButton from "./EscalationNotificationButton";
import PriorityBadge from "./PriorityBadge";
import StatusIcon from "./StatusIcon";

interface MobileTicketCardProps {
  ticket: Ticket;
  onStatusIconHover: (e: React.MouseEvent, hoverInfo: {
    stepName: string;
    date: string;
    author: string;
    status: string;
    x: number;
    y: number;
  }) => void;
  onStatusIconLeave: () => void;
}

export default function MobileTicketCard({ 
  ticket, 
  onStatusIconHover, 
  onStatusIconLeave 
}: MobileTicketCardProps) {
  const router = useRouter();
  const latestStep = getLatestStep(ticket);

  return (
    <div 
      className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-4 cursor-pointer hover:bg-opacity-20 transition-all"
      onClick={() => router.push(`/ticket/ticket-info?ticketCode=${ticket.code}`)}
    >
      {/* Header with Code and Priority */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-white font-semibold text-lg font-mono">{ticket.code}</h3>
          <p className="text-gray-300 text-sm truncate max-w-[200px]">{ticket.name}</p>
        </div>
        <PriorityBadge priority={ticket.priority?.name || 'LOW'} />
      </div>
      
      {/* Latest Step Status */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8">
          <StatusIcon 
            status={latestStep.status}
            ticket={ticket}
            stepIndex={latestStep.stepIndex}
            onMouseEnter={onStatusIconHover}
            onMouseLeave={onStatusIconLeave}
          />
        </div>
        <div>
          <p className="text-white font-medium">{latestStep.stepName}</p>
          <p className="text-gray-400 text-xs">
            {(() => {
              if ([2, 3, 4, 5].includes(latestStep.stepIndex)) {
                const subProcess = getInvestigateSubProcess(ticket);
                return getSubProcessStatusText(subProcess);
              }
              return getStepStatusText(latestStep.stepName, latestStep.status);
            })()}
          </p>
        </div>
      </div>
      
      {/* Customer and Date */}
      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-300">{ticket.customer}</span>
        <span className="text-gray-400">
          {ticket.startDate ? formatDate(ticket.startDate) : (ticket.created ? formatDate(ticket.created) : 'Unknown')}
        </span>
      </div>
      
      {/* Escalation Badge */}
      <div className="mt-3 flex items-center gap-2">
        <EscalationBadge ticket={ticket} size="sm" />
        <EscalationNotificationButton 
          ticket={ticket} 
          escalationLevel={ticket.escalationLevel || getEscalationLevelForFilter(ticket)} 
          size="sm"
        />
      </div>
    </div>
  );
}