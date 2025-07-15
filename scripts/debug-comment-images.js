const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugCommentImages() {
  try {
    console.log('🔍 Looking for comments with images...');
    
    // Find comments that might have images
    const comments = await prisma.comment.findMany({
      where: {
        OR: [
          { renderedBody: { contains: '<img' } },
          { renderedBody: { contains: 'attachment' } },
          { body: { contains: 'image' } },
          { body: { contains: 'screenshot' } },
          { body: { contains: 'attachment' } }
        ]
      },
      take: 5
    });
    
    console.log(`📋 Found ${comments.length} comments with potential images`);
    
    comments.forEach((comment, index) => {
      console.log(`\n--- Comment ${index + 1} ---`);
      console.log(`ID: ${comment.id}`);
      console.log(`Ticket: ${comment.ticketCode}`);
      console.log(`Author: ${comment.authorName}`);
      console.log(`Body: ${comment.body.substring(0, 200)}...`);
      console.log(`RenderedBody: ${comment.renderedBody?.substring(0, 500)}...`);
      
      // Look for image tags
      const imgMatches = comment.renderedBody?.match(/<img[^>]*src="([^"]*)"[^>]*>/g);
      if (imgMatches) {
        console.log('🖼️ Found images:');
        imgMatches.forEach((img, i) => {
          const srcMatch = img.match(/src="([^"]*)"/);
          if (srcMatch) {
            console.log(`  ${i + 1}. ${srcMatch[1]}`);
          }
        });
      }
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugCommentImages();