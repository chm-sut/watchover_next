"use client";
import type { Ticket } from "../types";

interface EscalationBadgeProps {
  ticket: Ticket;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export default function EscalationBadge({ ticket, size = "md", showLabel = false }: EscalationBadgeProps) {
  const getEscalationLevel = (ticket: Ticket) => {
    const baseSizes = {
      sm: "px-1 py-0.5 text-xs",
      md: "px-2 py-1 text-xs",
      lg: "px-3 py-1 text-sm"
    };
    const base = `${baseSizes[size]} rounded-full font-semibold`;
    
    // Use escalation level from database if available, otherwise calculate
    const escalationLevel = ticket.escalationLevel || "None";
    
    switch (escalationLevel) {
      case "Lv.2":
        return { level: "Lv.2", className: `${base} bg-darkRed text-logoWhite` };
      case "Lv.1":
        return { level: "Lv.1", className: `${base} bg-lightOrange text-darkRed` };
      case "None":
        return { level: "None", className: `${base} bg-logoWhite text-logoBlack` };
      default:
        return { level: "Unknown", className: `${base} bg-darkWhite text-logoWhite` };
    }
  };

  const escalation = getEscalationLevel(ticket);

  return (
    <div className="flex items-center gap-2">
      {showLabel && (
        <label className="text-darkWhite text-sm">Escalation Level:</label>
      )}
      <span className={escalation.className}>
        {escalation.level}
      </span>
    </div>
  );
}

// Export the escalation logic for filtering purposes
export const getEscalationLevelForFilter = (ticket: Ticket): string => {
  // If ticket is completed, no escalation
  const allCompleted = ticket.steps?.every((s: number) => s === 2);
  if (allCompleted) {
    return "None";
  }

  // Get priority and set time limits (in hours)
  const priority = ticket.priority?.name || 'LOW';
  let timeLimit: number;
  
  switch (priority.toUpperCase()) {
    case 'HIGH':
      timeLimit = 4;
      break;
    case 'MEDIUM':
      timeLimit = 8;
      break;
    case 'LOW':
      timeLimit = 24;
      break;
    case 'CRITICAL':
      timeLimit = 2;
      break;
    default:
      timeLimit = 24;
  }

  // Calculate elapsed time from start date or created date
  const startDate = ticket.startDate || ticket.created;
  if (!startDate) {
    return "Unknown";
  }

  const start = new Date(startDate);
  const now = new Date();
  const elapsedHours = (now.getTime() - start.getTime()) / (1000 * 60 * 60);
  
  // Calculate percentage of time elapsed
  const percentageElapsed = (elapsedHours / timeLimit) * 100;

  if (percentageElapsed >= 75) {
    return "Lv.2";
  } else if (percentageElapsed >= 50) {
    return "Lv.1";
  } else {
    return "None";
  }
};