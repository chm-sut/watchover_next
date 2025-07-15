import type { Ticket } from "../types";

export const stepNames = [
  "Create Ticket",
  "Acknowledge", 
  "Investigate",
  "Engineer Plan & Update",
  "Request for Update",
  "Waiting",
  "Resolve",
  "Complete"
];

export const stepToStatusMap: { [key: string]: string[] } = {
  "Acknowledge": ["ASSIGN ENGINEER", "ASSIGN ENGINNER"],
  "Investigate": ["In Progress", "Investigating"],
  "Engineer Plan & Update": ["Engineer plan & update", "Engineering Planning", "Planning"],
  "Request for Update": ["Request For Update", "Pending Update", "Update Requested"],
  "Waiting": ["Waiting"],
  "Resolve": ["Resolved", "Resolving"],
  "Complete": ["Closed", "Done", "Completed"]
};

export const subProcessStepToStatusMap: { [key: string]: string[] } = {
  "Engineer Plan & Update": ["engineer plan & update", "engineering planning", "planning"],
  "Request for Update": ["request for update", "pending update", "update requested"],
  "Waiting": ["waiting"]
};

export function formatDate(dateString: string): string {
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
}

export function formatWaitingTime(hours: number): string {
  if (hours < 1) {
    return `${Math.round(hours * 60)} minutes`;
  } else if (hours < 24) {
    return `${hours.toFixed(1)} hours`;
  } else {
    const days = Math.floor(hours / 24);
    const remainingHours = Math.round(hours % 24);
    return `${days} day${days > 1 ? 's' : ''} ${remainingHours}h`;
  }
}

export function getTotalWaitingTime(ticket: any): number {
  let totalWaitingTime = ticket.totalWaitingHours || 0;
  
  if (ticket.isCurrentlyWaiting && ticket.waitingStartTime) {
    const currentWaitingDuration = (new Date().getTime() - new Date(ticket.waitingStartTime).getTime()) / (1000 * 60 * 60);
    totalWaitingTime += currentWaitingDuration;
  }
  
  return totalWaitingTime;
}

export function hasStepOccurred(ticket: Ticket, stepIndex: number): boolean {
  const stepName = stepNames[stepIndex];
  
  if (stepName === "Create Ticket") return true;
  
  const statusPatterns = stepToStatusMap[stepName] || [];
  const hasStatusHistory = ticket.statusHistory?.some(h => 
    statusPatterns.some(pattern => 
      h.toStatus?.toLowerCase() === pattern.toLowerCase()
    )
  );

  const isCurrentStatus = statusPatterns.some(pattern =>
    ticket.status?.name?.toLowerCase() === pattern.toLowerCase()
  );

  if (stepName === "Waiting") {
    return hasStatusHistory || ticket.status?.name === "Waiting" || Boolean(ticket.isCurrentlyWaiting);
  }

  return hasStatusHistory || isCurrentStatus;
}

export function getStepStatus(ticket: Ticket, stepIndex: number): number {
  if (!ticket || !ticket.steps || !Array.isArray(ticket.steps)) return 0;
  const originalStatus = ticket.steps[stepIndex] || 0;
  
  return hasStepOccurred(ticket, stepIndex) ? originalStatus : 0;
}

export function getStepDate(ticket: Ticket, stepName: string): string {
  if (stepName === "Create Ticket") {
    return ticket.timeline?.created ? formatDate(ticket.timeline.created) : (ticket.created ? formatDate(ticket.created) : '-');
  }
  
  if (stepName === "Waiting") {
    if (ticket.statusHistory && ticket.statusHistory.some(h => h.toStatus === "Waiting")) {
      const waitingHistory = ticket.statusHistory.find(h => h.toStatus === "Waiting");
      if (waitingHistory && waitingHistory.changedAt) {
        return formatDate(waitingHistory.changedAt);
      }
    }
    return '-';
  }
  
  const statusPatterns = stepToStatusMap[stepName];
  if (statusPatterns && ticket.statusHistory) {
    const relevantHistory = ticket.statusHistory.find(h => 
      statusPatterns.some(pattern => h.toStatus === pattern)
    );
    
    if (relevantHistory && relevantHistory.changedAt) {
      return formatDate(relevantHistory.changedAt);
    }
  }
  
  return ticket.timeline?.created ? formatDate(ticket.timeline.created) : (ticket.created ? formatDate(ticket.created) : '-');
}

