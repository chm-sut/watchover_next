"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, RefreshCw } from "lucide-react";
import PriorityBadge from "@/components/PriorityBadge";

interface Comment {
  id: string;
  ticketCode: string;
  body: string;
  renderedBody: string;
  author: {
    name: string;
    email: string;
    key: string;
  };
  created: string;
  updated: string;
  isInternal: boolean;
  visibility: unknown;
}

interface TicketInfo {
  code: string;
  name: string;
  priority: { name: string };
  customer: string;
  status: string;
  assignee?: { displayName: string; emailAddress: string };
  reporter?: { displayName: string; emailAddress: string };
}

function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB') + ' ' + date.toLocaleTimeString('en-GB', {hour12: true});
}

function formatTimeAgo(dateString: string): string {
  const now = new Date();
  const commentDate = new Date(dateString);
  const diffMs = now.getTime() - commentDate.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

export default function TicketConversationPage() {
  const params = useParams();
  const router = useRouter();
  const ticketCode = params.ticketCode as string;
  
  const [comments, setComments] = useState<Comment[]>([]);
  const [ticketInfo, setTicketInfo] = useState<TicketInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchTicketInfo = async () => {
    try {
      const response = await fetch(`/api/tickets/${ticketCode}`);
      if (response.ok) {
        const data = await response.json();
        setTicketInfo(data);
      }
    } catch (error) {
      console.error('Error fetching ticket info:', error);
    }
  };

  const fetchComments = async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    else setIsLoading(true);
    
    try {
      const response = await fetch(`/api/tickets/${ticketCode}/comments/database`);
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments || []);
      } else {
        console.error('Failed to fetch comments:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      if (isRefresh) setIsRefreshing(false);
      else setIsLoading(false);
    }
  };

  useEffect(() => {
    if (ticketCode) {
      fetchTicketInfo();
      fetchComments();
    }
  }, [ticketCode]);

  useEffect(() => {
    document.title = `Live Conversation - ${ticketCode}`;
  }, [ticketCode]);


  if (isLoading) {
    return (
      <div className="w-full h-full flex flex-col">
        {/* Header Skeleton */}
        <div className="bg-black bg-opacity-20 p-4 rounded-2xl mb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 rounded-md text-logoWhite hover:bg-logoBlue hover:text-logoWhite transition-colors font-body text-body">
                ← Back
              </button>
              <div className="bg-darkWhite bg-opacity-50 rounded h-6 w-20 animate-pulse"></div>
              <div className="bg-darkWhite bg-opacity-50 rounded-full h-6 w-16 animate-pulse"></div>
            </div>
            <div className="bg-darkWhite bg-opacity-50 rounded h-10 w-24 animate-pulse"></div>
          </div>
          <div className="space-y-2">
            <div className="bg-darkWhite bg-opacity-50 rounded h-6 w-3/4 animate-pulse"></div>
            <div className="flex gap-6">
              <div className="bg-darkWhite bg-opacity-30 rounded h-4 w-24 animate-pulse"></div>
              <div className="bg-darkWhite bg-opacity-30 rounded h-4 w-32 animate-pulse"></div>
              <div className="bg-darkWhite bg-opacity-30 rounded h-4 w-28 animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Comments Skeleton */}
        <div className="flex-1 overflow-auto rounded-2xl bg-black bg-opacity-10 p-4">
          <div className="space-y-4">
            {[1, 2, 3, 4].map((index) => (
              <div
                key={index}
                className="bg-white bg-opacity-5 backdrop-blur-sm rounded-2xl p-4 border border-gray-600"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-darkWhite bg-opacity-50 rounded-full animate-pulse"></div>
                    <div>
                      <div className="bg-darkWhite bg-opacity-50 rounded h-4 w-24 mb-1 animate-pulse"></div>
                      <div className="bg-darkWhite bg-opacity-30 rounded h-3 w-32 animate-pulse"></div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="bg-darkWhite bg-opacity-30 rounded h-3 w-16 mb-1 animate-pulse"></div>
                    <div className="bg-darkWhite bg-opacity-30 rounded h-3 w-20 animate-pulse"></div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="bg-darkWhite bg-opacity-40 rounded h-4 w-full animate-pulse"></div>
                  <div className="bg-darkWhite bg-opacity-40 rounded h-4 w-4/5 animate-pulse"></div>
                  <div className="bg-darkWhite bg-opacity-40 rounded h-4 w-3/5 animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
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
              onClick={() => fetchComments(true)}
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
              onClick={() => fetchComments(true)}
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

      {/* Comments */}
      <div className="flex-1 overflow-auto rounded-2xl bg-black bg-opacity-10 p-4">
        <div className="space-y-4">
          {comments.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <p>No comments found for this ticket.</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div
                key={comment.id}
                className="bg-white bg-opacity-5 backdrop-blur-sm rounded-2xl p-4 border border-gray-600"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-logoBlue rounded-full flex items-center justify-center text-white text-sm font-semibold">
                      {comment.author.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-logoWhite font-medium">{comment.author.name}</div>
                      <div className="text-gray-400 text-xs">{comment.author.email}</div>
                    </div>
                  </div>
                  <div className="text-right text-xs text-gray-400">
                    <div>{formatTimeAgo(comment.created)}</div>
                    <div>{formatDateTime(comment.created)}</div>
                  </div>
                </div>
                
                <div className="text-logoWhite">
                  <p className="whitespace-pre-wrap break-words">{comment.body}</p>
                </div>
                
                {comment.isInternal && (
                  <div className="mt-2">
                    <span className="inline-block px-2 py-1 bg-yellow-600 text-yellow-100 text-xs rounded">
                      Internal Comment
                    </span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}