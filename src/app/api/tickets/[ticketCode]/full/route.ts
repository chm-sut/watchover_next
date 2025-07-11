import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

let customerMap: { [key: string]: string } = {};

function loadCustomerJSON() {
  const jsonPath = path.resolve(process.env.CUSTOMER_JSON_PATH || "./public/data/customerMap.json");
  
  if (!fs.existsSync(jsonPath)) {
    console.warn(`⚠️ customerMap.json not found at path: ${jsonPath}`);
    return;
  }
  
  try {
    const rawData = fs.readFileSync(jsonPath, "utf-8");
    customerMap = JSON.parse(rawData);
    console.log(`✅ Loaded ${Object.keys(customerMap).length} customers from JSON`);
  } catch (error) {
    console.error("❌ Failed to parse customerMap.json:", error);
  }
}

// Load customer data on module initialization
loadCustomerJSON();

// Helper function to extract text from JIRA rich text format
function extractTextFromJiraDescription(description: unknown): string {
  if (typeof description === 'string') {
    return description;
  }
  
  if (!description || typeof description !== 'object' || !('content' in description)) {
    return "No description available";
  }
  
  // Extract text from ADF (Atlassian Document Format)
  function extractText(node: unknown): string {
    if (typeof node === 'string') return node;
    if (!node) return '';
    
    const nodeObj = node as Record<string, unknown>;
    
    if (nodeObj.type === 'text') {
      return (nodeObj.text as string) || '';
    }
    
    if (nodeObj.content && Array.isArray(nodeObj.content)) {
      return nodeObj.content.map(extractText).join(' ');
    }
    
    if (nodeObj.text) {
      return nodeObj.text as string;
    }
    
    return '';
  }
  
  try {
    const descObj = description as Record<string, unknown>;
    return extractText(descObj.content).trim() || "No description available";
  } catch (error) {
    console.error('Error extracting text from description:', error);
    return "Description unavailable";
  }
}

// Function to check if ticket was cancelled
const isTicketCancelled = (statusHistory: { toStatus: string }[], currentStatus: string) => {
  const cancelStatuses = ['Canceled', 'Cancel', 'Cancelled', 'cancel', 'cancelled'];
  if (cancelStatuses.includes(currentStatus)) {
    return true;
  }
  
  return statusHistory.some(change => 
    cancelStatuses.includes(change.toStatus)
  );
};

// Function to map JIRA status to timeline steps
const mapStatusToSteps = (statusHistory: { toStatus: string }[], currentStatus: string) => {
  if (isTicketCancelled(statusHistory, currentStatus)) {
    return null;
  }
  
  const statusMapping: { [key: string]: number } = {
    'Open': 0,
    'Assign Engineer': 1,
    'Assign Enginner': 1,
    'In Progress': 1,
    'Waiting': 2,
    'Investigating': 2,
    'Resolved': 3,
    'Closed': 4,
    'Done': 4
  };

  const steps = [0, 0, 0, 0, 0];
  
  statusHistory.forEach(change => {
    const status = change.toStatus;
    const stepIndex = statusMapping[status];
    
    if (stepIndex !== undefined) {
      for (let i = 0; i <= stepIndex; i++) {
        steps[i] = 2;
      }
      
      if (stepIndex < 4 && steps[stepIndex + 1] === 0) {
        steps[stepIndex] = 1;
      }
    }
  });

  return steps;
};

