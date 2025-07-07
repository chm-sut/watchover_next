import type { Ticket } from '@/types';

interface NotificationData {
  ticket: Ticket;
  escalationLevel: string;
  previousLevel?: string;
  message?: string;
}

export const sendEscalationNotification = async ({
  ticket,
  escalationLevel,
  previousLevel,
  message
}: NotificationData): Promise<boolean> => {
  try {
    const response = await fetch('/api/notifications/line', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ticketCode: ticket.code || ticket.key,
        ticketName: ticket.name || ticket.summary,
        escalationLevel,
        priority: ticket.priority?.name || 'Unknown',
        customer: ticket.customer || 'Unknown',
        previousLevel,
        message
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to send LINE notification. Status:', response.status);
      console.error('Error response:', errorText);
      try {
        const errorData = JSON.parse(errorText);
        console.error('Parsed error:', errorData);
      } catch {
        console.error('Could not parse error as JSON');
      }
      return false;
    }

    const result = await response.json();
    console.log('LINE notification sent successfully:', result);
    return true;

  } catch (error) {
    console.error('Error sending LINE notification:', error);
    return false;
  }
};

// Utility function to check if escalation level changed and send notification
export const checkAndNotifyEscalationChange = async (
  ticket: Ticket,
  currentLevel: string,
  previousLevel?: string
): Promise<void> => {
  // Only send notification if escalation level increased
  const escalationOrder = { 'None': 0, 'Lv.1': 1, 'Lv.2': 2 };
  const currentOrder = escalationOrder[currentLevel as keyof typeof escalationOrder] || 0;
  const previousOrder = escalationOrder[previousLevel as keyof typeof escalationOrder] || 0;

  if (currentOrder > previousOrder) {
    let message = '';
    
    switch (currentLevel) {
      case 'Lv.1':
        message = '⚠️ Ticket has exceeded 50% of time limit. Attention required.';
        break;
      case 'Lv.2':
        message = '🚨 URGENT: Ticket has exceeded 75% of time limit. Immediate action required!';
        break;
    }

    await sendEscalationNotification({
      ticket,
      escalationLevel: currentLevel,
      previousLevel,
      message
    });
  }
};