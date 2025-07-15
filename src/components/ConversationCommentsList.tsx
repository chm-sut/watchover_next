import { formatDateTime, formatTimeAgo } from "../utils/conversationUtils";
import ConversationCommentContent from "./ConversationCommentContent";

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
  attachments?: Array<{
    id: string;
    filename: string;
    mimeType: string;
  }>;
}

interface ConversationCommentsListProps {
  comments: Comment[];
}

export default function ConversationCommentsList({ comments }: ConversationCommentsListProps) {
  if (comments.length === 0) {
    return (
      <div className="text-center text-gray-400 py-8">
        <p>No comments found for this ticket.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => (
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
            <ConversationCommentContent comment={comment} />
          </div>
          
          {comment.isInternal && (
            <div className="mt-2">
              <span className="inline-block px-2 py-1 bg-yellow-600 text-yellow-100 text-xs rounded">
                Internal Comment
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}