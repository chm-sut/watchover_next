// Test script to fetch a specific comment from JIRA API and see what it contains
const fetch = require('node-fetch');

async function testJiraCommentFetch() {
  try {
    const jiraUrl = process.env.JIRA_URL;
    const jiraEmail = process.env.JIRA_EMAIL;
    const jiraToken = process.env.JIRA_TOKEN;

    if (!jiraUrl || !jiraEmail || !jiraToken) {
      console.log('❌ JIRA credentials not found in environment variables');
      console.log('Need: JIRA_URL, JIRA_EMAIL, JIRA_TOKEN');
      return;
    }

    console.log('🔍 Testing JIRA comment fetch with expand options...');

    // Test with a specific ticket that likely has comments
    const ticketKey = 'COS-1917'; // You can change this to any ticket
    
    const auth = Buffer.from(`${jiraEmail}:${jiraToken}`).toString('base64');
    
    // Fetch comments with expand to get rendered body
    const url = `${jiraUrl}/rest/api/3/issue/${ticketKey}/comment?expand=renderedBody`;
    console.log(`🌐 Fetching: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      console.log(`❌ JIRA API error: ${response.status} ${response.statusText}`);
      return;
    }

    const data = await response.json();
    
    console.log(`📋 Found ${data.comments.length} comments for ${ticketKey}`);
    
    data.comments.forEach((comment, index) => {
      console.log(`\n--- JIRA Comment ${index + 1} ---`);
      console.log(`ID: ${comment.id}`);
      console.log(`Author: ${comment.author.displayName}`);
      console.log(`Created: ${comment.created}`);
      console.log(`Body: ${comment.body.substring(0, 200)}...`);
      
      if (comment.renderedBody) {
        console.log(`RenderedBody: ${comment.renderedBody.substring(0, 500)}...`);
        
        // Check for images in rendered body
        const hasImages = comment.renderedBody.includes('<img') || 
                          comment.renderedBody.includes('attachment') ||
                          comment.renderedBody.includes('image');
        
        if (hasImages) {
          console.log('🖼️ This comment contains images!');
        }
      } else {
        console.log('❌ No renderedBody field found');
      }
      
      console.log(`--- End Comment ${index + 1} ---`);
    });
    
  } catch (error) {
    console.error('❌ Error testing JIRA comment fetch:', error);
  }
}

testJiraCommentFetch();