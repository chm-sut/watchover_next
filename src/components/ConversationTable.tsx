"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import TablePagination from "@mui/material/TablePagination";
import PriorityBadge from "./PriorityBadge";

// Real comment data structure
interface Comment {
  id: string;
  ticketCode: string;
  ticketSummary: string;
  ticketPriority: string;
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

// Filters for conversations
interface ConversationFilters {
  code: string;
  name: string;
  status: string;
  customer: string;
  startDay: string;
  startMonth: string;
  startYear: string;
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

export default function ConversationTable({ filters }: { filters: ConversationFilters }) {
  const router = useRouter();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);


  const filteredComments = comments.filter((comment) => {
    const matchCode = !filters.code || comment.ticketCode.includes(filters.code);
    const matchName = !filters.name || comment.ticketSummary.toLowerCase().includes(filters.name.toLowerCase());
    
    const commentDate = new Date(comment.created);
    const year = commentDate.getFullYear().toString();
    const month = (commentDate.getMonth() + 1).toString().padStart(2, '0');
    const day = commentDate.getDate().toString().padStart(2, '0');
    
    const matchDay = !filters.startDay || filters.startDay === day;
    const matchMonth = !filters.startMonth || filters.startMonth === month;
    const matchYear = !filters.startYear || filters.startYear === year;

    return (
      matchCode &&
      matchName &&
      matchDay &&
      matchMonth &&
      matchYear
    );
  });

  const paginatedComments = filteredComments.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const logoWhite = "#F5F7FA";

  // Fetch comment data from database (fast!)
  useEffect(() => {
    async function fetchComments() {
      setIsLoading(true);
      try {
        const response = await fetch('/api/comments/database?limit=100');
        if (response.ok) {
          const data = await response.json();
          setComments(data.comments || []);
        } else {
          console.error('Failed to fetch comments:', response.statusText);
        }
      } catch (error) {
        console.error('Error fetching comments:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchComments();
  }, []);

  if (isLoading) {
    return (
      <div className="w-full overflow-x-auto h-full rounded-md bg-black bg-opacity-10">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <h2 className="text-h6 text-logoWhite mb-2 font-heading">Loading Conversations...</h2>
            <p className="text-darkWhite text-sm font-body">
              Fetching the latest comments from JIRA
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col rounded-md bg-black bg-opacity-10">
      {/* Mobile/Tablet Card View - visible on mobile and tablet screens */}
      <div className="block lg:hidden flex-1 overflow-auto p-4 space-y-3">
        {paginatedComments.map((comment) => (
          <div
            key={comment.id}
            className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-4 cursor-pointer hover:bg-opacity-20 transition-all"
            onClick={() => router.push(`/live-conversation/${comment.ticketCode}`)}
          >
            {/* Header with Ticket Code and Priority */}
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-white font-semibold text-lg font-mono">{comment.ticketCode}</h3>
                <p className="text-gray-300 text-sm line-clamp-2">{comment.ticketSummary}</p>
              </div>
              <PriorityBadge priority={comment.ticketPriority} />
            </div>

            {/* Author Info */}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-logoBlue rounded-full flex items-center justify-center text-white text-sm font-semibold">
                {comment.author.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-white font-medium">{comment.author.name}</p>
                <p className="text-gray-400 text-xs">{comment.author.email}</p>
              </div>
            </div>

            {/* Comment Preview */}
            <div className="mb-3">
              <p className="text-gray-300 text-sm line-clamp-3">
                {comment.body}
              </p>
            </div>

            {/* Time Info */}
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">{formatTimeAgo(comment.created)}</span>
              <span className="text-gray-400 text-xs">
                {formatDateTime(comment.created)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table View - visible on large screens */}
      <div className="hidden lg:block flex-1 overflow-auto">
        <div className="min-w-[1200px]">
          <table className="w-full text-left text-sm text-white table-auto">
            <thead className="sticky top-0 z-10 bg-logoBlack bg-opacity-10 backdrop-blur-md border-b border-gray-600">
              <tr>
                <th className="px-4 py-2 whitespace-nowrap">Ticket</th>
                <th className="px-4 py-2">Summary</th>
                <th className="px-4 py-2 text-center">Priority</th>
                <th className="px-4 py-2">Author</th>
                <th className="px-4 py-2">Comment</th>
                <th className="px-4 py-2 whitespace-nowrap">Time</th>
                <th className="px-4 py-2 text-center">Span</th>
              </tr>
            </thead>
            <tbody>
              {paginatedComments.map((comment) => (
                <tr 
                  key={comment.id} 
                  className="border-b border-gray-700 hover:bg-white hover:bg-opacity-10 cursor-pointer transition-colors h-12"
                  onClick={() => router.push(`/live-conversation/${comment.ticketCode}`)}
                >
                  <td className="px-4 py-2 whitespace-nowrap font-mono text-white">
                    {comment.ticketCode}
                  </td>
                  <td className="px-4 py-2 max-w-xs truncate" title={comment.ticketSummary}>
                    {comment.ticketSummary}
                  </td>
                  <td className="px-4 py-2 text-center">
                    <PriorityBadge priority={comment.ticketPriority} />
                  </td>
                  <td className="px-4 py-2">{comment.author.name}</td>
                  <td className="px-4 py-2 max-w-md truncate" title={comment.body}>
                    {comment.body.length > 100 ? `${comment.body.substring(0, 100)}...` : comment.body}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-400">
                    {formatDateTime(comment.created)}
                  </td>
                  <td className="px-4 py-2 text-center text-xs text-gray-400">
                    {formatTimeAgo(comment.created)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-end border-t border-gray-600 flex-shrink-0">
        <TablePagination
          component="div"
          count={filteredComments.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 20, 25]}
          sx={{
            ".MuiTablePagination-toolbar": {
              color: logoWhite,
            },
            ".MuiTablePagination-selectLabel": {
              color: logoWhite,
            },
            ".MuiTablePagination-input": {
              color: logoWhite,
            },
            ".MuiTablePagination-actions svg": {
              color: logoWhite,
            },
            ".MuiSelect-icon": {
              color: logoWhite,
            },
          }}
        />
      </div>
    </div>
  );
}