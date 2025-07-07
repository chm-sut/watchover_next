const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
require('dotenv').config();

const prisma = new PrismaClient();

// Get customer name from database
async function getCustomerFromDatabase(objectId) {
  try {
    const customer = await prisma.customer.findUnique({
      where: { objectId }
    });
    
    if (customer) {
      return customer.name;
    }
    
    // If not found in database, return ID format
    console.warn(`Customer ${objectId} not found in database`);
    return `ID:${objectId}`;
    
  } catch (error) {
    console.error(`❌ Failed to get customer ${objectId} from database:`, error.message);
    return `ID:${objectId}`;
  }
}

// Function to calculate escalation times based on priority
function getEscalationTimes(priority, createDate) {
  const priorityLimits = {
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
    escalation2Time
  };
}


// Check if ticket is cancelled
function isTicketCancelled(currentStatus) {
  const cancelStatuses = ['Canceled', 'Cancel', 'Cancelled', 'cancel', 'cancelled'];
  return cancelStatuses.includes(currentStatus);
}

// Extract description text from Jira ADF format
function getDescriptionText(description) {
  if (!description) return '';
  if (typeof description === 'string') return description;
  
  // Handle Atlassian Document Format (ADF)
  try {
    if (description.content && Array.isArray(description.content)) {
      return extractTextFromADF(description.content);
    }
  } catch (error) {
    console.error('Error parsing description:', error);
  }
  
  return '';
}

// Helper function to extract text from ADF content
function extractTextFromADF(content) {
  const extractText = (node) => {
    if (typeof node === 'string') return node;
    if (!node) return '';
    
    if (node.type === 'text') {
      return node.text || '';
    }
    
    if (node.content && Array.isArray(node.content)) {
      return node.content.map(extractText).join(' ');
    }
    
    return '';
  };
  
  return content.map(extractText).join(' ').trim();
}

// Main sync function
async function syncJiraToDatabase() {
  try {
    console.log('🔄 Starting JIRA to Database sync...');
    
    const auth = Buffer.from(
      `${process.env.JIRA_EMAIL}:${process.env.JIRA_API_TOKEN}`
    ).toString("base64");

    const headers = {
      Authorization: `Basic ${auth}`,
      Accept: "application/json",
    };

    const jiraSearchUrl = `${process.env.JIRA_BASE_URL}/rest/api/3/search`;

    console.log('📡 Fetching tickets from JIRA...');
    const response = await axios.get(jiraSearchUrl, {
      headers,
      params: {
        jql: `project = COS AND "Request Type" IN ("Line_Incident (COS)", "Line_Request (COS)")`,
        fields: "summary,status,priority,created,assignee,reporter,customfield_10097,description",
        expand: "changelog", // Include changelog to get status history
        maxResults: 2000,
      },
    });

    const issues = response.data.issues;
    console.log(`📊 Found ${issues.length} tickets from JIRA`);

    let syncedCount = 0;
    let skippedCount = 0;

    for (const issue of issues) {
      try {
        const currentStatus = issue.fields.status?.name || "Unknown";
        
        // Skip cancelled tickets
        if (isTicketCancelled(currentStatus)) {
          skippedCount++;
          continue;
        }

        // Get customer information from customfield_10097 and database
        let customerName = "Unknown";
        let objectId = null;
        
        const customerObj = issue.fields.customfield_10097?.[0];
        if (customerObj?.objectId) {
          objectId = customerObj.objectId;
          // Get customer name from database
          customerName = await getCustomerFromDatabase(objectId);
        }

        const createDate = new Date(issue.fields.created);
        const priority = issue.fields.priority?.name || 'MEDIUM';
        const description = getDescriptionText(issue.fields.description);
        const escalationTimes = getEscalationTimes(priority, createDate);

        // Extract status changes from changelog
        const statusChanges = [];
        if (issue.changelog && issue.changelog.histories) {
          issue.changelog.histories
            .filter(history => 
              history.items.some(item => item.field === 'status')
            )
            .forEach(history => {
              const statusItem = history.items.find(item => item.field === 'status');
              if (statusItem) {
                statusChanges.push({
                  fromStatus: statusItem.fromString,
                  toStatus: statusItem.toString,
                  changedAt: new Date(history.created)
                });
              }
            });
        }

        // Sort status changes chronologically
        statusChanges.sort((a, b) => a.changedAt.getTime() - b.changedAt.getTime());

        // Upsert ticket
        await prisma.jiraTicket.upsert({
          where: { ticketId: issue.key },
          update: {
            summary: issue.fields.summary,
            description: description,
            status: currentStatus,
            priority: priority,
            assignee: issue.fields.assignee?.displayName || null,
            assigneeEmail: issue.fields.assignee?.emailAddress || null,
            reporter: issue.fields.reporter?.displayName || null,
            reporterEmail: issue.fields.reporter?.emailAddress || null,
            customer: customerName,
            lastUpdated: new Date()
          },
          create: {
            ticketId: issue.key,
            summary: issue.fields.summary,
            description: description,
            status: currentStatus,
            priority: priority,
            assignee: issue.fields.assignee?.displayName || null,
            assigneeEmail: issue.fields.assignee?.emailAddress || null,
            reporter: issue.fields.reporter?.displayName || null,
            reporterEmail: issue.fields.reporter?.emailAddress || null,
            customer: customerName,
            createDate: createDate,
            lastUpdated: new Date()
          }
        });

        // Create escalation records
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

        // Clear existing status history for this ticket and recreate
        await prisma.statusHistory.deleteMany({
          where: { ticketId: issue.key }
        });

        // Store status history
        if (statusChanges.length > 0) {
          await prisma.statusHistory.createMany({
            data: statusChanges.map(change => ({
              ticketId: issue.key,
              fromStatus: change.fromStatus,
              toStatus: change.toStatus,
              changedAt: change.changedAt
            }))
          });
        } else {
          // If no changelog available, create initial status record
          await prisma.statusHistory.create({
            data: {
              ticketId: issue.key,
              fromStatus: null,
              toStatus: currentStatus,
              changedAt: createDate
            }
          });
        }

        syncedCount++;
        
        if (syncedCount % 10 === 0) {
          console.log(`📝 Synced ${syncedCount} tickets...`);
        }

      } catch (error) {
        console.error(`❌ Error syncing ticket ${issue.key}:`, error.message);
      }
    }

    console.log(`✅ Sync completed!`);
    console.log(`📊 Total synced: ${syncedCount}`);
    console.log(`⏭️  Skipped (cancelled): ${skippedCount}`);

  } catch (error) {
    console.error('❌ Sync failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the sync
syncJiraToDatabase();