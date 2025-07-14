/**
 * Utility functions for handling ticket status checks
 */

/**
 * Check if a status name indicates the ticket is in a waiting state
 * @param status - The status name to check
 * @returns true if the status indicates waiting, false otherwise
 */
export function isWaitingStatus(status: string | null | undefined): boolean {
  if (!status) return false;
  
  const waitingStatuses = [
    'Waiting',
    'Waiting for Customer', 
    'Waiting for customer',
    'Waiting Customer',
    'Customer Waiting',
    'Pending Customer',
    'Pending',
    'On Hold'
  ];
  
  return waitingStatuses.some(waitingStatus => 
    status.toLowerCase().includes(waitingStatus.toLowerCase())
  );
}

/**
 * Check if a status name indicates the ticket is completed
 * @param status - The status name to check
 * @returns true if the status indicates completion, false otherwise
 */
export function isCompletedStatus(status: string | null | undefined): boolean {
  if (!status) return false;
  
  const completedStatuses = [
    'Resolved', 
    'Closed', 
    'Done', 
    'Completed',
    'Complete'
  ];
  
  return completedStatuses.some(completedStatus => 
    status.toLowerCase().includes(completedStatus.toLowerCase())
  );
}