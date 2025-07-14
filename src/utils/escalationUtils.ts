import type { Ticket } from '@/types';
import { prisma } from '@/lib/prisma';

async function getWaitingTime(ticketId: string): Promise<number> {
  try {
    // Get stored waiting time from database
    const ticket = await prisma.jiraTicket.findUnique({
      where: { ticketId },
      select: { totalWaitingHours: true, waitingStartTime: true }
    });

    if (!ticket) return 0;

    let totalWaitingTime = ticket.totalWaitingHours;

    // If currently waiting, add time since waiting started
    if (ticket.waitingStartTime) {
      const currentWaitingDuration = (new Date().getTime() - ticket.waitingStartTime.getTime()) / (1000 * 60 * 60);
      totalWaitingTime += currentWaitingDuration;
    }

    return totalWaitingTime;
  } catch (error) {
    console.error('Error getting waiting time:', error);
    return 0;
  }
}

export async function getEscalationLevelServer(ticket: Ticket): Promise<string> {
  const ticketId = ticket.code || ticket.key;
  if (!ticketId) {
    return "Unknown";
  }
  
  // Determine time limit based on priority
  let timeLimit: number;
  const priority = ticket.priority?.name?.toUpperCase() || 'LOW';
  
  switch (priority) {
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
  let elapsedHours = (now.getTime() - start.getTime()) / (1000 * 60 * 60);
  
  // Calculate time spent in "Waiting" status and subtract from elapsed time
  const waitingTime = await getWaitingTime(ticketId);
  elapsedHours = Math.max(0, elapsedHours - waitingTime);
  
  // Calculate percentage of time elapsed
  const percentageElapsed = (elapsedHours / timeLimit) * 100;

  // Determine current time-based escalation level
  let currentEscalation = "None";
  if (percentageElapsed >= 75) {
    currentEscalation = "Lv.2";
  } else if (percentageElapsed >= 50) {
    currentEscalation = "Lv.1";
  }

  // Check if ticket is in any waiting-related status
  const isWaitingStatus = (status: string) => {
    const waitingStatuses = [
      'Waiting',
      'Waiting for Customer', 
      'Waiting for customer',
      'Waiting Customer',
      'Customer Waiting',
      'Pending Customer',
      'Pending',
      'On Hold'
    ];
    return waitingStatuses.some(waitingStatus => 
      status.toLowerCase().includes(waitingStatus.toLowerCase())
    );
  };

  // If ticket is currently in any waiting status, escalation is paused
  if (ticket.status?.name && isWaitingStatus(ticket.status.name)) {
    return "Paused";
  }

  try {
    // Get previously stored escalation level from database
    const existingRecord = await prisma.escalation.findFirst({
      where: { ticketId },
      orderBy: { level: 'desc' }
    });
    
    const previousEscalation = existingRecord?.level || "None";
    
    // Escalation can only go up, never down
    const escalationOrder = { 'None': 0, 'Lv.1': 1, 'Lv.2': 2 };
    const currentOrder = escalationOrder[currentEscalation as keyof typeof escalationOrder];
    const previousOrder = escalationOrder[previousEscalation as keyof typeof escalationOrder];
    
    // Use the highest escalation level ever reached
    const finalEscalation = currentOrder > previousOrder ? currentEscalation : previousEscalation;
    
    // Note: Escalation tracking is now handled by the escalation records in the webhook
    
    return finalEscalation;
  } catch (error) {
    console.error('Database error in escalation calculation:', error);
    // Fallback to time-based calculation if database fails
    return currentEscalation;
  }
}