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
    // Fetch ticket details with attachments and comments
    const [commentsResponse, ticketResponse] = await Promise.all([
      axios.get(`${process.env.JIRA_BASE_URL}/rest/api/3/issue/${ticketCode}/comment`, {
        headers,
        params: {
          expand: "renderedBody",
          orderBy: "-created",
          maxResults: 100
        },
      }),
      axios.get(`${process.env.JIRA_BASE_URL}/rest/api/3/issue/${ticketCode}`, {
        headers,
        params: {
          fields: "attachment"
        },
      })
    ]);

    const attachments = ticketResponse.data.fields.attachment || [];
    
    const comments = commentsResponse.data.comments.map((comment: any) => ({
      id: comment.id,
      ticketCode: ticketCode,
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
      visibility: comment.visibility || null,
      attachments: attachments.map((att: any) => ({
        id: att.id,
        filename: att.filename,
        mimeType: att.mimeType,
        size: att.size,
        created: att.created
      }))
    }));

    return NextResponse.json({
      ticketCode,
      total: commentsResponse.data.total,
      comments
    });

  } catch (error: unknown) {
    console.error(`Failed to fetch comments for ${ticketCode}:`, error instanceof Error ? error.message : error);
    return NextResponse.json(
      {
        error: "Failed to fetch comments",
        ticketCode,
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}