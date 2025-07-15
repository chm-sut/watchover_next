import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import axios from 'axios';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '50');
  const ticketId = searchParams.get('ticketId');

  try {
    const whereClause = ticketId ? { ticketId } : {};

    const comments = await prisma.comment.findMany({
      where: whereClause,
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
      },
      take: limit
    });

    // Get unique ticket IDs to fetch attachments
    const uniqueTicketIds = [...new Set(comments.map(c => c.ticket.ticketId))];
    const ticketAttachments = new Map();

    // Fetch attachments for all unique tickets
    if (uniqueTicketIds.length > 0) {
      const auth = Buffer.from(`${process.env.JIRA_EMAIL}:${process.env.JIRA_TOKEN || process.env.JIRA_API_TOKEN}`).toString('base64');
      const jiraUrl = process.env.JIRA_URL || process.env.JIRA_BASE_URL;
      
      await Promise.all(uniqueTicketIds.map(async (ticketId) => {
        try {
          const response = await axios.get(`${jiraUrl}/rest/api/3/issue/${ticketId}`, {
            headers: { 'Authorization': `Basic ${auth}`, 'Accept': 'application/json' },
            params: { fields: 'attachment' }
          });
          const attachments = response.data.fields.attachment || [];
          ticketAttachments.set(ticketId, attachments.map((att: any) => ({
            id: att.id,
            filename: att.filename,
            mimeType: att.mimeType,
            size: att.size,
            created: att.created
          })));
        } catch (error) {
          console.warn(`Failed to fetch attachments for ${ticketId}:`, error);
          ticketAttachments.set(ticketId, []);
        }
      }));
    }

    const formattedComments = comments.map(comment => ({
      id: comment.id,
      jiraCommentId: comment.jiraCommentId,
      ticketCode: comment.ticket.ticketId,
      ticketSummary: comment.ticket.summary,
      ticketPriority: comment.ticket.priority,
      ticketCustomer: comment.ticket.customer,
      ticketStatus: comment.ticket.status,
      body: comment.body,
      author: {
        name: comment.authorName,
        email: comment.authorEmail,
        key: comment.authorKey
      },
      created: comment.created.toISOString(),
      updated: comment.updated?.toISOString() || null,
      isInternal: comment.isInternal,
      visibility: comment.visibility,
      attachments: ticketAttachments.get(comment.ticket.ticketId) || []
    }));

    return NextResponse.json({
      total: formattedComments.length,
      comments: formattedComments
    });

  } catch (error) {
    console.error("Failed to fetch comments from database:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch comments",
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}