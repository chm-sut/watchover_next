import type { Ticket } from '@/types';
import { prisma } from '@/lib/prisma';

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
  const elapsedHours = (now.getTime() - start.getTime()) / (1000 * 60 * 60);
  
  // Calculate percentage of time elapsed
  const percentageElapsed = (elapsedHours / timeLimit) * 100;

  // Determine current time-based escalation level
  let currentEscalation = "None";
  if (percentageElapsed >= 75) {
    currentEscalation = "Lv.2";
  } else if (percentageElapsed >= 50) {
    currentEscalation = "Lv.1";
  }

  try {
    // Get previously stored escalation level from database
    const existingRecord = await prisma.escalationHistory.findUnique({
      where: { ticketId }
    });
    
    const previousEscalation = existingRecord?.maxEscalationLevel || "None";
    
    // Escalation can only go up, never down
    const escalationOrder = { 'None': 0, 'Lv.1': 1, 'Lv.2': 2 };
    const currentOrder = escalationOrder[currentEscalation as keyof typeof escalationOrder];
    const previousOrder = escalationOrder[previousEscalation as keyof typeof escalationOrder];
    
    // Use the highest escalation level ever reached
    const finalEscalation = currentOrder > previousOrder ? currentEscalation : previousEscalation;
    
    // Update database if escalation level increased
    if (currentOrder > previousOrder) {
      await prisma.escalationHistory.upsert({
        where: { ticketId },
        update: {
          maxEscalationLevel: finalEscalation,
          lastUpdatedAt: new Date(),
          priority: ticket.priority?.name,
          customer: ticket.customer,
          ticketName: ticket.name || ticket.summary
        },
        create: {
          ticketId,
          maxEscalationLevel: finalEscalation,
          firstEscalatedAt: finalEscalation !== "None" ? new Date() : null,
          priority: ticket.priority?.name,
          customer: ticket.customer,
          ticketName: ticket.name || ticket.summary
        }
      });

      // Log escalation event
      await prisma.escalationEvent.create({
        data: {
          ticketId,
          fromLevel: previousEscalation,
          toLevel: finalEscalation,
          reason: `Time-based escalation: ${percentageElapsed.toFixed(1)}% of ${timeLimit}h limit reached`
        }
      });
    }
    
    return finalEscalation;
  } catch (error) {
    console.error('Database error in escalation calculation:', error);
    // Fallback to time-based calculation if database fails
    return currentEscalation;
  }
}