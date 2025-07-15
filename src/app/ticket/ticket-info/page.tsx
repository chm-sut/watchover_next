"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import TicketTimelineLoader from "@/components/TicketTimelineLoader";
import TicketHeader from "@/components/TicketHeader";
import TicketDetails from "@/components/TicketDetails";
import TicketTimeline from "@/components/TicketTimeline";
import { useTicketData } from "@/hooks/useTicketData";

function TicketInformationContent() {
  const searchParams = useSearchParams();
  const ticketCode = searchParams.get('ticketCode');
  const { ticket, loading, hasConversation } = useTicketData(ticketCode);

  if (loading) {
    return <TicketTimelineLoader />;
  }

  if (!ticket) {
    return (
      <div className="flex items-center justify-center h-full text-white">
        <div className="text-xl">Ticket not found</div>
      </div>
    );
  }

  return (
    <div className="flex-1 relative">
      {/* Scrollable Content */}
      <div className="absolute rounded-2xl inset-0 bg-logoBlack bg-opacity-40 overflow-y-auto">
        {/* Floating Header */}
        <TicketHeader ticket={ticket} />
        
        {/* Ticket Information Card */}
        <div className="rounded-2xl p-4 sm:p-6 md:p-8 w-full">
          {/* Ticket Details */}
          <TicketDetails ticket={ticket} hasConversation={hasConversation} />
          
          {/* Status Timeline */}
          <TicketTimeline ticket={ticket} />
        </div>
      </div>
    </div>
  );
}

export default function TicketInformationPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TicketInformationContent />
    </Suspense>
  );
}