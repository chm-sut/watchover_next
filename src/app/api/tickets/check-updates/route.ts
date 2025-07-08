import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Get the most recent update timestamp from the database
    const latestTicket = await prisma.jiraTicket.findFirst({
      orderBy: {
        updatedAt: 'desc'
      },
      select: {
        updatedAt: true
      }
    });

    if (!latestTicket) {
      return NextResponse.json({ 
        lastUpdated: null,
        hasUpdates: false 
      });
    }

    return NextResponse.json({ 
      lastUpdated: latestTicket.updatedAt.toISOString(),
      hasUpdates: true 
    });
  } catch (error) {
    console.error('Error checking for updates:', error);
    return NextResponse.json(
      { error: 'Failed to check for updates' },
      { status: 500 }
    );
  }
}