export interface Comment {
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

export interface TicketInfo {
  code: string;
  name: string;
  priority: { name: string };
  customer: string;
  status: string;
  assignee?: { displayName: string; emailAddress: string };
  reporter?: { displayName: string; emailAddress: string };
}

export interface Attachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  created: string;
}