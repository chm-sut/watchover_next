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

// Function to map JIRA status to timeline steps
const mapStatusToSteps = (currentStatus: string) => {
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
  const stepIndex = statusMapping[currentStatus];
  
  if (stepIndex !== undefined) {
    // Mark all previous steps as completed
    for (let i = 0; i <= stepIndex; i++) {
      steps[i] = 2;
    }
    // Mark current step as in progress if not the last step
    if (stepIndex < 4) {
      steps[stepIndex] = 1;
    }
  }

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
  request: NextRequest,
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
    const jql = `key = "${ticketCode}"`;
    const url = `${process.env.JIRA_BASE_URL}/rest/api/2/search`;
    
    const response = await axios.get(url, {
      headers,
      params: {
        jql,
        fields: "key,summary,priority,status,created,updated,resolutiondate,description,assignee,reporter,customfield_10097",
        maxResults: 1,
      },
    });

    if (response.data.issues.length === 0) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const issue = response.data.issues[0];
    
    // Get customer name
    const customerObj = issue.fields.customfield_10097?.[0];
    let customerName = "Unknown";

    if (customerObj?.objectId) {
      customerName = await getCustomerName(customerObj.objectId);
    }

    const currentStatus = issue.fields.status?.name || "Open";
    console.log(`🔍 COS-1715 Basic Debug - Current Status: "${currentStatus}"`);
    const mappedSteps = mapStatusToSteps(currentStatus);
    console.log(`🔍 COS-1715 Basic Debug - Mapped Steps:`, mappedSteps);

    const ticket = {
      code: issue.key,
      name: issue.fields.summary,
      priority: {
        name: String(issue.fields.priority?.name || "Unknown").toUpperCase()
      },
      customer: customerName,
      startDate: issue.fields.created?.split("T")[0] || "Unknown",
      status: currentStatus,
      description: extractTextFromJiraDescription(issue.fields.description),
      assignee: issue.fields.assignee ? {
        displayName: issue.fields.assignee.displayName,
        emailAddress: issue.fields.assignee.emailAddress
      } : null,
      reporter: issue.fields.reporter ? {
        displayName: issue.fields.reporter.displayName,
        emailAddress: issue.fields.reporter.emailAddress
      } : null,
      created: issue.fields.created,
      updated: issue.fields.updated,
      resolutionDate: issue.fields.resolutiondate,
      steps: mappedSteps
    };

    return NextResponse.json(ticket);
  } catch (error: unknown) {
    console.error("Failed to fetch ticket:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      {
        error: "Failed to fetch ticket",
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}