import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import axios from 'axios';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ ticketCode: string }> }
) {
  const { ticketCode } = await context.params;

  try {
    // Get comments from database
    const comments = await prisma.comment.findMany({
      where: {
        ticketId: ticketCode
      },
      include: {
        ticket: {
          select: {
            ticketId: true,
            summary: true,
            priority: true,
            customer: true,
            status: true
          }
        }
      },
      orderBy: {
        created: 'desc'
      }
    });

    // Fetch attachments from JIRA if needed
    let attachments: any[] = [];
    if (comments.length > 0) {
      try {
        const auth = Buffer.from(`${process.env.JIRA_EMAIL}:${process.env.JIRA_TOKEN || process.env.JIRA_API_TOKEN}`).toString('base64');
        const jiraUrl = process.env.JIRA_URL || process.env.JIRA_BASE_URL;
        const jiraResponse = await axios.get(
          `${jiraUrl}/rest/api/3/issue/${ticketCode}`,
          {
            headers: {
              'Authorization': `Basic ${auth}`,
              'Accept': 'application/json',
            },
            params: {
              fields: 'attachment'
            }
          }
        );
        attachments = jiraResponse.data.fields.attachment || [];
      } catch (jiraError) {
        console.error('Failed to fetch attachments from JIRA:', jiraError);
      }
    }

    const formattedComments = comments.map(comment => ({
      id: comment.jiraCommentId,
      ticketCode: comment.ticket.ticketId,
      body: comment.body,
      renderedBody: (comment as any).renderedBody || comment.body,
      author: {
        name: comment.authorName,
        email: comment.authorEmail,
        key: comment.authorKey
      },
      created: comment.created.toISOString(),
      updated: comment.updated?.toISOString() || null,
      isInternal: comment.isInternal,
      visibility: comment.visibility,
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
      total: formattedComments.length,
      comments: formattedComments
    });

  } catch (error) {
    console.error(`Failed to fetch comments for ${ticketCode}:`, error);
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