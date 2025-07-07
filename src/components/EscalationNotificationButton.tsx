"use client";
import { useState } from "react";
import { Send } from "lucide-react";
import { sendEscalationNotification } from "@/utils/lineNotifications";
import type { Ticket } from "@/types";

interface EscalationNotificationButtonProps {
  ticket: Ticket;
  escalationLevel: string;
  size?: "sm" | "md" | "lg";
}

export default function EscalationNotificationButton({ 
  ticket, 
  escalationLevel, 
  size = "md" 
}: EscalationNotificationButtonProps) {
  const [isSending, setIsSending] = useState(false);
  const [lastSent, setLastSent] = useState<Date | null>(null);

  const handleSendNotification = async () => {
    if (isSending) return;

    setIsSending(true);
    try {
      const success = await sendEscalationNotification({
        ticket,
        escalationLevel,
        message: `Manual notification for escalation level ${escalationLevel}`
      });

      if (success) {
        setLastSent(new Date());
        // You could add a toast notification here
        alert('✅ LINE notification sent successfully!');
      } else {
        alert('❌ Failed to send LINE notification. Check console for details.');
        console.error('Notification failed for ticket:', ticket);
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      alert(`❌ Error sending notification: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSending(false);
    }
  };

  // Only show button for escalated tickets
  if (escalationLevel === 'None') {
    return null;
  }

  const sizeClasses = {
    sm: "p-1 text-xs",
    md: "p-2 text-sm", 
    lg: "p-3 text-base"
  };

  const iconSizes = {
    sm: 12,
    md: 16,
    lg: 20
  };

  return (
    <button
      onClick={handleSendNotification}
      disabled={isSending}
      className={`${sizeClasses[size]} rounded-md bg-logoBlue hover:bg-blue-600 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1`}
      title={`Send LINE notification for ${escalationLevel} escalation`}
    >
      {isSending ? (
        <div className="animate-spin rounded-full border-2 border-white border-t-transparent" 
             style={{ width: iconSizes[size], height: iconSizes[size] }} />
      ) : (
        <Send size={iconSizes[size]} />
      )}
      {size !== 'sm' && (
        <span className="hidden sm:inline">
          {isSending ? 'Sending...' : 'Notify'}
        </span>
      )}
      {lastSent && size === 'lg' && (
        <span className="text-xs opacity-75 ml-2">
          Last sent: {lastSent.toLocaleTimeString()}
        </span>
      )}
    </button>
  );
}