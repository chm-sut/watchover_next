import type { Ticket } from "../types";
import { 
  stepNames, 
  getStepStatus, 
  hasSubProcessOccurred,
  getSubProcessDate,
  getSubProcessAuthor,
  formatDate,
  formatWaitingTime,
  getTotalWaitingTime,
  subProcessStepToStatusMap
} from "../utils/ticketInfoUtils";
import StatusIcon from "./StatusIcon";

interface SubProcessStepsProps {
  ticket: Ticket;
}

export default function SubProcessSteps({ ticket }: SubProcessStepsProps) {
  // Check if any sub-processes have occurred or are in progress
  const hasAnySubProcess = [3, 4, 5].some(subIndex => {
    const subStepName = stepNames[subIndex];
    return hasSubProcessOccurred(ticket, subStepName);
  });

  // Only show the sub-processes section if there are any sub-processes
  if (!hasAnySubProcess) {
    return null;
  }

  return (
    <div className="mt-4 space-y-3">
      <div className="text-xs sm:text-sm text-gray-400 mb-3 border-b border-gray-600 pb-2">
        Investigation Sub-processes:
      </div>
      {[3, 4, 5].map((subIndex) => {
        const subStepName = stepNames[subIndex];
        const subCompleted = getStepStatus(ticket, subIndex) === 2;
        const subInProgress = getStepStatus(ticket, subIndex) === 1;
        
        // Only show sub-processes that have actually occurred
        if (!hasSubProcessOccurred(ticket, subStepName)) {
          return null;
        }

        const subProcessDate = getSubProcessDate(ticket, subStepName);
        
        return (
          <div 
            key={subStepName} 
            className="bg-white bg-opacity-5 rounded-2xl p-3 border border-white border-opacity-10"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-5 h-5 flex-shrink-0">
                <StatusIcon status={subCompleted ? 2 : subInProgress ? 1 : 0} />
              </div>
              <span className={`font-medium ${subCompleted ? 'text-green-400' : subInProgress ? 'text-orange-400' : 'text-gray-400'}`}>
                {subStepName}
              </span>
            </div>
            
            {/* Show waiting time for Waiting sub-process */}
            {subIndex === 5 && ((ticket.totalWaitingHours && ticket.totalWaitingHours > 0) || ticket.isCurrentlyWaiting) && (
              <div className="ml-8 mt-3">
                <div className="px-3 py-2 bg-yellow-600 bg-opacity-60 text-yellow-100 text-xs font-medium rounded text-center">
                  ⏳ Currently waiting for {formatWaitingTime(getTotalWaitingTime(ticket))}
                </div>
              </div>
            )}
            
            {/* Show date and author for sub-process */}
            <div className="ml-8 mt-3 space-y-1 text-xs text-darkWhite">
              <div className="flex items-center gap-2">
                <span className="whitespace-nowrap">Date:</span>
                <span className="whitespace-nowrap">
                  {subProcessDate ? formatDate(subProcessDate) : '-'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="whitespace-nowrap">Updated by:</span>
                <span className="whitespace-nowrap">
                  {getSubProcessAuthor(ticket, subStepName)}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}