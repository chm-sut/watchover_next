export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB') + ' ' + date.toLocaleTimeString('en-GB', {hour12: true});
}

export function formatTimeAgo(dateString: string): string {
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

export function getFileIcon(mimeType: string): string {
  if (mimeType.includes('pdf')) return '📄';
  if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
  if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📽️';
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('archive')) return '🗜️';
  if (mimeType.includes('text')) return '📃';
  if (mimeType.includes('video')) return '🎥';
  if (mimeType.includes('audio')) return '🎵';
  return '📎';
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function processCommentContent(content: string): string {
  return content
    .replace(/href="\/rest\/api\/3\/attachment\/content\/(\d+)"/g, 'href="/api/jira/attachment/$1"')
    .replace(/src="\/rest\/api\/3\/attachment\/content\/(\d+)"/g, 'src="/api/jira/attachment/$1"')
    .replace(/href="https?:\/\/[^"]*\/rest\/api\/3\/attachment\/content\/(\d+)"/g, 'href="/api/jira/attachment/$1"')
    .replace(/src="https?:\/\/[^"]*\/rest\/api\/3\/attachment\/content\/(\d+)"/g, 'src="/api/jira/attachment/$1"')
    .replace(/src="\/secure\/attachment\/(\d+)\/[^"]+"/g, 'src="/api/jira/attachment/$1"');
}

export function extractUniqueAttachments(comments: any[]): any[] {
  const allAttachments = comments?.flatMap((comment: any) => comment.attachments || []) || [];
  return allAttachments.filter((att: any, index: number, self: any[]) => 
    self.findIndex(a => a.id === att.id) === index
  );
}