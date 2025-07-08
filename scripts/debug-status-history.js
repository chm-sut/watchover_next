const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugStatusHistory() {
  try {
    console.log('🔍 Checking status history data...');
    
    // Get status history for COS-1780
    const statusHistory = await prisma.statusHistory.findMany({
      where: { ticketId: 'COS-1780' },
      orderBy: { changedAt: 'asc' }
    });
    
    console.log('Status history for COS-1780:');
    statusHistory.forEach((history, index) => {
      console.log(`${index + 1}. ${history.fromStatus || 'NULL'} → ${history.toStatus}`);
      console.log(`   Author: ${history.authorName || 'NULL'} (${history.authorEmail || 'NULL'})`);
      console.log(`   Date: ${history.changedAt}`);
      console.log('');
    });
    
    // Also check ticket data
    const ticket = await prisma.jiraTicket.findUnique({
      where: { ticketId: 'COS-1780' },
      select: { 
        assignee: true, 
        reporter: true,
        status: true
      }
    });
    
    console.log('Ticket data for COS-1780:');
    console.log('Assignee:', ticket?.assignee);
    console.log('Reporter:', ticket?.reporter);
    console.log('Current Status:', ticket?.status);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugStatusHistory();