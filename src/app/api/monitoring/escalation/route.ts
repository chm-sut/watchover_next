import { NextResponse } from 'next/server';
import { getEscalationLevelServer } from '@/utils/escalationUtils';

// Simple in-memory storage for escalation history (in production, use a database)
const escalationHistory = new Map<string, string>();

export async function POST() {
  try {
    // Fetch current tickets from database
    let ticketsResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/tickets/database`);
    if (!ticketsResponse.ok) {
      // Fallback to regular tickets endpoint if database fails
      ticketsResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/tickets`);
      if (!ticketsResponse.ok) {
        throw new Error('Failed to fetch tickets from both database and regular endpoints');
      }
    }

    const tickets = await ticketsResponse.json();
    const notifications = [];

    // Check each ticket for escalation changes
    for (const ticket of tickets) {
      const ticketId = ticket.code || ticket.key;
      // Use escalation level from database if available, otherwise calculate it
      const currentEscalation = ticket.escalationLevel || await getEscalationLevelServer(ticket);
      
      // Get previous escalation from our tracking map (for immediate comparison)
      const previousEscalation = escalationHistory.get(ticketId) || "None";

      // Skip notifications for paused tickets
      if (currentEscalation === 'Paused') {
        continue;
      }

      // Check if escalation level increased
      const escalationOrder = { 'None': 0, 'Lv.1': 1, 'Lv.2': 2, 'Paused': -1 };
      const currentOrder = escalationOrder[currentEscalation as keyof typeof escalationOrder] || 0;
      const previousOrder = escalationOrder[previousEscalation as keyof typeof escalationOrder] || 0;

      if (currentOrder > previousOrder) {
        // Send LINE notification
        try {
          const notificationResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/notifications/line`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ticketCode: ticketId,
              ticketName: ticket.name || ticket.summary || 'Unknown',
              escalationLevel: currentEscalation,
              priority: ticket.priority?.name || 'Unknown',
              customer: ticket.customer || 'Unknown',
              previousLevel: previousEscalation,
              message: currentEscalation === 'Lv.2' 
                ? '🚨 URGENT: Ticket requires immediate attention!' 
                : '⚠️ Ticket escalation requires attention.'
            })
          });

          if (notificationResponse.ok) {
            notifications.push({
              ticketId,
              escalationLevel: currentEscalation,
              previousLevel: previousEscalation,
              status: 'sent'
            });
          }
        } catch (error) {
          console.error(`Failed to send notification for ticket ${ticketId}:`, error);
          notifications.push({
            ticketId,
            escalationLevel: currentEscalation,
            previousLevel: previousEscalation,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      // Update escalation history
      escalationHistory.set(ticketId, currentEscalation);
    }

    return NextResponse.json({
      success: true,
      message: `Monitored ${tickets.length} tickets`,
      notifications,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Escalation monitoring error:', error);
    return NextResponse.json(
      { error: 'Monitoring failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Escalation monitoring endpoint',
    history: Array.from(escalationHistory.entries()).map(([ticketId, level]) => ({
      ticketId,
      escalationLevel: level
    }))
  });
}