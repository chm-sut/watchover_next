const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkRenderedBody() {
  try {
    console.log('🔍 Checking for comments with different renderedBody...');
    
    // Get comments where renderedBody is different from body (indicating rich content)
    const comments = await prisma.comment.findMany({
      where: {
        NOT: {
          renderedBody: { equals: prisma.comment.fields.body }
        }
      },
      take: 10,
      orderBy: { created: 'desc' }
    });
    
    console.log(`📋 Found ${comments.length} comments with different renderedBody`);
    
    if (comments.length === 0) {
      console.log('⚠️ No comments found with different rendered content');
      console.log('This might mean:');
      console.log('1. No comments in JIRA have images/rich formatting');
      console.log('2. The renderedBody field is identical to body');
      console.log('3. The sync might not be getting the rendered content properly');
      
      // Let's check a few random comments to see their structure
      console.log('\n📝 Checking some random comments...');
      const randomComments = await prisma.comment.findMany({
        take: 5,
        orderBy: { created: 'desc' }
      });
      
      randomComments.forEach((comment, index) => {
        console.log(`\n--- Random Comment ${index + 1} ---`);
        console.log(`Ticket: ${comment.ticketId}`);
        console.log(`Body: ${comment.body.substring(0, 100)}...`);
        console.log(`RenderedBody: ${comment.renderedBody?.substring(0, 100)}...`);
        console.log(`Same content: ${comment.body === comment.renderedBody}`);
      });
    } else {
      comments.forEach((comment, index) => {
        console.log(`\n--- Comment ${index + 1} with Rich Content ---`);
        console.log(`Ticket: ${comment.ticketId}`);
        console.log(`Author: ${comment.authorName}`);
        console.log(`Body: ${comment.body}`);
        console.log(`RenderedBody: ${comment.renderedBody}`);
        
        // Check for image indicators
        const hasImages = comment.renderedBody?.includes('<img') || 
                          comment.renderedBody?.includes('attachment') ||
                          comment.renderedBody?.includes('<p>');
        
        if (hasImages) {
          console.log('🖼️ This comment likely contains rich content/images!');
        }
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRenderedBody();