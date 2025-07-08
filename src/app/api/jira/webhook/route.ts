import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Helper function to extract text from Atlassian Document Format (ADF)
function extractTextFromADF(content: unknown[]): string {
  const extractText = (node: unknown): string => {
    if (typeof node === 'string') return node;
    if (!node) return '';
    
    const nodeObj = node as Record<string, unknown>;
    
    if (nodeObj.type === 'text') {
      return (nodeObj.text as string) || '';
    }
    
    if (nodeObj.content && Array.isArray(nodeObj.content)) {
      return nodeObj.content.map(extractText).join(' ');
    }
    
    return '';
  };
  
  return content.map(extractText).join(' ').trim();
}

// Get customer from database
async function getCustomerFromDatabase(objectId: string): Promise<string> {
  try {
    // Get customer from database
    const customer = await prisma.customer.findUnique({
      where: { objectId }
    });
    
    if (customer) {
      return customer.name;
    }
    
    // If not found, return ID format
    console.warn(`Customer ${objectId} not found in database`);
    return `ID:${objectId}`;
    
  } catch (error) {
    console.error(`❌ Failed to get customer ${objectId} from database:`, error);
    return `ID:${objectId}`;
  }
}

interface JiraWebhookPayload {
  issue: {
    key: string;
    fields: {
      summary: string;
      priority: {
        name: string;
      };
      created: string;
      status: {
        name: string;
      };
      description?: unknown;
      assignee?: {
        displayName: string;
        emailAddress: string;
      };
      reporter?: {
        displayName: string;
        emailAddress: string;
      };
    };
  };
  webhookEvent: string;
  issue_event_type_name?: string;
}