export function getStepAuthor(ticket: Ticket, stepName: string): string {
  if (stepName === "Create Ticket") {
    const initialHistory = ticket.statusHistory?.find(h => h.fromStatus === null);
    if (initialHistory?.authorName) {
      return initialHistory.authorName;
    }
    return (typeof ticket.reporter === 'string' ? ticket.reporter : ticket.reporter?.displayName) || 'Reporter';
  }
  
  const statusPatterns = stepToStatusMap[stepName];
  if (statusPatterns && ticket.statusHistory) {
    const relevantHistory = ticket.statusHistory.find(h => 
      statusPatterns.some(pattern => h.toStatus === pattern)
    );
    
    if (relevantHistory?.authorName) {
      return relevantHistory.authorName;
    }
  }
  
  return '-';
}

export function getSubProcessDate(ticket: Ticket, subStepName: string): string | null {
  if (subStepName === "Waiting") {
    if (ticket.statusHistory && ticket.statusHistory.some(h => h.toStatus === "Waiting")) {
      const waitingHistory = ticket.statusHistory.find(h => h.toStatus === "Waiting");
      return waitingHistory?.changedAt || null;
    }
  } else {
    const statusPatterns = subProcessStepToStatusMap[subStepName] || [];
    const relevantHistory = ticket.statusHistory?.find(h => 
      statusPatterns.some(pattern => 
        h.toStatus?.toLowerCase().trim() === pattern
      )
    );
    return relevantHistory?.changedAt || null;
  }
  return null;
}

export function getSubProcessAuthor(ticket: Ticket, subStepName: string): string {
  if (subStepName === "Waiting") {
    if (ticket.statusHistory && ticket.statusHistory.some(h => h.toStatus === "Waiting")) {
      const waitingHistory = ticket.statusHistory.find(h => h.toStatus === "Waiting");
      if (waitingHistory && waitingHistory.authorName) {
        return waitingHistory.authorName;
      }
    }
  } else {
    const statusPatterns = subProcessStepToStatusMap[subStepName] || [];
    const relevantHistory = ticket.statusHistory?.find(h => 
      statusPatterns.some(pattern => 
        h.toStatus?.toLowerCase().trim() === pattern
      )
    );
    
    if (relevantHistory && relevantHistory.authorName) {
      return relevantHistory.authorName;
    }
  }
  return '-';
}

export function hasSubProcessOccurred(ticket: Ticket, subStepName: string): boolean {
  const statusPatterns = subProcessStepToStatusMap[subStepName] || [];
  
  const hasExactStatusHistory = ticket.statusHistory?.some(h => {
    const toStatus = h.toStatus?.toLowerCase().trim() || '';
    return statusPatterns.some(pattern => 
      toStatus === pattern || toStatus.includes(pattern)
    );
  });
  
  const subProcessDate = getSubProcessDate(ticket, subStepName);
  
  if (subStepName === "Waiting") {
    const hasWaitingEvidence = hasExactStatusHistory || Boolean(ticket.isCurrentlyWaiting) || Boolean(ticket.totalWaitingHours && ticket.totalWaitingHours > 0);
    return hasWaitingEvidence && Boolean(subProcessDate || ticket.isCurrentlyWaiting || (ticket.totalWaitingHours && ticket.totalWaitingHours > 0));
  }
  
  return Boolean(hasExactStatusHistory && subProcessDate);
}

