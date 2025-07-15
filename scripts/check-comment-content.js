const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkCommentContent() {
  try {
    console.log('🔍 Checking comment content for images...');
    
    // Get a few recent comments to see what they contain
    const comments = await prisma.comment.findMany({
      take: 10,
      orderBy: { created: 'desc' }
    });
    
    console.log(`📋 Found ${comments.length} recent comments`);
    
    comments.forEach((comment, index) => {
      console.log(`\n--- Comment ${index + 1} ---`);
      console.log(`Ticket: ${comment.ticketId}`);
      console.log(`Author: ${comment.authorName}`);
      console.log(`Created: ${comment.created}`);
      console.log(`Body length: ${comment.body.length} characters`);
      console.log(`Body content:`);
      console.log(comment.body);
      console.log(`--- End Comment ${index + 1} ---`);
      
      // Look for common image indicators
      const indicators = [
        'attachment',
        'image',
        'screenshot',
        'png',
        'jpg',
        'jpeg',
        'gif',
        '<img',
        '[image',
        'secure/attachment',
        '!image',
        '{{',
        'thumbnail'
      ];
      
      const foundIndicators = indicators.filter(indicator => 
        comment.body.toLowerCase().includes(indicator.toLowerCase())
      );
      
      if (foundIndicators.length > 0) {
        console.log(`🖼️ Possible image indicators found: ${foundIndicators.join(', ')}`);
      }
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCommentContent();