import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// Helper function to extract text from JIRA rich text format
function extractTextFromJiraComment(body: unknown): string {
  if (typeof body === 'string') {
    return body;
  }
  
  if (!body || typeof body !== 'object' || !('content' in body)) {
    return "No comment content";
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
    const bodyObj = body as Record<string, unknown>;
    return extractText(bodyObj.content).trim() || "No comment content";
  } catch (error) {
    console.error('Error extracting text from comment:', error);
    return "Comment unavailable";
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '50');

  const auth = Buffer.from(
    `${process.env.JIRA_EMAIL}:${process.env.JIRA_API_TOKEN}`
  ).toString("base64");

  const headers = {
    Authorization: `Basic ${auth}`,
    Accept: "application/json",
  };

  try {
    // First, get all tickets from the project
    const jql = 'project = COS AND "Request Type" IN ("Line_Incident (COS)", "Line_Request (COS)")';
    const ticketsUrl = `${process.env.JIRA_BASE_URL}/rest/api/2/search`;
    
    const ticketsResponse = await axios.get(ticketsUrl, {
      headers,
      params: {
        jql,
        fields: "key,summary,priority,status,created,assignee,reporter,customfield_10097",
        maxResults: 100
      },
    });

    const allComments: any[] = [];

    // Fetch recent comments for each ticket
    for (const issue of ticketsResponse.data.issues) {
      try {
        const commentsUrl = `${process.env.JIRA_BASE_URL}/rest/api/3/issue/${issue.key}/comment`;
        
        const commentsResponse = await axios.get(commentsUrl, {
          headers,
          params: {
            expand: "renderedBody",
            orderBy: "-created",
            maxResults: 5 // Get recent comments per ticket
          },
        });

        const ticketComments = commentsResponse.data.comments.map((comment: any) => ({
          id: comment.id,
          ticketCode: issue.key,
          ticketSummary: issue.fields.summary,
          ticketPriority: issue.fields.priority?.name || 'LOW',
          body: extractTextFromJiraComment(comment.body),
          renderedBody: comment.renderedBody || '',
          author: {
            name: comment.author.displayName,
            email: comment.author.emailAddress,
            key: comment.author.accountId
          },
          created: comment.created,
          updated: comment.updated,
          isInternal: comment.visibility?.type === 'group' || comment.visibility?.type === 'role',
          visibility: comment.visibility || null
        }));

        allComments.push(...ticketComments);
      } catch (commentError) {
        console.error(`Failed to fetch comments for ${issue.key}:`, commentError);
        // Continue with other tickets even if one fails
      }
    }

    // Sort all comments by creation date (newest first) and limit
    const sortedComments = allComments
      .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())
      .slice(0, limit);

    return NextResponse.json({
      total: sortedComments.length,
      comments: sortedComments
    });

  } catch (error: unknown) {
    console.error("Failed to fetch recent comments:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      {
        error: "Failed to fetch recent comments",
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}