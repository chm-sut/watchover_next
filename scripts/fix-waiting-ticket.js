const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixWaitingTicket(ticketId) {
  try {
    console.log(`🔧 Fixing waiting status for ticket: ${ticketId}`);
    
    // Find the ticket
    const ticket = await prisma.jiraTicket.findUnique({
      where: { ticketId },
      include: { statusHistory: true }
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
      console.log('🔄 Setting waitingStartTime to current time...');
      
      await prisma.jiraTicket.update({
        where: { ticketId },
        data: {
          waitingStartTime: new Date()
        }
      });
      
      console.log('✅ Fixed: waitingStartTime set to current time');
    }
    
    // If ticket is NOT in Waiting status but waitingStartTime is set
    else if (ticket.status !== 'Waiting' && ticket.waitingStartTime) {
      console.log('🔄 Ending waiting period and calculating duration...');
      
      const waitingDuration = (new Date().getTime() - ticket.waitingStartTime.getTime()) / (1000 * 60 * 60);
      const newTotalWaitingHours = ticket.totalWaitingHours + waitingDuration;
      
      await prisma.jiraTicket.update({
        where: { ticketId },
        data: {
          totalWaitingHours: newTotalWaitingHours,
          waitingStartTime: null
        }
      });
      
      console.log(`✅ Fixed: Added ${waitingDuration.toFixed(2)} hours to total waiting time`);
      console.log(`📊 New total waiting time: ${newTotalWaitingHours.toFixed(2)} hours`);
    }
    
    // If everything looks correct
    else {
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
  console.log('Usage: node fix-waiting-ticket.js <TICKET_ID>');
  console.log('Example: node fix-waiting-ticket.js COS-1917');
  process.exit(1);
}

fixWaitingTicket(ticketId);