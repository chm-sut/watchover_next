import { useState, useEffect } from "react";
import type { Ticket } from "../types";

export function useTicketData(ticketCode: string | null) {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasConversation, setHasConversation] = useState(false);

  useEffect(() => {
    if (!ticketCode) {
      setLoading(false);
      return;
    }

    const fetchTicketData = async () => {
      try {
        // First try to get ticket from database API
        const res = await fetch("/api/tickets/database");
        if (!res.ok) throw new Error("Database API response was not ok");
        
        const data = await res.json();
        const foundTicket = data.find((t: Record<string, unknown>) => t.code === ticketCode);
        
        if (foundTicket) {
          setTicket(foundTicket);
          setLoading(false);
          return;
        }
        
        throw new Error("Ticket not found in database");
      } catch (err) {
        console.error("Error fetching from database API:", err);
        
        try {
          // Fallback to full endpoint
          const res = await fetch(`/api/tickets/${ticketCode}/full`);
          if (!res.ok) throw new Error("Network response was not ok");
          
          const data = await res.json();
          setTicket(data);
          setLoading(false);
          return;
        } catch (fullErr) {
          console.error("Error fetching ticket data:", fullErr);
          
          try {
            // Final fallback to basic endpoint
            const res = await fetch(`/api/tickets/${ticketCode}`);
            if (!res.ok) throw new Error("Fallback network response was not ok");
            
            const data = await res.json();
            console.log("Using fallback endpoint data:", data);
            setTicket(data);
            setLoading(false);
          } catch (fallbackErr) {
            console.error("Error fetching fallback ticket data:", fallbackErr);
            setLoading(false);
          }
        }
      }
    };

    const checkConversation = async () => {
      try {
        const res = await fetch(`/api/comments/database?ticketCode=${ticketCode}&limit=1`);
        if (res.ok) {
          const data = await res.json();
          setHasConversation(data.comments && data.comments.length > 0);
        } else {
          throw new Error("Failed to check conversations");
        }
      } catch (err) {
        console.error("Error checking conversations:", err);
        setHasConversation(false);
      }
    };

    fetchTicketData();
    checkConversation();
  }, [ticketCode]);

  return { ticket, loading, hasConversation };
}