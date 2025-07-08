import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Get all escalations with ticket data
    const escalations = await prisma.escalation.findMany({
      include: {
        ticket: {
          include: {
            statusHistory: {
              orderBy: {
                changedAt: 'desc'
              }
            }
          }
        }
      }
    });

    // Get all tickets for comparison metrics
    const allTickets = await prisma.jiraTicket.findMany({
      include: {
        escalations: true,
        statusHistory: true
      }
    });

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // 1. ESCALATION VOLUME METRICS
    const totalEscalations = escalations.length;
    const escalationsSent = escalations.filter(e => e.isSent).length;
    const escalationsScheduled = escalations.filter(e => !e.isSent && e.scheduledTime <= now).length;
    
    const escalationsByLevel = {
      'Lv.1': escalations.filter(e => e.level === 'Lv.1' && e.isSent).length,
      'Lv.2': escalations.filter(e => e.level === 'Lv.2' && e.isSent).length
    };

    // 2. ESCALATION BY PRIORITY
    const escalationsByPriority = allTickets.reduce((acc, ticket) => {
      const sentEscalations = ticket.escalations.filter(e => e.isSent).length;
      if (sentEscalations > 0) {
        acc[ticket.priority] = (acc[ticket.priority] || 0) + sentEscalations;
      }
      return acc;
    }, {} as Record<string, number>);

    // 3. ESCALATION BY CUSTOMER (top 10)
    const escalationsByCustomer = allTickets.reduce((acc, ticket) => {
      const sentEscalations = ticket.escalations.filter(e => e.isSent).length;
      if (sentEscalations > 0) {
        acc[ticket.customer || 'Unknown'] = (acc[ticket.customer || 'Unknown'] || 0) + sentEscalations;
      }
      return acc;
    }, {} as Record<string, number>);

    const topCustomerEscalations = Object.entries(escalationsByCustomer)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);

    // 4. ESCALATION PREVENTION RATE
    const ticketsWithoutEscalation = allTickets.filter(t => t.escalations.every(e => !e.isSent)).length;
    const escalationPreventionRate = Math.round((ticketsWithoutEscalation / allTickets.length) * 100);

    // 5. TIMING METRICS
    const escalationsWithTiming = escalations.filter(e => e.isSent && e.sentTime);
    const avgTimeToEscalation = escalationsWithTiming.length > 0 
      ? escalationsWithTiming.reduce((sum, e) => {
          const timeToEscalation = (e.sentTime!.getTime() - e.ticket.createDate.getTime()) / (1000 * 60 * 60);
          return sum + timeToEscalation;
        }, 0) / escalationsWithTiming.length
      : 0;

    // 6. RESPONSE TIME AFTER ESCALATION
    const resolvedAfterEscalation = escalationsWithTiming.filter(e => {
      const isResolved = ['Resolved', 'Closed', 'Done', 'Completed'].includes(e.ticket.status);
      return isResolved && e.sentTime;
    });

    const avgResponseTimeAfterEscalation = resolvedAfterEscalation.length > 0
      ? resolvedAfterEscalation.reduce((sum, e) => {
          const resolvedTime = e.ticket.statusHistory.find(h => 
            ['Resolved', 'Closed', 'Done', 'Completed'].includes(h.toStatus)
          )?.changedAt;
          if (resolvedTime && e.sentTime) {
            const responseTime = (resolvedTime.getTime() - e.sentTime.getTime()) / (1000 * 60 * 60);
            return sum + responseTime;
          }
          return sum;
        }, 0) / resolvedAfterEscalation.length
      : 0;

    // 7. DAILY ESCALATION TRENDS (last 30 days)
    const dailyEscalations = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayEscalations = escalations.filter(e => 
        e.sentTime && 
        e.sentTime.toISOString().split('T')[0] === dateStr
      ).length;
      
      dailyEscalations.push({
        date: dateStr,
        escalations: dayEscalations
      });
    }

    // 8. ESCALATION BY ASSIGNEE (top 10)
    const escalationsByAssignee = allTickets.reduce((acc, ticket) => {
      const sentEscalations = ticket.escalations.filter(e => e.isSent).length;
      if (sentEscalations > 0 && ticket.assignee) {
        acc[ticket.assignee] = (acc[ticket.assignee] || 0) + sentEscalations;
      }
      return acc;
    }, {} as Record<string, number>);

    const topAssigneeEscalations = Object.entries(escalationsByAssignee)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);

    // 9. CURRENT PENDING ESCALATIONS
    const pendingEscalations = escalations.filter(e => 
      !e.isSent && 
      e.scheduledTime <= now &&
      !['Resolved', 'Closed', 'Done', 'Completed'].includes(e.ticket.status)
    ).map(e => ({
      ticketId: e.ticketId,
      level: e.level,
      scheduledTime: e.scheduledTime.toISOString(),
      priority: e.ticket.priority,
      customer: e.ticket.customer,
      assignee: e.ticket.assignee,
      overdueDuration: Math.round((now.getTime() - e.scheduledTime.getTime()) / (1000 * 60 * 60 * 24) * 10) / 10 // days
    }));

    return NextResponse.json({
      summary: {
        totalEscalations,
        escalationsSent,
        escalationsScheduled,
        escalationPreventionRate,
        avgTimeToEscalation: Math.round(avgTimeToEscalation * 10) / 10,
        avgResponseTimeAfterEscalation: Math.round(avgResponseTimeAfterEscalation * 10) / 10
      },
      breakdown: {
        byLevel: escalationsByLevel,
        byPriority: escalationsByPriority,
        byCustomer: topCustomerEscalations,
        byAssignee: topAssigneeEscalations
      },
      trends: {
        daily: dailyEscalations
      },
      pending: pendingEscalations
    });

  } catch (error) {
    console.error('Failed to fetch escalation analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch escalation analytics' },
      { status: 500 }
    );
  }
}