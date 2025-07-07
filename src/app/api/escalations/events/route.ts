import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    const ticketId = searchParams.get('ticketId');

    const whereClause = ticketId ? { ticketId } : {};

    const [events, total] = await Promise.all([
      prisma.escalation.findMany({
        where: whereClause,
        take: limit,
        skip: offset,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          ticket: true
        }
      }),
      prisma.escalation.count({ where: whereClause })
    ]);

    return NextResponse.json({
      success: true,
      data: events,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });

  } catch (error) {
    console.error('Error fetching escalation events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch escalation events' },
      { status: 500 }
    );
  }
}