export async function POST(request: NextRequest) {
  try {
    const payload: JiraWebhookPayload = await request.json();
    
    console.log('🔔 JIRA Webhook received:', {
      event: payload.webhookEvent,
      ticketId: payload.issue?.key,
      eventType: payload.issue_event_type_name
    });

    // Only process relevant events
    const relevantEvents = ['jira:issue_created', 'jira:issue_updated'];
    if (!relevantEvents.includes(payload.webhookEvent)) {
      return NextResponse.json({ 
        success: true, 
        message: 'Event not processed' 
      });
    }

    const issue = payload.issue;
    if (!issue) {
      return NextResponse.json(
        { error: 'No issue data in webhook payload' },
        { status: 400 }
      );
    }

    // Get customer information from customfield_10097 and database
    let customerName = "Unknown";
    let objectId = null;
    
    const customerObj = (issue.fields as Record<string, unknown>).customfield_10097 as { objectId: string }[] | undefined;
    if (customerObj?.[0]?.objectId) {
      objectId = customerObj[0].objectId;
      // Get customer name from database
      customerName = await getCustomerFromDatabase(objectId);
    }

    // Extract description from Jira issue
    const getDescriptionText = (description: unknown): string => {
      if (!description) return '';
      if (typeof description === 'string') return description;
      
      // Handle Atlassian Document Format (ADF)
      try {
        const descObj = description as Record<string, unknown>;
        if (descObj.content && Array.isArray(descObj.content)) {
          return extractTextFromADF(descObj.content);
        }
      } catch (error) {
        console.error('Error parsing description:', error);
      }
      
      return '';
    };

    // Extract ticket data
    const ticketData = {
      ticketId: issue.key,
      priority: issue.fields.priority?.name || 'MEDIUM',
      createDate: new Date(issue.fields.created),
      status: issue.fields.status?.name || 'Unknown',
      summary: issue.fields.summary || '',
      description: getDescriptionText(issue.fields.description),
      assignee: issue.fields.assignee?.displayName || null,
      assigneeEmail: issue.fields.assignee?.emailAddress || null,
      reporter: issue.fields.reporter?.displayName || null,
      reporterEmail: issue.fields.reporter?.emailAddress || null,
      customer: customerName,
    };

    // Calculate escalation times based on priority
    const escalationTimes = await getEscalationTimes(ticketData.priority, ticketData.createDate, issue.key);

    // Store or update ticket in database
    const existingTicket = await prisma.jiraTicket.findUnique({
      where: { ticketId: issue.key }
    });

    if (existingTicket) {
      // Check if status has changed
      const statusChanged = existingTicket.status !== ticketData.status;
      
      // Update existing ticket
      await prisma.jiraTicket.update({
        where: { ticketId: issue.key },
        data: {
          status: ticketData.status,
          summary: ticketData.summary,
          description: ticketData.description,
          assignee: ticketData.assignee,
          assigneeEmail: ticketData.assigneeEmail,
          reporter: ticketData.reporter,
          reporterEmail: ticketData.reporterEmail,
          customer: ticketData.customer,
          lastUpdated: new Date()
        }
      });
      
      // Record status change in history if status changed
      if (statusChanged) {
        await prisma.statusHistory.create({
          data: {
            ticketId: issue.key,
            fromStatus: existingTicket.status,
            toStatus: ticketData.status,
            changedAt: new Date(),
            authorName: ticketData.assignee || 'System',
            authorEmail: ticketData.assigneeEmail || null
          }
        });
        console.log('📝 Status changed from', existingTicket.status, 'to', ticketData.status, 'for ticket:', issue.key);
        
        // Update waiting time tracking
        await updateWaitingTime(issue.key, existingTicket.status, ticketData.status);
        
        // If status change involves "Waiting", recalculate escalation times
        if (existingTicket.status === 'Waiting' || ticketData.status === 'Waiting') {
          console.log('🔄 Recalculating escalation times due to Waiting status change');
          const newEscalationTimes = await getEscalationTimes(ticketData.priority, existingTicket.createDate, issue.key);
          
          // Update escalation times in database
          await prisma.escalation.updateMany({
            where: { 
              ticketId: issue.key,
              level: 'Lv.1'
            },
            data: {
              scheduledTime: newEscalationTimes.escalation1Time
            }
          });
          
          await prisma.escalation.updateMany({
            where: { 
              ticketId: issue.key,
              level: 'Lv.2'
            },
            data: {
              scheduledTime: newEscalationTimes.escalation2Time
            }
          });
          
          console.log('✅ Updated escalation times for ticket:', issue.key);
        }
      }
      
      console.log('✅ Updated existing ticket:', issue.key);
    } else {
      // Create new ticket
      await prisma.jiraTicket.create({
        data: {
          ticketId: ticketData.ticketId,
          summary: ticketData.summary,
          description: ticketData.description,
          priority: ticketData.priority,
          status: ticketData.status,
          assignee: ticketData.assignee,
          assigneeEmail: ticketData.assigneeEmail,
          reporter: ticketData.reporter,
          reporterEmail: ticketData.reporterEmail,
          customer: ticketData.customer,
          createDate: ticketData.createDate,
          lastUpdated: new Date()
        }
      });
      
      // Record initial status in history
      await prisma.statusHistory.create({
        data: {
          ticketId: issue.key,
          fromStatus: null, // Initial status
          toStatus: ticketData.status,
          changedAt: ticketData.createDate,
          authorName: ticketData.reporter || 'System',
          authorEmail: ticketData.reporterEmail || null
        }
      });
      
      console.log('✅ Created new ticket:', issue.key);
    }

    // Create or update escalation records
    await prisma.escalation.upsert({
      where: { 
        ticketId_level: {
          ticketId: issue.key,
          level: 'Lv.1'
        }
      },
      update: {
        scheduledTime: escalationTimes.escalation1Time
      },
      create: {
        ticketId: issue.key,
        level: 'Lv.1',
        scheduledTime: escalationTimes.escalation1Time
      }
    });

    await prisma.escalation.upsert({
      where: { 
        ticketId_level: {
          ticketId: issue.key,
          level: 'Lv.2'
        }
      },
      update: {
        scheduledTime: escalationTimes.escalation2Time
      },
      create: {
        ticketId: issue.key,
        level: 'Lv.2',
        scheduledTime: escalationTimes.escalation2Time
      }
    });

    // Check if ticket should be escalated now
    await checkAndProcessEscalation(issue.key);

    return NextResponse.json({ 
      success: true, 
      message: 'Webhook processed successfully',
      ticketId: issue.key 
    });

  } catch (error) {
    console.error('❌ JIRA Webhook error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process webhook', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

async function updateWaitingTime(ticketId: string, fromStatus: string, toStatus: string): Promise<void> {
  try {
    const ticket = await prisma.jiraTicket.findUnique({
      where: { ticketId }
    });

    if (!ticket) return;

    let newTotalWaitingHours = ticket.totalWaitingHours;
    let newWaitingStartTime = ticket.waitingStartTime;

    // Handle status changes
    if (fromStatus !== 'Waiting' && toStatus === 'Waiting') {
      // Starting to wait
      newWaitingStartTime = new Date();
      console.log('⏸️ Starting waiting period for ticket:', ticketId);
    } else if (fromStatus === 'Waiting' && toStatus !== 'Waiting') {
      // Ending waiting period
      if (ticket.waitingStartTime) {
        const waitingDuration = (new Date().getTime() - ticket.waitingStartTime.getTime()) / (1000 * 60 * 60);
        newTotalWaitingHours += waitingDuration;
        newWaitingStartTime = null;
        console.log(`⏭️ Ending waiting period for ticket: ${ticketId}, duration: ${waitingDuration.toFixed(2)} hours`);
      }
    }

    // Update the ticket with new waiting time data
    await prisma.jiraTicket.update({
      where: { ticketId },
      data: {
        totalWaitingHours: newTotalWaitingHours,
        waitingStartTime: newWaitingStartTime
      }
    });

  } catch (error) {
    console.error('Error updating waiting time:', error);
  }
}

async function getEscalationTimes(priority: string, createDate: Date, ticketId: string) {
  const priorityLimits: { [key: string]: number } = {
    'CRITICAL': 2,  // 2 hours
    'HIGH': 4,      // 4 hours  
    'MEDIUM': 8,    // 8 hours
    'LOW': 24       // 24 hours
  };

  const limitHours = priorityLimits[priority.toUpperCase()] || 24;
  
  // Get stored waiting time from database
  const ticket = await prisma.jiraTicket.findUnique({
    where: { ticketId },
    select: { totalWaitingHours: true, waitingStartTime: true }
  });
  
  let totalWaitingTime = ticket?.totalWaitingHours || 0;
  
  // If currently waiting, add time since waiting started
  if (ticket?.waitingStartTime) {
    const currentWaitingDuration = (new Date().getTime() - ticket.waitingStartTime.getTime()) / (1000 * 60 * 60);
    totalWaitingTime += currentWaitingDuration;
  }
  
  // Escalation Lv.1 at 50% of time limit + waiting time
  const escalation1Time = new Date(createDate.getTime() + (limitHours * 0.5 * 60 * 60 * 1000) + (totalWaitingTime * 60 * 60 * 1000));
  
  // Escalation Lv.2 at 75% of time limit + waiting time
  const escalation2Time = new Date(createDate.getTime() + (limitHours * 0.75 * 60 * 60 * 1000) + (totalWaitingTime * 60 * 60 * 1000));

  return {
    escalation1Time,
    escalation2Time
  };
}

async function checkAndProcessEscalation(ticketId: string) {
  try {
    const ticket = await prisma.jiraTicket.findUnique({
      where: { ticketId },
      include: {
        escalations: true
      }
    });

    if (!ticket) return;

    const now = new Date();
    const isCompleted = isTicketCompleted(ticket.status);
    const isWaiting = ticket.status === 'Waiting';

    // Don't process escalations if ticket is in Waiting status
    if (isWaiting) {
      console.log('⏸️ Ticket is in Waiting status, escalation paused:', ticketId);
      return;
    }

    // Check each escalation level
    for (const escalation of ticket.escalations) {
      if (now >= escalation.scheduledTime && !escalation.isSent && !isCompleted) {
        await sendEscalationNotification(ticket, escalation.level);
        await prisma.escalation.update({
          where: { 
            ticketId_level: {
              ticketId: escalation.ticketId,
              level: escalation.level
            }
          },
          data: { 
            isSent: true,
            sentTime: new Date()
          }
        });
        console.log(`📧 Sent Escalation ${escalation.level} notification for:`, ticketId);
      }
    }

  } catch (error) {
    console.error('❌ Error checking escalation for ticket:', ticketId, error);
  }
}

function isTicketCompleted(status: string): boolean {
  const completedStatuses = ['Resolved', 'Closed', 'Done', 'Completed'];
  return completedStatuses.includes(status);
}


async function sendEscalationNotification(ticket: { ticketId: string; summary: string; priority: string }, level: string) {
  try {
    // Send LINE notification with correct field names
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notifications/line`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ticketCode: ticket.ticketId,
        ticketName: ticket.summary,
        escalationLevel: level,
        priority: ticket.priority,
        customer: 'Unknown', // Customer info not available in webhook
        message: level === 'Lv.1' ? 
          '⚠️ Ticket has exceeded 50% of time limit. Attention required.' :
          '🚨 URGENT: Ticket has exceeded 75% of time limit. Immediate action required!'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to send LINE notification. Status:', response.status);
      console.error('Error response:', errorText);
      throw new Error('Failed to send LINE notification');
    }

    console.log('📱 LINE notification sent for escalation', level, 'of ticket:', ticket.ticketId);
  } catch (error) {
    console.error('❌ Failed to send escalation notification:', error);
  }
}