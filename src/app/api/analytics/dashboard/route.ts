import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Execute all queries in parallel for better performance
    const [
      totalTickets,
      activeTickets,
      avgResponseTime,
      todayTickets,
      priorityDistribution,
      statusDistribution,
      topCustomers,
      commentsToday
    ] = await Promise.all([
      // 1. Total Tickets
      prisma.jiraTicket.count(),
      
      // 2. Active Tickets (not Closed)
      prisma.jiraTicket.count({
        where: {
          status: {
            not: 'Closed'
          }
        }
      }),
      
      // 3. Average Response Time
      prisma.jiraTicket.aggregate({
        _avg: {
          totalWaitingHours: true
        },
        where: {
          totalWaitingHours: {
            gt: 0
          }
        }
      }),
      
      // 4. Today's Tickets
      prisma.jiraTicket.count({
        where: {
          createDate: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }),
      
      // 5. Priority Distribution
      prisma.jiraTicket.groupBy({
        by: ['priority'],
        _count: {
          priority: true
        },
        orderBy: {
          _count: {
            priority: 'desc'
          }
        }
      }),
      
      // 6. Status Distribution
      prisma.jiraTicket.groupBy({
        by: ['status'],
        _count: {
          status: true
        },
        orderBy: {
          _count: {
            status: 'desc'
          }
        }
      }),
      
      // 7. Top Customers by Activity
      prisma.jiraTicket.groupBy({
        by: ['customer'],
        _count: {
          customer: true
        },
        where: {
          customer: {
            not: null
          }
        },
        orderBy: {
          _count: {
            customer: 'desc'
          }
        },
        take: 10
      }),
      
      // 8. Comments Today
      prisma.comment.count({
        where: {
          created: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      })
    ]);

    // Format the response
    const analytics = {
      totalTickets,
      activeTickets,
      avgResponseTime: Math.round((avgResponseTime._avg.totalWaitingHours || 0) * 10) / 10,
      todayTickets,
      commentsToday,
      priorityDistribution: priorityDistribution.reduce((acc, item) => {
        acc[item.priority] = item._count.priority;
        return acc;
      }, {} as Record<string, number>),
      statusDistribution: statusDistribution.reduce((acc, item) => {
        acc[item.status] = item._count.status;
        return acc;
      }, {} as Record<string, number>),
      topCustomers: topCustomers.map(item => ({
        customer: item.customer || 'Unknown',
        count: item._count.customer
      }))
    };

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Analytics API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}