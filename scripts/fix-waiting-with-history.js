const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixWaitingTicketWithHistory(ticketId) {
  try {
    console.log(`🔧 Fixing waiting status for ticket: ${ticketId} using status history`);
    
    // Find the ticket with status history
    const ticket = await prisma.jiraTicket.findUnique({
      where: { ticketId },
      include: { 
        statusHistory: {
          orderBy: { changedAt: 'desc' }
        }
      }
    });
    
    if (!ticket) {
      console.log(`❌ Ticket ${ticketId} not found`);
      return;
    }
    
    console.log(`📋 Current status: ${ticket.status}`);
    console.log(`⏰ Current waitingStartTime: ${ticket.waitingStartTime}`);
    console.log(`📊 Current totalWaitingHours: ${ticket.totalWaitingHours}`);
    
    // If ticket is in Waiting status but waitingStartTime is not set
    if (ticket.status === 'Waiting' && !ticket.waitingStartTime) {
      // Find when the ticket last changed TO "Waiting" status
      const waitingHistory = ticket.statusHistory.find(h => h.toStatus === 'Waiting');
      
      if (waitingHistory) {
        console.log(`🔍 Found status change to Waiting at: ${waitingHistory.changedAt}`);
        
        await prisma.jiraTicket.update({
          where: { ticketId },
          data: {
            waitingStartTime: waitingHistory.changedAt
          }
        });
        
        const waitingDuration = (new Date().getTime() - waitingHistory.changedAt.getTime()) / (1000 * 60 * 60);
        console.log(`✅ Fixed: waitingStartTime set to ${waitingHistory.changedAt}`);
        console.log(`📊 Current waiting duration: ${waitingDuration.toFixed(2)} hours`);
      } else {
        console.log('⚠️ No status history found for Waiting status, using current time');
        
        await prisma.jiraTicket.update({
          where: { ticketId },
          data: {
            waitingStartTime: new Date()
          }
        });
        
        console.log('✅ Fixed: waitingStartTime set to current time');
      }
    } else {
      console.log('✅ Ticket waiting status appears to be correct');
    }
    
  } catch (error) {
    console.error('❌ Error fixing ticket:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
const ticketId = process.argv[2];
if (!ticketId) {
  console.log('Usage: node fix-waiting-with-history.js <TICKET_ID>');
  console.log('Example: node fix-waiting-with-history.js COS-1917');
  process.exit(1);
}

fixWaitingTicketWithHistory(ticketId);