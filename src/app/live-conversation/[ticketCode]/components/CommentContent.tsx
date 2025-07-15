"use client";
import { useState } from "react";
import { Comment } from "../types";

interface CommentContentProps {
  comment: Comment;
}

export default function CommentContent({ comment }: CommentContentProps) {
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  
  const handleImageClick = (imageSrc: string) => setExpandedImage(imageSrc);
  const closeImageModal = () => setExpandedImage(null);

  const processCommentContent = (content: string) => {
    return content
      .replace(/href="\/rest\/api\/3\/attachment\/content\/(\d+)"/g, 'href="/api/jira/attachment/$1"')
      .replace(/src="\/rest\/api\/3\/attachment\/content\/(\d+)"/g, 'src="/api/jira/attachment/$1"')
      .replace(/href="https?:\/\/[^"]*\/rest\/api\/3\/attachment\/content\/(\d+)"/g, 'href="/api/jira/attachment/$1"')
      .replace(/src="https?:\/\/[^"]*\/rest\/api\/3\/attachment\/content\/(\d+)"/g, 'src="/api/jira/attachment/$1"')
      .replace(/src="\/secure\/attachment\/(\d+)\/[^"]+"/g, 'src="/api/jira/attachment/$1"');
  };

  const hasRenderedContent = comment.renderedBody && comment.renderedBody !== comment.body;
  const hasHtmlContent = hasRenderedContent || (comment.body && comment.body.includes('<'));
  
  if (!comment.body && !comment.renderedBody && !comment.attachments) {
    return <div className="text-gray-400 italic">No content available for this comment</div>;
  }

  if (hasHtmlContent) {
    const contentToProcess = hasRenderedContent ? comment.renderedBody : comment.body;
    const processedHtml = processCommentContent(contentToProcess);
    
    return (
      <>
        <div 
          className="text-logoWhite prose prose-invert max-w-none comment-content"
          dangerouslySetInnerHTML={{ __html: processedHtml }}
          onClick={(e) => {
            const target = e.target as HTMLElement;
            if (target.tagName === 'IMG') {
              handleImageClick((target as HTMLImageElement).src);
            }
          }}
        />
        
        {expandedImage && (
          <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4" onClick={closeImageModal}>
            <div className="relative max-w-full max-h-full">
              <img src={expandedImage} alt="Expanded" className="max-w-full max-h-full object-contain" onClick={(e) => e.stopPropagation()} />
              <button onClick={closeImageModal} className="absolute top-2 right-2 bg-black bg-opacity-50 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-opacity-70">×</button>
            </div>
          </div>
        )}
        
        <style jsx>{`
          .comment-content img { max-width: 100%; height: auto; border-radius: 8px; margin: 8px 0; cursor: pointer; transition: opacity 0.2s; background: #f0f0f0; padding: 4px; }
          .comment-content img:hover { opacity: 0.8; }
          .comment-content a { color: rgb(59, 130, 246); text-decoration: underline; }
          .comment-content a:hover { color: rgb(96, 165, 250); }
          .comment-content p { margin: 8px 0; }
        `}</style>
      </>
    );
  } else {
    return (
      <>
        <p className="whitespace-pre-wrap break-words text-logoWhite">
          {comment.body || 'No text content'}
        </p>
        
        {comment.attachments && comment.attachments.length > 0 && (
          <div className="mt-2">
            <p className="text-gray-400 text-sm">Attachments:</p>
            {comment.attachments.map((attachment, index: number) => (
              <div key={index} className="mt-1">
                {attachment.mimeType?.startsWith('image/') ? (
                  <img 
                    src={`/api/jira/attachment/${attachment.id}`}
                    alt={attachment.filename || 'Attachment'}
                    className="max-w-full h-auto border border-gray-600 rounded cursor-pointer"
                    onClick={() => handleImageClick(`/api/jira/attachment/${attachment.id}`)}
                    onError={(e) => e.currentTarget.style.display = 'none'}
                  />
                ) : (
                  <a 
                    href={`/api/jira/attachment/${attachment.id}`}
                    className="text-blue-400 hover:text-blue-300 underline"
                    download={attachment.filename}
                  >
                    📎 {attachment.filename || `Attachment ${index + 1}`}
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
        
        {expandedImage && (
          <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4" onClick={closeImageModal}>
            <div className="relative max-w-full max-h-full">
              <img src={expandedImage} alt="Expanded" className="max-w-full max-h-full object-contain" onClick={(e) => e.stopPropagation()} />
              <button onClick={closeImageModal} className="absolute top-2 right-2 bg-black bg-opacity-50 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-opacity-70">×</button>
            </div>
          </div>
        )}
      </>
    );
  }
}