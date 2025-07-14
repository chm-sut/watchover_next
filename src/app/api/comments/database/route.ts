import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
      visibility: comment.visibility
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