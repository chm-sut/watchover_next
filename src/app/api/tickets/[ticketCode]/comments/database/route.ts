import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ ticketCode: string }> }
) {
  const { ticketCode } = await context.params;

  try {
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

    const formattedComments = comments.map(comment => ({
      id: comment.jiraCommentId,
      ticketCode: comment.ticket.ticketId,
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