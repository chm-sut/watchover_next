const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixCOS1917Time() {
  try {
    console.log('🔧 Fixing COS-1917 with correct 9:02 AM waiting time');
    
    // Calculate 9:02 AM today in Bangkok timezone (GMT+7)
    const today = new Date();
    const bangkokTime = new Date(today.toLocaleString("en-US", {timeZone: "Asia/Bangkok"}));
    
    // Set to 9:02 AM Bangkok time
    const waitingTime = new Date();
    waitingTime.setHours(9, 2, 0, 0); // 9:02:00 AM
    
    // Convert to UTC (Bangkok is GMT+7, so subtract 7 hours)
    const waitingTimeUTC = new Date(waitingTime.getTime() - (7 * 60 * 60 * 1000));
    
    console.log(`🕘 Setting waiting start time to: ${waitingTimeUTC.toISOString()} (UTC)`);
    console.log(`🕘 Which is 9:02 AM Bangkok time`);
    
    const currentTime = new Date();
    const expectedDuration = (currentTime.getTime() - waitingTimeUTC.getTime()) / (1000 * 60 * 60);
    console.log(`📊 Expected waiting duration: ${expectedDuration.toFixed(2)} hours`);
    
    await prisma.jiraTicket.update({
      where: { ticketId: 'COS-1917' },
      data: {
        waitingStartTime: waitingTimeUTC
      }
    });
    
    console.log('✅ Fixed: COS-1917 waiting time set to 9:02 AM Bangkok time');
    
  } catch (error) {
    console.error('❌ Error fixing ticket:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixCOS1917Time();