import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Get customer name from JIRA ticket customer field
async function getCustomerName(): Promise<string> {
  // For now, we don't have customer info stored in JiraTicket table
  // This would require adding customer field to JiraTicket or joining with another table
  // For the migration period, return 'Unknown' and let the webhook handle customer lookup
  return 'Unknown';
}

function calculateEscalationLevel(escalation1Time: Date, escalation2Time: Date, status: string): string {
  const now = new Date();
  
  // Check if ticket is completed
  const completedStatuses = ['Resolved', 'Closed', 'Done', 'Completed'];
  if (completedStatuses.includes(status)) {
    return 'None';
  }
  
  // Check escalation levels based on time
  if (now >= escalation2Time) {
    return 'Lv.2';
  } else if (now >= escalation1Time) {
    return 'Lv.1';
  } else {
    return 'None';
  }
}

export async function GET() {
  try {
    // Fetch all tickets from the database
    const tickets = await prisma.jiraTicket.findMany({
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
      customer: await getCustomerName(), // Get customer from database
      startDate: ticket.createDate.toISOString().split('T')[0],
      status: ticket.status,
      escalationLevel: calculateEscalationLevel(
        ticket.escalation1Time, 
        ticket.escalation2Time, 
        ticket.status
      ),
      escalation1Time: ticket.escalation1Time,
      escalation2Time: ticket.escalation2Time,
      escalation1Sent: ticket.escalation1Sent,
      escalation2Sent: ticket.escalation2Sent,
      assignee: ticket.assignee,
      reporter: ticket.reporter,
      created: ticket.createDate.toISOString().split('T')[0],
      steps: [0, 0, 0, 0, 0] // Default steps - can be enhanced based on status
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