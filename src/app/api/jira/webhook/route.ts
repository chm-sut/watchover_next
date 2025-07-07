import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import axios from 'axios';

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

    // Get customer information from database
    const customerObj = (issue.fields as Record<string, unknown>).customfield_10097 as { objectId: string }[] | undefined;
    let customerName = "Unknown";
    
    if (customerObj?.[0]?.objectId) {
      customerName = await getCustomerFromDatabase(customerObj[0].objectId);
    }

    // Extract ticket data
    const ticketData = {
      ticketId: issue.key,
      priority: issue.fields.priority?.name || 'MEDIUM',
      createDate: new Date(issue.fields.created),
      status: issue.fields.status?.name || 'Unknown',
      summary: issue.fields.summary || '',
      assignee: issue.fields.assignee?.displayName || null,
      assigneeEmail: issue.fields.assignee?.emailAddress || null,
      reporter: issue.fields.reporter?.displayName || null,
      reporterEmail: issue.fields.reporter?.emailAddress || null,
      customer: customerName,
    };

    // Calculate escalation times based on priority
    const escalationTimes = getEscalationTimes(ticketData.priority, ticketData.createDate);

    // Store or update ticket in database
    const existingTicket = await prisma.jiraTicket.findUnique({
      where: { ticketId: issue.key }
    });

    if (existingTicket) {
      // Update existing ticket
      await prisma.jiraTicket.update({
        where: { ticketId: issue.key },
        data: {
          status: ticketData.status,
          summary: ticketData.summary,
          assignee: ticketData.assignee,
          assigneeEmail: ticketData.assigneeEmail,
          lastUpdated: new Date(),
          ...escalationTimes
        }
      });
      console.log('✅ Updated existing ticket:', issue.key);
    } else {
      // Create new ticket
      await prisma.jiraTicket.create({
        data: {
          ...ticketData,
          ...escalationTimes,
          lastUpdated: new Date()
        }
      });
      console.log('✅ Created new ticket:', issue.key);
    }

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

function getEscalationTimes(priority: string, createDate: Date) {
  const priorityLimits: { [key: string]: number } = {
    'CRITICAL': 2,  // 2 hours
    'HIGH': 4,      // 4 hours  
    'MEDIUM': 8,    // 8 hours
    'LOW': 24       // 24 hours
  };

  const limitHours = priorityLimits[priority.toUpperCase()] || 24;
  
  // Escalation Lv.1 at 50% of time limit
  const escalation1Time = new Date(createDate.getTime() + (limitHours * 0.5 * 60 * 60 * 1000));
  
  // Escalation Lv.2 at 75% of time limit  
  const escalation2Time = new Date(createDate.getTime() + (limitHours * 0.75 * 60 * 60 * 1000));

  return {
    escalation1Time,
    escalation2Time,
    priorityLimitHours: limitHours
  };
}

async function checkAndProcessEscalation(ticketId: string) {
  try {
    const ticket = await prisma.jiraTicket.findUnique({
      where: { ticketId }
    });

    if (!ticket) return;

    const now = new Date();
    const isCompleted = isTicketCompleted(ticket.status);

    // Check Escalation Lv.1
    if (now >= ticket.escalation1Time && !ticket.escalation1Sent && !isCompleted) {
      await sendEscalationNotification(ticket, 'Lv.1');
      await prisma.jiraTicket.update({
        where: { ticketId },
        data: { escalation1Sent: true }
      });
      console.log('📧 Sent Escalation Lv.1 notification for:', ticketId);
    }

    // Check Escalation Lv.2
    if (now >= ticket.escalation2Time && !ticket.escalation2Sent && !isCompleted) {
      await sendEscalationNotification(ticket, 'Lv.2');
      await prisma.jiraTicket.update({
        where: { ticketId },
        data: { escalation2Sent: true }
      });
      console.log('📧 Sent Escalation Lv.2 notification for:', ticketId);
    }

  } catch (error) {
    console.error('❌ Error checking escalation for ticket:', ticketId, error);
  }
}

function isTicketCompleted(status: string): boolean {
  const completedStatuses = ['Resolved', 'Closed', 'Done', 'Completed'];
  return completedStatuses.includes(status);
}

// Get customer from database, fetch from JIRA API if not found
async function getCustomerFromDatabase(objectId: string): Promise<string> {
  try {
    // First, try to get customer from database
    const customer = await prisma.customer.findUnique({
      where: { objectId }
    });
    
    if (customer) {
      return customer.name;
    }
    
    // If not found, fetch from JIRA API and store in database
    console.log(`🔍 Customer ${objectId} not found in database, fetching from JIRA...`);
    
    const auth = Buffer.from(
      `${process.env.JIRA_EMAIL}:${process.env.JIRA_API_TOKEN}`
    ).toString("base64");

    const headers = {
      Authorization: `Basic ${auth}`,
      Accept: "application/json",
    };

    const assetUrl = `${process.env.JIRA_BASE_URL}/rest/assetapi/asset/${objectId}`;
    const assetRes = await axios.get(assetUrl, { headers });

    const { name, objectKey } = assetRes.data;
    const expectedKey = `CD-${objectId}`;
    const resolvedName = objectKey === expectedKey && name ? name : name || objectKey || `ID:${objectId}`;

    // Store in database for future use
    await prisma.customer.create({
      data: {
        objectId,
        name: resolvedName,
        objectKey
      }
    });

    console.log(`✅ Added new customer to database: ${resolvedName}`);
    return resolvedName;
    
  } catch (error) {
    console.error(`❌ Failed to get customer ${objectId}:`, error);
    return `ID:${objectId}`;
  }
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