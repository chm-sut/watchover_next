import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const [escalations, total] = await Promise.all([
      prisma.escalationHistory.findMany({
        take: limit,
        skip: offset,
        orderBy: {
          lastUpdatedAt: 'desc'
        }
      }),
      prisma.escalationHistory.count()
    ]);

    return NextResponse.json({
      success: true,
      data: escalations,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });

  } catch (error) {
    console.error('Error fetching escalation history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch escalation history' },
      { status: 500 }
    );
  }
}