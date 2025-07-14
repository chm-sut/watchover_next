const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
require('dotenv').config();

const prisma = new PrismaClient();

// Helper function to extract text from ADF
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
  
  if (!Array.isArray(content)) return '';
  return content.map(extractText).join(' ').trim();
}

// Helper function to extract text from comment body
function extractCommentText(body) {
  if (typeof body === 'string') {
    return body;
  }
  
  if (!body || typeof body !== 'object' || !body.content) {
    return "No comment content";
  }
  
  try {
    if (Array.isArray(body.content)) {
      return extractTextFromADF(body.content);
    }
  } catch (error) {
    console.error('Error extracting comment text:', error);
  }
  
  return "Comment unavailable";
}

async function syncCommentsToDatabase() {
  const auth = Buffer.from(
    `${process.env.JIRA_EMAIL}:${process.env.JIRA_API_TOKEN}`
  ).toString("base64");

  const headers = {
    Authorization: `Basic ${auth}`,
    Accept: "application/json",
  };

  console.log('🔄 Starting comment sync from JIRA to database...');

  try {
    // First, get all tickets from database
    const tickets = await prisma.jiraTicket.findMany({
      select: { ticketId: true }
    });

    console.log(`📋 Found ${tickets.length} tickets in database`);

    let totalComments = 0;
    let newComments = 0;
    let updatedComments = 0;

    for (const ticket of tickets) {
      try {
        console.log(`🔍 Fetching comments for ${ticket.ticketId}...`);

        // Fetch comments from JIRA
        const url = `${process.env.JIRA_BASE_URL}/rest/api/3/issue/${ticket.ticketId}/comment`;
        
        const response = await axios.get(url, {
          headers,
          params: {
            expand: "renderedBody",
            orderBy: "-created",
            maxResults: 100
          },
        });

        const comments = response.data.comments || [];
        console.log(`  📝 Found ${comments.length} comments`);

        for (const comment of comments) {
          totalComments++;

          const commentData = {
            jiraCommentId: comment.id,
            ticketId: ticket.ticketId,
            body: extractCommentText(comment.body),
            authorName: comment.author.displayName,
            authorEmail: comment.author.emailAddress || null,
            authorKey: comment.author.accountId,
            created: new Date(comment.created),
            updated: comment.updated ? new Date(comment.updated) : null,
            isInternal: comment.visibility?.type === 'group' || comment.visibility?.type === 'role' || false,
            visibility: comment.visibility ? JSON.stringify(comment.visibility) : null
          };

          // Check if comment already exists
          const existingComment = await prisma.comment.findUnique({
            where: { jiraCommentId: comment.id }
          });

          if (existingComment) {
            // Update existing comment
            await prisma.comment.update({
              where: { jiraCommentId: comment.id },
              data: {
                body: commentData.body,
                updated: commentData.updated,
                isInternal: commentData.isInternal,
                visibility: commentData.visibility
              }
            });
            updatedComments++;
          } else {
            // Create new comment
            await prisma.comment.create({
              data: commentData
            });
            newComments++;
          }
        }

        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`❌ Error processing comments for ${ticket.ticketId}:`, error.message);
      }
    }

    console.log('\\n✅ Comment sync completed!');
    console.log(`📊 Summary:`);
    console.log(`   Total comments processed: ${totalComments}`);
    console.log(`   New comments created: ${newComments}`);
    console.log(`   Comments updated: ${updatedComments}`);

  } catch (error) {
    console.error('❌ Comment sync failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the sync
syncCommentsToDatabase();