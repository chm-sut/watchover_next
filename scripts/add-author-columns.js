const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addAuthorColumns() {
  try {
    console.log('🔧 Adding author columns to status_history table...');
    
    // Check if columns already exist to avoid errors
    const result = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'status_history' 
      AND table_schema = 'public'
      AND column_name IN ('authorName', 'authorEmail');
    `;
    
    if (result.length === 0) {
      // Add columns safely
      await prisma.$executeRaw`
        ALTER TABLE status_history 
        ADD COLUMN "authorName" TEXT,
        ADD COLUMN "authorEmail" TEXT;
      `;
      console.log('✅ Successfully added authorName and authorEmail columns');
    } else {
      console.log('ℹ️ Author columns already exist, skipping...');
    }
    
  } catch (error) {
    console.error('❌ Error adding author columns:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addAuthorColumns();