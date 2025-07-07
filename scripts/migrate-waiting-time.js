const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function calculateWaitingTimeFromHistory(ticketId) {
  try {
    // Get all status history for this ticket
    const statusHistory = await prisma.statusHistory.findMany({
      where: { ticketId },
      orderBy: { changedAt: 'asc' }
    });

    if (statusHistory.length === 0) {
      return { totalWaitingHours: 0, waitingStartTime: null };
    }

    let totalWaitingHours = 0;
    let waitingStartTime = null;

    // Process each status change
    for (const change of statusHistory) {
      if (change.toStatus === 'Waiting') {
        // Start counting waiting time
        waitingStartTime = change.changedAt;
      } else if (waitingStartTime && change.fromStatus === 'Waiting') {
        // Stop counting waiting time
        const waitingDuration = (change.changedAt.getTime() - waitingStartTime.getTime()) / (1000 * 60 * 60);
        totalWaitingHours += waitingDuration;
        waitingStartTime = null;
      }
    }

    // If currently in waiting status, keep the waiting start time
    // (don't add current duration to total, it will be calculated dynamically)

    return { 
      totalWaitingHours: Math.round(totalWaitingHours * 100) / 100, // Round to 2 decimal places
      waitingStartTime 
    };
  } catch (error) {
    console.error(`Error calculating waiting time for ticket ${ticketId}:`, error);
    return { totalWaitingHours: 0, waitingStartTime: null };
  }
}

async function migrateWaitingTimes() {
  try {
    console.log('🚀 Starting waiting time migration...');
    
    // Get all tickets
    const tickets = await prisma.jiraTicket.findMany({
      select: { ticketId: true, status: true }
    });

    console.log(`📊 Found ${tickets.length} tickets to migrate`);

    let processed = 0;
    let updated = 0;

    for (const ticket of tickets) {
      const { totalWaitingHours, waitingStartTime } = await calculateWaitingTimeFromHistory(ticket.ticketId);
      
      // Only update if there's waiting time or currently waiting
      if (totalWaitingHours > 0 || (ticket.status === 'Waiting' && waitingStartTime)) {
        await prisma.jiraTicket.update({
          where: { ticketId: ticket.ticketId },
          data: {
            totalWaitingHours,
            waitingStartTime: ticket.status === 'Waiting' ? waitingStartTime : null
          }
        });
        
        updated++;
        console.log(`✅ Updated ${ticket.ticketId}: ${totalWaitingHours}h waiting time${ticket.status === 'Waiting' ? ' (currently waiting)' : ''}`);
      }
      
      processed++;
      if (processed % 50 === 0) {
        console.log(`⏳ Processed ${processed}/${tickets.length} tickets...`);
      }
    }

    console.log(`🎉 Migration completed!`);
    console.log(`📈 Processed: ${processed} tickets`);
    console.log(`📝 Updated: ${updated} tickets with waiting time`);
    console.log(`⏭️  Skipped: ${processed - updated} tickets (no waiting time)`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
if (require.main === module) {
  migrateWaitingTimes();
}

module.exports = { migrateWaitingTimes };