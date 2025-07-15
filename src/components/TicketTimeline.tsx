import type { Ticket } from "../types";
import { stepNames } from "../utils/ticketInfoUtils";
import TimelineStep from "./TimelineStep";

interface TicketTimelineProps {
  ticket: Ticket;
}

export default function TicketTimeline({ ticket }: TicketTimelineProps) {
  return (
    <div>
      <h3 className="font-heading text-body sm:text-h6 text-logoWhite mb-4 sm:mb-6">
        Status Information
      </h3>
      
      {/* Vertical Timeline */}
      <div className="relative pl-16 sm:pl-20">
        {/* Single Continuous Timeline Line */}
        <div 
          className="absolute left-[-32px] sm:left-[-40px] top-3 sm:top-4 w-0.5 bg-darkWhite z-0" 
          style={{ height: `${(stepNames.length - 1) * 6.5 * 16}px` }}
        />
        
        {stepNames.map((stepName, index) => (
          <TimelineStep
            key={stepName}
            ticket={ticket}
            stepName={stepName}
            stepIndex={index}
          />
        ))}
      </div>
    </div>
  );
}