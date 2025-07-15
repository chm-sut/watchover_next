import { getFileIcon, formatFileSize } from "../utils/conversationUtils";

interface Attachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  created: string;
}

interface AttachmentsSectionProps {
  attachments: Attachment[];
}

export default function AttachmentsSection({ attachments }: AttachmentsSectionProps) {
  if (!attachments || attachments.length === 0) {
    return null;
  }

  return (
    <div className="bg-black bg-opacity-20 p-4 rounded-2xl mb-4 flex-shrink-0">
      <h3 className="text-logoWhite font-semibold mb-3">
        📎 Attachments ({attachments.length})
      </h3>
      <div className="max-h-40 overflow-y-auto">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
          {attachments.map((att) => (
            <div 
              key={att.id} 
              className="bg-white bg-opacity-10 rounded-lg p-2 hover:bg-opacity-20 transition-colors cursor-pointer"
              onClick={() => window.open(`/api/jira/attachment/${att.id}`, '_blank')}
            >
              {att.mimeType.startsWith('image/') ? (
                <img 
                  src={`/api/jira/attachment/${att.id}`} 
                  alt={att.filename}
                  className="w-full h-16 object-cover rounded mb-1"
                  onError={(e) => {
                    e.currentTarget.classList.add('hidden');
                    const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                    if (fallback) fallback.classList.remove('hidden');
                  }}
                />
              ) : (
                <div className="w-full h-16 bg-gray-700 rounded mb-1 flex items-center justify-center">
                  <span className="text-xl">{getFileIcon(att.mimeType)}</span>
                </div>
              )}
              <div className="w-full h-16 bg-gray-700 rounded mb-1 hidden flex-col items-center justify-center text-center">
                <span className="text-xl">{getFileIcon(att.mimeType)}</span>
              </div>
              <p className="text-logoWhite text-xs truncate" title={att.filename}>
                {att.filename}
              </p>
              <p className="text-gray-400 text-xs">
                {formatFileSize(att.size)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}