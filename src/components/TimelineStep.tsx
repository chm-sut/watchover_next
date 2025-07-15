import type { Ticket } from "../types";
import { 
  getStepStatus, 
  getStepDate,
  getStepAuthor,
  formatWaitingTime,
  getTotalWaitingTime
} from "../utils/ticketInfoUtils";
import StatusIcon from "./StatusIcon";
import SubProcessSteps from "./SubProcessSteps";

interface TimelineStepProps {
  ticket: Ticket;
  stepName: string;
  stepIndex: number;
}

export default function TimelineStep({ ticket, stepName, stepIndex }: TimelineStepProps) {
  const isCompleted = getStepStatus(ticket, stepIndex) === 2;
  const isInProgress = getStepStatus(ticket, stepIndex) === 1;
  
  // Skip individual sub-process steps (3, 4, 5) as they'll be shown under Investigate
  if (stepIndex >= 3 && stepIndex <= 5) {
    return null;
  }

  return (
    <div className="relative mb-6 sm:mb-8 last:mb-0">
      {/* Timeline Icon */}
      <div className="absolute left-[-50px] sm:left-[-58px] top-0 w-10 h-10 sm:w-11 sm:h-11 z-10">
        <StatusIcon status={isCompleted ? 2 : isInProgress ? 1 : 0} />
      </div>
      
      {/* Step Card */}
      <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl p-4 sm:p-6 w-fit min-w-[200px] sm:min-w-[250px]">
        <h4 className="text-logoWhite font-semibold text-base sm:text-lg mb-2 sm:mb-3 whitespace-nowrap">
          {stepName}
        </h4>
        
        <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-darkWhite">
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm whitespace-nowrap">Date:</span>
            <span className="whitespace-nowrap">
              {getStepDate(ticket, stepName)}
            </span>
          </div>
          
          {/* Always show author field, but only show waiting author if there was actual waiting */}
          {!(stepName === "Waiting" && !ticket.statusHistory?.some(h => h.toStatus === "Waiting")) && (
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm whitespace-nowrap">Updated by:</span>
              <span className="whitespace-nowrap">
                {getStepAuthor(ticket, stepName)}
              </span>
            </div>
          )}
          
          {/* Show sub-processes for Investigate step */}
          {stepIndex === 2 && (
            <SubProcessSteps ticket={ticket} />
          )}
          
          {/* Show waiting time details for Waiting step */}
          {stepName === "Waiting" && ((ticket.totalWaitingHours && ticket.totalWaitingHours > 0) || ticket.isCurrentlyWaiting) && (
            <>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm whitespace-nowrap">Duration:</span>
                <span className="whitespace-nowrap text-yellow-300">
                  {formatWaitingTime(getTotalWaitingTime(ticket))}
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
}