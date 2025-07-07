#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Configuration
const CUSTOMER_MAP_PATH = path.resolve('./public/data/customerMap.json');
const JIRA_BASE_URL = process.env.JIRA_BASE_URL;
const JIRA_EMAIL = process.env.JIRA_EMAIL;
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;

// Load existing customer map
function loadExistingCustomerMap() {
  try {
    if (fs.existsSync(CUSTOMER_MAP_PATH)) {
      const data = fs.readFileSync(CUSTOMER_MAP_PATH, 'utf-8');
      return JSON.parse(data);
    }
    return {};
  } catch (error) {
    console.error('❌ Error loading existing customer map:', error.message);
    return {};
  }
}

// Save customer map to file
function saveCustomerMap(customerMap) {
  try {
    const sortedMap = {};
    Object.keys(customerMap)
      .sort((a, b) => parseInt(a) - parseInt(b))
      .forEach(key => {
        sortedMap[key] = customerMap[key];
      });

    fs.writeFileSync(CUSTOMER_MAP_PATH, JSON.stringify(sortedMap, null, 2));
    console.log('✅ Customer map saved successfully');
    return true;
  } catch (error) {
    console.error('❌ Error saving customer map:', error.message);
    return false;
  }
}

// Fetch customer details from JIRA Assets API
async function fetchCustomerFromJira(objectId) {
  try {
    const auth = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64');
    
    const headers = {
      Authorization: `Basic ${auth}`,
      Accept: 'application/json',
    };

    const assetUrl = `${JIRA_BASE_URL}/rest/assetapi/asset/${objectId}`;
    console.log(`📡 Fetching customer details for ID: ${objectId}`);
    
    const response = await axios.get(assetUrl, { headers });
    const { name, objectKey } = response.data;
    
    // Validate the expected key format
    const expectedKey = `CD-${objectId}`;
    const resolvedName = objectKey === expectedKey && name ? name : name || objectKey || `ID:${objectId}`;
    
    console.log(`✅ Found customer: ${resolvedName} (${objectKey})`);
    return resolvedName;
    
  } catch (error) {
    console.error(`❌ Failed to fetch customer ${objectId}:`, error.response?.data || error.message);
    return `ID:${objectId}`;
  }
}

// Get all unique customer IDs from recent JIRA tickets
async function getCustomerIdsFromJira() {
  try {
    const auth = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64');
    
    const headers = {
      Authorization: `Basic ${auth}`,
      Accept: 'application/json',
    };

    console.log('📡 Fetching recent tickets from JIRA...');
    
    const jiraSearchUrl = `${JIRA_BASE_URL}/rest/api/3/search`;
    const response = await axios.get(jiraSearchUrl, {
      headers,
      params: {
        jql: `project = COS AND "Request Type" IN ("Line_Incident (COS)", "Line_Request (COS)") AND created >= -30d`,
        fields: 'customfield_10097',
        maxResults: 1000,
      },
    });

    const customerIds = new Set();
    
    response.data.issues.forEach(issue => {
      const customerObj = issue.fields.customfield_10097?.[0];
      if (customerObj?.objectId) {
        customerIds.add(customerObj.objectId);
      }
    });

    console.log(`📋 Found ${customerIds.size} unique customer IDs in recent tickets`);
    return Array.from(customerIds);
    
  } catch (error) {
    console.error('❌ Error fetching customer IDs from JIRA:', error.response?.data || error.message);
    return [];
  }
}

// Main function to update customer map
async function updateCustomerMap() {
  console.log('🚀 Starting customer map update...');
  
  // Check environment variables
  if (!JIRA_BASE_URL || !JIRA_EMAIL || !JIRA_API_TOKEN) {
    console.error('❌ Missing required environment variables: JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN');
    process.exit(1);
  }

  // Load existing customer map
  const existingCustomerMap = loadExistingCustomerMap();
  console.log(`📖 Loaded ${Object.keys(existingCustomerMap).length} existing customers`);

  // Get customer IDs from recent tickets
  const customerIds = await getCustomerIdsFromJira();
  
  if (customerIds.length === 0) {
    console.log('ℹ️ No customer IDs found in recent tickets');
    return;
  }

  // Find new customer IDs that aren't in the existing map
  const newCustomerIds = customerIds.filter(id => !existingCustomerMap[id]);
  
  if (newCustomerIds.length === 0) {
    console.log('✅ No new customers found. Customer map is up to date!');
    return;
  }

  console.log(`🆕 Found ${newCustomerIds.length} new customers to add:`);
  newCustomerIds.forEach(id => console.log(`   - ${id}`));

  // Fetch details for new customers
  let addedCount = 0;
  const updatedCustomerMap = { ...existingCustomerMap };

  for (const customerId of newCustomerIds) {
    try {
      const customerName = await fetchCustomerFromJira(customerId);
      updatedCustomerMap[customerId] = customerName;
      addedCount++;
      
      // Add a small delay to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error(`❌ Failed to process customer ${customerId}:`, error.message);
    }
  }

  // Save updated customer map
  if (addedCount > 0) {
    const success = saveCustomerMap(updatedCustomerMap);
    if (success) {
      console.log(`🎉 Successfully added ${addedCount} new customers to the map!`);
      console.log(`📊 Total customers: ${Object.keys(updatedCustomerMap).length}`);
    }
  } else {
    console.log('❌ No customers were successfully added');
  }
}

// Run the script
if (require.main === module) {
  updateCustomerMap()
    .then(() => {
      console.log('✅ Customer map update completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Customer map update failed:', error.message);
      process.exit(1);
    });
}

module.exports = { updateCustomerMap, fetchCustomerFromJira };