const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('🔍 Checking database records...');
    
    const customerCount = await prisma.customer.count();
    console.log(`📊 Customers: ${customerCount}`);
    
    const ticketCount = await prisma.jiraTicket.count();
    console.log(`🎫 JIRA Tickets: ${ticketCount}`);
    
    const escalationCount = await prisma.escalation.count();
    console.log(`⏰ Escalations: ${escalationCount}`);
    
    // Show sample records
    if (customerCount > 0) {
      const customers = await prisma.customer.findMany({ take: 5 });
      console.log('\n📋 Sample customers:');
      customers.forEach(c => console.log(`  - ${c.objectId}: ${c.name}`));
    }
    
    if (ticketCount > 0) {
      const tickets = await prisma.jiraTicket.findMany({ 
        take: 3,
        include: { escalations: true }
      });
      console.log('\n🎫 Sample tickets:');
      tickets.forEach(t => {
        console.log(`  - ${t.ticketId}: ${t.summary}`);
        console.log(`    Customer: ${t.customer}`);
        console.log(`    Escalations: ${t.escalations.length}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error checking database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();