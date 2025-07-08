export interface Ticket {
  id?: string;
  key?: string;
  summary?: string;
  status?: {
    name: string;
    statusCategory: {
      key: string;
    };
  };
  priority?: {
    name: string;
  };
  assignee?: {
    displayName: string;
    emailAddress: string;
  };
  reporter?: {
    displayName: string;
    emailAddress: string;
  };
  created?: string;
  updated?: string;
  description?: string;
  project?: {
    key: string;
    name: string;
  };
  // Additional fields for compatibility
  code?: string;
  name?: string;
  customer?: string;
  startDate?: string;
  currentStatus?: string;
  steps?: Array<number>;
  escalationLevel?: string;
  statusHistory?: Array<{
    id?: string;
    created?: string;
    author?: {
      displayName: string;
      emailAddress: string;
    };
    fromStatus: string | null;
    toStatus: string;
    timestamp?: number;
    changedAt?: string;
    authorName?: string | null;
    authorEmail?: string | null;
  }>;
  timeline?: {
    created?: string;
    updated?: string;
    resolved?: string;
  };
  // Waiting time tracking
  totalWaitingHours?: number;
  isCurrentlyWaiting?: boolean;
  waitingStartTime?: string | null;
}

export interface Filters {
  status?: string;
  priority?: string;
  assignee?: string;
  code?: string;
  name?: string;
  customer?: string;
  escalationLevel?: string;
  startDay?: string;
  startMonth?: string;
  startYear?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}