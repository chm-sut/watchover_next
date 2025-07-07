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
  
  if (!description || !description.content) {
    return "No description available";
  }
  
  // Extract text from ADF (Atlassian Document Format)
  function extractText(node: unknown): string {
    if (typeof node === 'string') return node;
    if (!node) return '';
    
    if (node.type === 'text') {
      return node.text || '';
    }
    
    if (node.content && Array.isArray(node.content)) {
      return node.content.map(extractText).join(' ');
    }
    
    if (node.text) {
      return node.text;
    }
    
    return '';
  }
  
  try {
    return extractText(description).trim() || "No description available";
  } catch (error) {
    console.error('Error extracting text from description:', error);
    return "Description unavailable";
  }
}

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

    const ticket = {
      code: issue.key,
      name: issue.fields.summary,
      priority: {
        name: String(issue.fields.priority?.name || "Unknown").toUpperCase()
      },
      customer: customerName,
      startDate: issue.fields.created?.split("T")[0] || "Unknown",
      status: issue.fields.status?.name || "Unknown",
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
      steps: [0, 0, 0, 0, 0], // Will be enhanced with actual status tracking
    };

    return NextResponse.json(ticket);
  } catch (error: unknown) {
    console.error("Failed to fetch ticket:", error.response?.data || error.message);
    return NextResponse.json(
      {
        error: "Failed to fetch ticket",
        details: error instanceof Error && 'response' in error ? (error as { response?: { data?: unknown } }).response?.data || error.message : error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}