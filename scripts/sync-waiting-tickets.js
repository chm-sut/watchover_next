const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function syncAllWaitingTickets() {
  try {
    console.log('🔄 Syncing all waiting tickets...');
    
    // Find all tickets with status 'Waiting' but no waitingStartTime
    const ticketsNeedingFix = await prisma.jiraTicket.findMany({
      where: {
        status: 'Waiting',
        waitingStartTime: null
      }
    });
    
    console.log(`📋 Found ${ticketsNeedingFix.length} tickets in Waiting status without waitingStartTime`);
    
    for (const ticket of ticketsNeedingFix) {
      console.log(`🔧 Fixing ticket: ${ticket.ticketId}`);
      
      await prisma.jiraTicket.update({
        where: { ticketId: ticket.ticketId },
        data: {
          waitingStartTime: new Date()
        }
      });
      
      console.log(`✅ Set waitingStartTime for ${ticket.ticketId}`);
    }
    
    // Find all tickets NOT in waiting but have waitingStartTime set
    const ticketsToFinish = await prisma.jiraTicket.findMany({
      where: {
        status: { not: 'Waiting' },
        waitingStartTime: { not: null }
      }
    });
    
    console.log(`📋 Found ${ticketsToFinish.length} tickets not in Waiting status but with waitingStartTime set`);
    
    for (const ticket of ticketsToFinish) {
      console.log(`🔧 Finishing waiting period for ticket: ${ticket.ticketId}`);
      
      const waitingDuration = (new Date().getTime() - ticket.waitingStartTime.getTime()) / (1000 * 60 * 60);
      const newTotalWaitingHours = ticket.totalWaitingHours + waitingDuration;
      
      await prisma.jiraTicket.update({
        where: { ticketId: ticket.ticketId },
        data: {
          totalWaitingHours: newTotalWaitingHours,
          waitingStartTime: null
        }
      });
      
      console.log(`✅ Added ${waitingDuration.toFixed(2)} hours to ${ticket.ticketId}, total: ${newTotalWaitingHours.toFixed(2)} hours`);
    }
    
    console.log('✅ Sync completed!');
    
  } catch (error) {
    console.error('❌ Error syncing tickets:', error);
  } finally {
    await prisma.$disconnect();
  }
}

syncAllWaitingTickets();