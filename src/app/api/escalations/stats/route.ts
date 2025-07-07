import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const [
      totalEscalations,
      lv1Count,
      lv2Count,
      recentEvents,
      escalationsByPriority
    ] = await Promise.all([
      prisma.escalation.count(),
      prisma.escalation.count({ where: { level: 'Lv.1' } }),
      prisma.escalation.count({ where: { level: 'Lv.2' } }),
      prisma.escalation.count({
        where: {
          sentTime: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      }),
      prisma.escalation.groupBy({
        by: ['level'],
        _count: {
          level: true
        }
      })
    ]);

    return NextResponse.json({
      success: true,
      stats: {
        totalEscalations,
        levelBreakdown: {
          lv1: lv1Count,
          lv2: lv2Count
        },
        recentEvents24h: recentEvents,
        escalationsByPriority: escalationsByPriority.reduce((acc, item) => {
          acc[item.level || 'Unknown'] = item._count.level;
          return acc;
        }, {} as Record<string, number>)
      }
    });

  } catch (error) {
    console.error('Error fetching escalation stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch escalation statistics' },
      { status: 500 }
    );
  }
}