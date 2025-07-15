import Image from "next/image";
import type { Ticket } from "../types";
import { hasStepOccurred, getStepDetails, stepNames } from "../utils/ticketUtils";

interface StatusIconProps {
  status: number;
  className?: string;
  // Optional props for interactive mode (TicketTable)
  ticket?: Ticket;
  stepIndex?: number;
  onMouseEnter?: (e: React.MouseEvent, hoverInfo: {
    stepName: string;
    date: string;
    author: string;
    status: string;
    x: number;
    y: number;
  }) => void;
  onMouseLeave?: () => void;
}

export default function StatusIcon({ 
  status, 
  className = "w-full h-full",
  ticket, 
  stepIndex, 
  onMouseEnter, 
  onMouseLeave 
}: StatusIconProps) {
  // For interactive mode with tooltips
  const isInteractive = ticket && stepIndex !== undefined && onMouseEnter && onMouseLeave;
  
  const actualStatus = isInteractive ? (hasStepOccurred(ticket, stepIndex) ? status : 0) : status;
  
  const getStatusText = (status: number) => {
    switch (status) {
      case 0: return "Not Started";
      case 1: return "In Progress";  
      case 2: return "Completed";
      default: return "Not Started";
    }
  };
  
  const handleMouseEnter = (e: React.MouseEvent) => {
    if (!isInteractive) return;
    
    const stepDetails = getStepDetails(ticket, stepIndex);
    const stepName = stepNames[stepIndex];
    const rect = e.currentTarget.getBoundingClientRect();
    
    onMouseEnter(e, {
      stepName,
      date: stepDetails.date,
      author: stepDetails.author,
      status: getStatusText(actualStatus),
      x: rect.left + rect.width / 2,
      y: rect.top - 10
    });
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

  if (isInteractive) {
    return (
      <div 
        onMouseEnter={handleMouseEnter}
        onMouseLeave={onMouseLeave}
        className="inline-block cursor-pointer"
      >
        {iconElement}
      </div>
    );
  }

  // Simple mode - just return the icon
  return iconElement;
}