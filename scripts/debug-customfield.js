const axios = require('axios');
require('dotenv').config();

async function debugCustomField() {
  try {
    const auth = Buffer.from(
      `${process.env.JIRA_EMAIL}:${process.env.JIRA_API_TOKEN}`
    ).toString("base64");

    const headers = {
      Authorization: `Basic ${auth}`,
      Accept: "application/json",
    };

    const jiraSearchUrl = `${process.env.JIRA_BASE_URL}/rest/api/3/search`;

    console.log('🔍 Fetching sample tickets to debug customfield_10097...');
    const response = await axios.get(jiraSearchUrl, {
      headers,
      params: {
        jql: `key IN (COS-1007, COS-1008, COS-1009)`,
        fields: "summary,customfield_10097",
        maxResults: 5,
      },
    });

    console.log('\n📊 Sample customfield_10097 data:');
    response.data.issues.forEach((issue, index) => {
      console.log(`\n${index + 1}. Ticket: ${issue.key}`);
      console.log(`   Summary: ${issue.fields.summary}`);
      console.log(`   customfield_10097:`, JSON.stringify(issue.fields.customfield_10097, null, 2));
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugCustomField();