import { useRouter } from "next/navigation";
import type { Ticket } from "../types";
import { 
  getInvestigateSubProcess, 
  formatDate 
} from "../utils/ticketUtils";
import { getEscalationLevelForFilter } from "./EscalationBadge";
import EscalationBadge from "./EscalationBadge";
import EscalationNotificationButton from "./EscalationNotificationButton";
import PriorityBadge from "./PriorityBadge";
import StatusIcon from "./StatusIcon";

interface DesktopTicketRowProps {
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

export default function DesktopTicketRow({ 
  ticket, 
  onStatusIconHover, 
  onStatusIconLeave 
}: DesktopTicketRowProps) {
  const router = useRouter();
  const allCompleted = ticket.steps?.every((s: number) => s === 2);

  return (
    <tr 
      className="border-b border-gray-700 hover:bg-white hover:bg-opacity-10 cursor-pointer transition-colors h-12"
      onClick={() => router.push(`/ticket/ticket-info?ticketCode=${ticket.code}`)}
    >
      <td className="px-4 py-2 whitespace-nowrap font-mono">{ticket.code}</td>
      <td className="px-4 py-2">{ticket.name}</td>
      <td className="px-4 py-2">
        <PriorityBadge priority={ticket.priority?.name || 'LOW'} />
      </td>
      <td className="px-4 py-2" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2">
          <EscalationBadge ticket={ticket} size="sm" />
          <EscalationNotificationButton 
            ticket={ticket} 
            escalationLevel={ticket.escalationLevel || getEscalationLevelForFilter(ticket)} 
            size="sm"
          />
        </div>
      </td>
      <td className="px-4 py-2">{ticket.customer}</td>
      <td className="px-4 py-2 whitespace-nowrap">
        {ticket.startDate ? formatDate(ticket.startDate) : (ticket.created ? formatDate(ticket.created) : 'Unknown')}
      </td>
      
      {/* Create Ticket */}
      <td className="text-center px-4 py-2">
        <StatusIcon 
          status={ticket.steps?.[0] || 0}
          ticket={ticket}
          stepIndex={0}
          onMouseEnter={onStatusIconHover}
          onMouseLeave={onStatusIconLeave}
          className="inline-block align-middle w-6 h-6"
        />
      </td>
      
      {/* Acknowledge */}
      <td className="text-center px-4 py-2">
        <StatusIcon 
          status={ticket.steps?.[1] || 0}
          ticket={ticket}
          stepIndex={1}
          onMouseEnter={onStatusIconHover}
          onMouseLeave={onStatusIconLeave}
          className="inline-block align-middle w-6 h-6"
        />
      </td>
      
      {/* Investigate (show text only when in progress) */}
      <td className="text-center px-4 py-2">
        {(() => {
          const subProcess = getInvestigateSubProcess(ticket);
          
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
                  <StatusIcon 
                    status={subProcess.status}
                    ticket={ticket}
                    stepIndex={subProcess.stepIndex}
                    onMouseEnter={onStatusIconHover}
                    onMouseLeave={onStatusIconLeave}
                    className="inline-block align-middle w-6 h-6"
                  />
                </div>
                <span className="text-xs text-orange-400 font-medium">
                  {displayName}
                </span>
              </div>
            );
          } else {
            return (
              <StatusIcon 
                status={subProcess.status}
                ticket={ticket}
                stepIndex={subProcess.stepIndex}
                onMouseEnter={onStatusIconHover}
                onMouseLeave={onStatusIconLeave}
                className="inline-block align-middle w-6 h-6"
              />
            );
          }
        })()}
      </td>
      
      {/* Resolve */}
      <td className="text-center px-4 py-2">
        <StatusIcon 
          status={ticket.steps?.[6] || 0}
          ticket={ticket}
          stepIndex={6}
          onMouseEnter={onStatusIconHover}
          onMouseLeave={onStatusIconLeave}
          className="inline-block align-middle w-6 h-6"
        />
      </td>
      
      {/* Complete */}
      <td className="text-center px-4 py-2">
        <StatusIcon 
          status={allCompleted ? 2 : 0}
          ticket={ticket}
          stepIndex={7}
          onMouseEnter={onStatusIconHover}
          onMouseLeave={onStatusIconLeave}
          className="inline-block align-middle w-6 h-6"
        />
      </td>
    </tr>
  );
}