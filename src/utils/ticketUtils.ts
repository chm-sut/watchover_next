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
  "Request for Update": ["Request for update", "Pending Update", "Update Requested"],
  "Waiting": ["Waiting"],
  "Resolve": ["Resolved", "Resolving"],
  "Complete": ["Closed", "Done", "Completed"]
};

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
    return hasStatusHistory || ticket.status?.name === "Waiting" || ticket.isCurrentlyWaiting;
  }

  return hasStatusHistory || isCurrentStatus;
}

export function getStepDetails(ticket: Ticket, stepIndex: number) {
  const stepName = stepNames[stepIndex];
  if (!stepName) return { date: '-', author: '-' };

  if (stepName === "Create Ticket") {
    const createDate = ticket.timeline?.created || ticket.created;
    const createAuthor = ticket.statusHistory?.find(h => h.fromStatus === null)?.authorName || 
                        (typeof ticket.reporter === 'string' ? ticket.reporter : ticket.reporter?.displayName) || '-';
    return {
      date: createDate ? new Date(createDate).toLocaleDateString('en-GB') + ' ' + new Date(createDate).toLocaleTimeString('en-GB', {hour12: true}) : '-',
      author: createAuthor
    };
  }

  if (stepName === "Waiting") {
    const waitingHistory = ticket.statusHistory?.find(h => h.toStatus === "Waiting");
    if (waitingHistory && waitingHistory.changedAt) {
      return {
        date: new Date(waitingHistory.changedAt).toLocaleDateString('en-GB') + ' ' + new Date(waitingHistory.changedAt).toLocaleTimeString('en-GB', {hour12: true}),
        author: waitingHistory.authorName || '-'
      };
    }
    return { date: '-', author: '-' };
  }

  const statusPatterns = stepToStatusMap[stepName] || [];
  const statusEntry = ticket.statusHistory?.find(h => 
    statusPatterns.some(pattern => 
      h.toStatus?.toLowerCase().includes(pattern.toLowerCase()) ||
      pattern.toLowerCase().includes(h.toStatus?.toLowerCase() || '')
    )
  );

  if (statusEntry && statusEntry.changedAt) {
    return {
      date: new Date(statusEntry.changedAt).toLocaleDateString('en-GB') + ' ' + new Date(statusEntry.changedAt).toLocaleTimeString('en-GB', {hour12: true}),
      author: statusEntry.authorName || '-'
    };
  }

  return { date: '-', author: '-' };
}

export function getInvestigateSubProcess(ticket: Ticket) {
  if (hasStepOccurred(ticket, 5) && (ticket.steps?.[5] || 0) > 0) {
    return { name: "Waiting", status: ticket.steps?.[5] || 0, stepIndex: 5 };
  }
  if (hasStepOccurred(ticket, 4) && (ticket.steps?.[4] || 0) > 0) {
    return { name: "Request Update", status: ticket.steps?.[4] || 0, stepIndex: 4 };
  }
  if (hasStepOccurred(ticket, 3) && (ticket.steps?.[3] || 0) > 0) {
    return { name: "Engineer Plan", status: ticket.steps?.[3] || 0, stepIndex: 3 };
  }
  if (hasStepOccurred(ticket, 2) && (ticket.steps?.[2] || 0) > 0) {
    return { name: "Investigate", status: ticket.steps?.[2] || 0, stepIndex: 2 };
  }
  return { name: "Investigate", status: 0, stepIndex: 2 };
}

export function getSubProcessStatusText(subProcess: { name: string; status: number }) {
  if (subProcess.status === 0) {
    return "Not Started";
  } else if (subProcess.status === 2) {
    return "Done";
  } else {
    switch (subProcess.name) {
      case "Investigate":
        return "Investigating";
      case "Engineer Plan":
        return "Engineer Planning";
      case "Request Update":
        return "Update Requesting";
      case "Waiting":
        return "Waiting";
      default:
        return "In Progress";
    }
  }
}

export function getStepStatusText(stepName: string, status: number) {
  if (status === 0) {
    return "Not Started";
  } else if (status === 2) {
    return "Done";
  } else {
    return "Processing";
  }
}

export function getLatestStep(ticket: Ticket) {
  const allCompleted = ticket.steps?.every((s: number) => s === 2);
  if (allCompleted) {
    return { stepName: "Complete", status: 2, stepIndex: 7 };
  }
  
  if (hasStepOccurred(ticket, 6) && (ticket.steps?.[6] || 0) > 0) {
    return { stepName: "Resolve", status: ticket.steps?.[6] || 0, stepIndex: 6 };
  }
  
  const subProcess = getInvestigateSubProcess(ticket);
  if (subProcess.status > 0) {
    return { stepName: subProcess.name, status: subProcess.status, stepIndex: subProcess.stepIndex };
  }
  
  if (hasStepOccurred(ticket, 1) && (ticket.steps?.[1] || 0) > 0) {
    return { stepName: "Acknowledge", status: ticket.steps?.[1] || 0, stepIndex: 1 };
  }
  
  return { stepName: "Create Ticket", status: ticket.steps?.[0] || 1, stepIndex: 0 };
}

export function getTicketProgressFilter(ticket: Ticket) {
  const latestStep = getLatestStep(ticket);
  const allCompleted = ticket.steps?.every((s: number) => s === 2);
  
  if (allCompleted) {
    return "complete";
  }
  
  if (hasStepOccurred(ticket, 6) && (ticket.steps?.[6] || 0) > 0) {
    return "resolve";
  }
  
  const subProcess = getInvestigateSubProcess(ticket);
  if (subProcess.status > 0) {
    return "investigate";
  }
  
  if (hasStepOccurred(ticket, 1) && (ticket.steps?.[1] || 0) > 0) {
    return "acknowledge";
  }
  
  return "create";
}

export function formatDate(dateString: string): string {
  const [year, month, day] = dateString.split("-");
  return `${day}-${month}-${year}`;
}