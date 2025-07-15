"use client";
import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import PriorityBadge from "@/components/PriorityBadge";
import { TicketInfo } from "../types";

interface TicketHeaderProps {
  ticketInfo: TicketInfo | null;
  isRefreshing: boolean;
  onRefresh: () => void;
}

export default function TicketHeader({ ticketInfo, isRefreshing, onRefresh }: TicketHeaderProps) {
  const router = useRouter();

  return (
    <div className="bg-black bg-opacity-20 p-4 rounded-2xl mb-4">
      {/* Mobile: Stack everything vertically */}
      <div className="block md:hidden space-y-3">
        {/* Top row: Back button and Refresh button */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push('/live-conversation')}
            className="flex items-center gap-2 px-3 py-2 rounded-md text-logoWhite hover:bg-logoBlue hover:text-logoWhite transition-colors font-body text-sm"
          >
            ← Back
          </button>
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3 py-2 bg-logoBlue text-logoWhite rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 text-sm"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* Ticket info row */}
        {ticketInfo && (
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => window.open(`https://cloud-hm.atlassian.net/browse/${ticketInfo.code}`, '_blank')}
              className="text-logoWhite font-mono text-sm font-semibold px-3 py-1 bg-white bg-opacity-20 hover:bg-logoBlue hover:text-logoWhite rounded transition-colors cursor-pointer flex items-center gap-2"
              title="Open in JIRA"
            >
              {ticketInfo.code}
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.11 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/>
              </svg>
            </button>
            <PriorityBadge priority={ticketInfo.priority.name} />
          </div>
        )}

        {/* Title and details */}
        {ticketInfo && (
          <div className="space-y-2">
            <h2 className="text-base md:text-lg text-logoWhite line-clamp-2">{ticketInfo.name}</h2>
            <div className="space-y-1">
              <div className="text-sm text-gray-300">
                Status: <span className="text-logoWhite">{ticketInfo.status}</span>
              </div>
              <div className="text-sm text-gray-300">
                Customer: <span className="text-logoWhite">{ticketInfo.customer}</span>
              </div>
              {ticketInfo.assignee && (
                <div className="text-sm text-gray-300">
                  Assigned to: <span className="text-logoWhite">{ticketInfo.assignee.displayName}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Desktop: Original horizontal layout */}
      <div className="hidden md:block">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/live-conversation')}
              className="flex items-center gap-2 px-4 py-2 rounded-md text-logoWhite hover:bg-logoBlue hover:text-logoWhite transition-colors font-body text-body"
            >
              ← Back
            </button>
            
            {ticketInfo && (
              <>
                <button
                  onClick={() => window.open(`https://cloud-hm.atlassian.net/browse/${ticketInfo.code}`, '_blank')}
                  className="text-logoWhite font-mono text-base font-semibold px-3 py-1 bg-white bg-opacity-20 hover:bg-logoBlue hover:text-logoWhite rounded transition-colors cursor-pointer flex items-center gap-2"
                  title="Open in JIRA"
                >
                  {ticketInfo.code}
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.11 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/>
                  </svg>
                </button>
                <PriorityBadge priority={ticketInfo.priority.name} />
              </>
            )}
          </div>
          
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-logoBlue text-logoWhite rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {ticketInfo && (
          <div className="space-y-2">
            <h2 className="text-lg text-logoWhite">{ticketInfo.name}</h2>
            <div className="flex gap-6 text-sm text-gray-300">
              <span>Status: <span className="text-logoWhite">{ticketInfo.status}</span></span>
              <span>Customer: <span className="text-logoWhite">{ticketInfo.customer}</span></span>
              {ticketInfo.assignee && (
                <span>Assigned to: <span className="text-logoWhite">{ticketInfo.assignee.displayName}</span></span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}