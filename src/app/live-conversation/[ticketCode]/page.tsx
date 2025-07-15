"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Comment, TicketInfo, Attachment } from "./types";
import TicketHeader from "./components/TicketHeader";
import AttachmentsSection from "./components/AttachmentsSection";
import CommentsList from "./components/CommentsList";
import LoadingSkeleton from "./components/LoadingSkeleton";

export default function TicketConversationPage() {
  const params = useParams();
  const ticketCode = params.ticketCode as string;
  
  const [comments, setComments] = useState<Comment[]>([]);
  const [ticketInfo, setTicketInfo] = useState<TicketInfo | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
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
        
        // Extract unique attachments from all comments
        const allAttachments = data.comments?.flatMap((comment: Comment) => comment.attachments || []) || [];
        const uniqueAttachments = allAttachments.filter((att: any, index: number, self: any[]) => 
          self.findIndex(a => a.id === att.id) === index
        );
        setAttachments(uniqueAttachments);
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
    return <LoadingSkeleton />;
  }

  return (
    <div className="w-full h-full flex flex-col">
      <TicketHeader 
        ticketInfo={ticketInfo} 
        isRefreshing={isRefreshing} 
        onRefresh={() => fetchComments(true)} 
      />
      
      <AttachmentsSection attachments={attachments} />
      
      <CommentsList comments={comments} />
    </div>
  );
}