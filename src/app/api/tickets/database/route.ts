import { NextResponse } from 'next/server';
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


async function calculateEscalationLevel(escalations: Array<{level: string, scheduledTime: Date, isSent: boolean}>, status: string, ticketId: string, createDate: Date, priority: string): Promise<string> {
  const now = new Date();
  
  // Check if ticket is completed
  const completedStatuses = ['Resolved', 'Closed', 'Done', 'Completed'];
  if (completedStatuses.includes(status)) {
    return 'None';
  }
  
  // Calculate waiting time to adjust escalation schedule
  const waitingTime = await getWaitingTime(ticketId);
  
  // Get priority-based time limits
  const priorityLimits: { [key: string]: number } = {
    'CRITICAL': 2,
    'HIGH': 4,
    'MEDIUM': 8,
    'LOW': 24
  };
  
  const limitHours = priorityLimits[priority.toUpperCase()] || 24;
  
  // Calculate adjusted escalation times (add waiting time to extend deadlines)
  const adjustedEscalation1Time = new Date(createDate.getTime() + (limitHours * 0.5 * 60 * 60 * 1000) + (waitingTime * 60 * 60 * 1000));
  const adjustedEscalation2Time = new Date(createDate.getTime() + (limitHours * 0.75 * 60 * 60 * 1000) + (waitingTime * 60 * 60 * 1000));
  
  // Check escalation levels based on adjusted time
  if (now >= adjustedEscalation2Time) {
    return 'Lv.2';
  } else if (now >= adjustedEscalation1Time) {
    return 'Lv.1';
  }
  
  return 'None';
}

function getStepStatusFromHistory(statusHistory: Array<{fromStatus: string | null, toStatus: string, changedAt: Date}>, currentStatus: string): number[] {
  // Define status mapping to step progression
  const statusToStep = {
    // Step 0: Create (always done if ticket exists)
    'To Do': 0,
    'Open': 0,
    'New': 0,
    'Backlog': 0,
    
    // Step 1: Acknowledge
    'Acknowledged': 1,
    'In Progress': 1,
    'ASSIGN ENGINNER': 1,
    
    // Step 2: Investigate  
    'Investigating': 2,
    'In Review': 2,
    
    // Step 3: Waiting
    'Waiting': 3,
    
    // Step 4: Resolve
    'Resolving': 4,
    'Ready for Testing': 4,
    'Testing': 4,
    
    // Step 5: Complete
    'Resolved': 5,
    'Closed': 5,
    'Done': 5,
    'Completed': 5
  };
  
  const steps = [2, 0, 0, 0, 0, 0]; // Create is always done
  
  if (statusHistory.length === 0) {
    // No history, use current status only
    const stepIndex = statusToStep[currentStatus];
    if (stepIndex !== undefined) {
      for (let i = 1; i <= stepIndex && i < 6; i++) {
        steps[i] = i === stepIndex ? 1 : 2; // Current step = in progress, previous = done
      }
    }
    return steps;
  }
  
  // Use status history to determine progression
  let maxStepReached = 0;
  
  // Find the highest step ever reached
  statusHistory.forEach(change => {
    const stepIndex = statusToStep[change.toStatus];
    if (stepIndex !== undefined && stepIndex > maxStepReached) {
      maxStepReached = stepIndex;
    }
  });
  
  // Current status step
  const currentStepIndex = statusToStep[currentStatus] || 0;
  const finalStepIndex = Math.max(maxStepReached, currentStepIndex);
  
  // Fill steps array based on progression
  for (let i = 1; i <= finalStepIndex && i < 6; i++) {
    if (i < finalStepIndex) {
      steps[i] = 2; // Completed steps
    } else {
      steps[i] = 1; // Current step (in progress)
    }
  }
  
  // Special case: if ticket is completed, mark all as done
  if (['Resolved', 'Closed', 'Done', 'Completed'].includes(currentStatus)) {
    steps.fill(2);
  }
  
  return steps;
}

export async function GET() {
  try {
    // Fetch all tickets from the database with escalations and status history
    const tickets = await prisma.jiraTicket.findMany({
      include: {
        escalations: true,
        statusHistory: {
          orderBy: {
            changedAt: 'desc'
          }
        }
      },
      orderBy: {
        createDate: 'desc'
      }
    });

    // Transform the data to match the expected format
    const transformedTickets = await Promise.all(tickets.map(async ticket => ({
      code: ticket.ticketId,
      name: ticket.summary,
      priority: {
        name: ticket.priority.toUpperCase()
      },
      customer: ticket.customer || 'Unknown',
      startDate: ticket.createDate.toISOString().split('T')[0],
      status: ticket.status,
      escalationLevel: await calculateEscalationLevel(ticket.escalations, ticket.status, ticket.ticketId, ticket.createDate, ticket.priority),
      escalations: ticket.escalations,
      assignee: ticket.assignee,
      reporter: ticket.reporter,
      created: ticket.createDate.toISOString().split('T')[0],
      steps: getStepStatusFromHistory(ticket.statusHistory, ticket.status),
      statusHistory: ticket.statusHistory.map(history => ({
        fromStatus: history.fromStatus,
        toStatus: history.toStatus,
        changedAt: history.changedAt.toISOString()
      }))
    })));

    return NextResponse.json(transformedTickets);
  } catch (error: unknown) {
    console.error('Failed to fetch tickets from database:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch tickets from database',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}