async function getCustomerName(objectId: string) {
  if (customerMap[objectId]) {
    return customerMap[objectId];
  }

  try {
    const auth = Buffer.from(
      `${process.env.JIRA_EMAIL}:${process.env.JIRA_API_TOKEN}`
    ).toString("base64");

    const headers = {
      Authorization: `Basic ${auth}`,
      Accept: "application/json",
    };

    const assetUrl = `${process.env.JIRA_BASE_URL}/rest/assetapi/asset/${objectId}`;
    const assetRes = await axios.get(assetUrl, { headers });

    const customerName = assetRes.data?.displayName || `ID:${objectId}`;
    customerMap[objectId] = customerName;
    return customerName;
  } catch (error) {
    console.error(`Failed to fetch customer ${objectId}:`, error);
    return `ID:${objectId}`;
  }
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ ticketCode: string }> }
) {
  const { ticketCode } = await context.params;

  const auth = Buffer.from(
    `${process.env.JIRA_EMAIL}:${process.env.JIRA_API_TOKEN}`
  ).toString("base64");

  const headers = {
    Authorization: `Basic ${auth}`,
    Accept: "application/json",
  };

  try {
    // Get ticket with full changelog
    const url = `${process.env.JIRA_BASE_URL}/rest/api/3/issue/${ticketCode}?expand=changelog`;
    
    const response = await axios.get(url, { headers });
    const issue = response.data;

    // Extract status changes from changelog
    const statusChanges = issue.changelog.histories
      .filter((history: { items: { field: string; fromString?: string; toString?: string }[] }) => 
        history.items.some((item: { field: string }) => item.field === 'status')
      )
      .map((history: { id: string; created: string; author: { displayName: string; emailAddress: string }; items: { field: string; fromString?: string; toString?: string }[] }) => {
        const statusItem = history.items.find((item: { field: string }) => item.field === 'status');
        return {
          id: history.id,
          created: history.created,
          author: {
            displayName: history.author.displayName,
            emailAddress: history.author.emailAddress
          },
          fromStatus: statusItem?.fromString,
          toStatus: statusItem?.toString,
          timestamp: new Date(history.created).getTime()
        };
      })
      .sort((a: { timestamp: number }, b: { timestamp: number }) => a.timestamp - b.timestamp); // Sort chronologically

    // Get customer name
    const customerObj = issue.fields.customfield_10097?.[0];
    let customerName = "Unknown";

    if (customerObj?.objectId) {
      customerName = await getCustomerName(customerObj.objectId);
    }

    // Map status changes to timeline steps
    const currentStatus = issue.fields.status?.name || "Unknown";
    console.log(`🔍 COS-1715 Debug - Current Status: "${currentStatus}"`);
    console.log(`🔍 COS-1715 Debug - Status History:`, statusChanges.map((s: Record<string, unknown>) => s.toStatus));
    
    const steps = mapStatusToSteps(statusChanges, currentStatus);
    console.log(`🔍 COS-1715 Debug - Mapped Steps:`, steps);

    // If ticket was cancelled, return 404
    if (steps === null) {
      console.log(`🔍 COS-1715 Debug - Ticket was cancelled`);
      return NextResponse.json({ error: "Ticket was cancelled and is not available" }, { status: 404 });
    }

    const ticket = {
      code: issue.key,
      name: issue.fields.summary,
      priority: {
        name: String(issue.fields.priority?.name || "Unknown").toUpperCase()
      },
      customer: customerName,
      startDate: issue.fields.created?.split("T")[0] || "Unknown",
      currentStatus: currentStatus,
      description: extractTextFromJiraDescription(issue.fields.description),
      assignee: issue.fields.assignee ? {
        displayName: issue.fields.assignee.displayName,
        emailAddress: issue.fields.assignee.emailAddress
      } : null,
      reporter: issue.fields.reporter ? {
        displayName: issue.fields.reporter.displayName,
        emailAddress: issue.fields.reporter.emailAddress
      } : null,
      steps: steps,
      statusHistory: statusChanges,
      timeline: {
        created: issue.fields.created,
        updated: issue.fields.updated,
        resolved: issue.fields.resolutiondate
      }
    };

    return NextResponse.json(ticket);
  } catch (error: unknown) {
    const errorDetails = error instanceof Error && 'response' in error 
      ? (error as { response?: { data?: unknown } }).response?.data || error.message 
      : error instanceof Error 
        ? error.message 
        : 'Unknown error';
    
    console.error("Failed to fetch full ticket data:", errorDetails);
    return NextResponse.json(
      {
        error: "Failed to fetch full ticket data",
        details: errorDetails,
      },
      { status: 500 }
    );
  }
}