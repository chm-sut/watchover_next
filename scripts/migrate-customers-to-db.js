#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function migrateCustomersToDatabase() {
  try {
    console.log('🚀 Starting customer migration from JSON to database...');
    
    // Read existing customer map
    const customerMapPath = path.resolve('./public/data/customerMap.json');
    
    if (!fs.existsSync(customerMapPath)) {
      console.log('❌ Customer map file not found');
      return;
    }
    
    const customerMapData = fs.readFileSync(customerMapPath, 'utf-8');
    const customerMap = JSON.parse(customerMapData);
    
    console.log(`📖 Found ${Object.keys(customerMap).length} customers in JSON file`);
    
    // Check if we already have customers in database
    const existingCount = await prisma.customer.count();
    if (existingCount > 0) {
      console.log(`⚠️ Database already contains ${existingCount} customers`);
      console.log('Do you want to continue? This will skip existing customers.');
    }
    
    let migratedCount = 0;
    let skippedCount = 0;
    
    for (const [objectId, name] of Object.entries(customerMap)) {
      try {
        // Try to create customer, skip if already exists
        await prisma.customer.upsert({
          where: { objectId },
          update: { 
            name,
            updatedAt: new Date()
          },
          create: {
            objectId,
            name,
            objectKey: `CD-${objectId}` // Assume standard format
          }
        });
        
        migratedCount++;
        
        if (migratedCount % 50 === 0) {
          console.log(`📈 Migrated ${migratedCount} customers...`);
        }
        
      } catch (error) {
        console.error(`❌ Failed to migrate customer ${objectId}: ${error.message}`);
        skippedCount++;
      }
    }
    
    console.log('✅ Migration completed!');
    console.log(`📊 Results:`);
    console.log(`   - Migrated: ${migratedCount}`);
    console.log(`   - Skipped: ${skippedCount}`);
    console.log(`   - Total in DB: ${await prisma.customer.count()}`);
    
    // Create backup of JSON file
    const backupPath = `${customerMapPath}.backup.${Date.now()}`;
    fs.copyFileSync(customerMapPath, backupPath);
    console.log(`💾 Backup created: ${backupPath}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
if (require.main === module) {
  migrateCustomersToDatabase()
    .then(() => {
      console.log('🎉 Customer migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateCustomersToDatabase };