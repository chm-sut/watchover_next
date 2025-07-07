import { NextResponse } from 'next/server';
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

// Function to map JIRA status to timeline steps (currently unused)
/*
const mapStatusToSteps = (statusHistory: { toStatus: string }[], currentStatus: string) => {
  if (isTicketCancelled(statusHistory, currentStatus)) {
    return null;
  }
  
  const statusMapping: { [key: string]: number } = {
    'Open': 0,
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
*/

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

    const { name, objectKey } = assetRes.data;
    const expectedKey = `CD-${objectId}`;

    const resolvedName = objectKey === expectedKey && name ? name : name || objectKey || `ID:${objectId}`;
    customerMap[objectId] = resolvedName;

    return resolvedName;
  } catch (e) {
    console.warn(`Failed to get asset name for objectId=${objectId}: ${e}`);
    return `ID:${objectId}`;
  }
}

export async function GET() {
  try {
    const auth = Buffer.from(
      `${process.env.JIRA_EMAIL}:${process.env.JIRA_API_TOKEN}`
    ).toString("base64");

    const headers = {
      Authorization: `Basic ${auth}`,
      Accept: "application/json",
    };

    const jiraSearchUrl = `${process.env.JIRA_BASE_URL}/rest/api/3/search`;

    const response = await axios.get(jiraSearchUrl, {
      headers,
      params: {
        jql: `project = COS AND "Request Type" IN ("Line_Incident (COS)", "Line_Request (COS)")`,
        fields: "summary,status,priority,created,customfield_10097",
        maxResults: 2000,
      },
    });

    const tickets = await Promise.all(
      response.data.issues.map(async (issue: { key: string; fields: { summary: string; priority?: { name: string }; created: string; customfield_10097?: { objectId: string }[]; status?: { name: string }; [key: string]: unknown } }) => {
        const customerObj = issue.fields.customfield_10097?.[0];
        let customerName = "Unknown";

        if (customerObj?.objectId) {
          customerName = await getCustomerName(customerObj.objectId);
        }

        const currentStatus = issue.fields.status?.name || "Unknown";
        
        if (isTicketCancelled([], currentStatus)) {
          return null;
        }

        return {
          code: issue.key,
          name: issue.fields.summary,
          priority: {
            name: String(issue.fields.priority?.name || "Unknown").toUpperCase()
          },
          customer: customerName,
          startDate: issue.fields.created?.split("T")[0] || "Unknown",
          status: currentStatus,
          steps: [0, 0, 0, 0, 0],
        };
      })
    );

    const filteredTickets = tickets.filter(ticket => ticket !== null);
    return NextResponse.json(filteredTickets);
  } catch (error: unknown) {
    const errorDetails = error instanceof Error && 'response' in error 
      ? (error as { response?: { data?: unknown } }).response?.data || error.message 
      : error instanceof Error 
        ? error.message 
        : 'Unknown error';
    
    console.error("Failed to fetch tickets:", errorDetails);
    return NextResponse.json(
      {
        error: "Failed to fetch tickets",
        details: errorDetails,
      },
      { status: 500 }
    );
  }
}