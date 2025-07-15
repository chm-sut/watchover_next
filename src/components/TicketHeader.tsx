import { useRouter } from "next/navigation";
import type { Ticket } from "../types";

interface TicketHeaderProps {
  ticket: Ticket;
}

export default function TicketHeader({ ticket }: TicketHeaderProps) {
  const router = useRouter();

  const openInJira = () => {
    window.open(`https://cloud-hm.atlassian.net/browse/${ticket.code}`, '_blank');
  };

  return (
    <div className="sticky rounded-t-2xl top-0 z-20 bg-logoBlack bg-opacity-10 backdrop-blur-md px-4 sm:px-6 md:px-8 py-2 sm:py-3 md:py-4 relative overflow-hidden border-b border-white border-opacity-20">
      {/* Mobile: Stack everything vertically */}
      <div className="block md:hidden space-y-3">
        {/* Back button */}
        <div className="flex items-center">
          <button
            onClick={() => router.push('/ticket')}
            className="flex items-center gap-2 px-3 py-2 rounded-md text-logoWhite hover:bg-logoBlue hover:text-logoWhite transition-colors font-body text-sm"
          >
            ← Back
          </button>
        </div>

        {/* Ticket code */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={openInJira}
            className="text-logoWhite font-mono text-sm font-semibold px-3 py-1 bg-white bg-opacity-20 hover:bg-logoBlue hover:text-logoWhite rounded transition-colors cursor-pointer flex items-center gap-2"
            title="Open in JIRA"
          >
            {ticket.code}
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.11 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/>
            </svg>
          </button>
        </div>

        {/* Title */}
        <div>
          <h2 className="text-logoWhite font-heading text-base font-medium line-clamp-2">
            {ticket.name}
          </h2>
        </div>
      </div>

      {/* Desktop: Original horizontal layout */}
      <div className="hidden md:block">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <button
            onClick={() => router.push('/ticket')}
            className="flex items-center gap-2 px-4 py-2 rounded-md text-logoWhite hover:bg-logoBlue hover:text-logoWhite transition-colors font-body text-body"
          >
            ← Back
          </button>
          <div className="flex items-center gap-3 flex-1">
            <button
              onClick={openInJira}
              className="text-logoWhite font-mono text-base font-semibold px-3 py-1 bg-white bg-opacity-20 hover:bg-logoBlue hover:text-logoWhite rounded transition-colors cursor-pointer flex items-center gap-2"
              title="Open in JIRA"
            >
              {ticket.code}
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.11 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/>
              </svg>
            </button>
            <span className="text-logoWhite font-heading text-h6 sm:text-h5 font-medium">
              {ticket.name}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}