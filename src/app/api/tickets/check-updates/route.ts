import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Get the most recent update timestamp from the database
    const latestTicket = await prisma.ticket.findFirst({
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