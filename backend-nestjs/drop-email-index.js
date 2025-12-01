/**
 * Migration Script: Drop email unique index from profiles collection
 * 
 * This script removes the unique constraint on the email field in the profiles collection.
 * This is necessary because we now allow multiple profiles per user (same email).
 * 
 * Run this script once to migrate your database:
 * node drop-email-index.js
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

async function dropEmailIndex() {
    const uri = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_DB_NAME || 'RetirementApp';

    if (!uri) {
        console.error('❌ MONGODB_URI not found in .env file');
        process.exit(1);
    }

    const client = new MongoClient(uri);

    try {
        console.log('🔌 Connecting to MongoDB...');
        await client.connect();
        console.log('✅ Connected to MongoDB');

        const db = client.db(dbName);
        const collection = db.collection('profiles');

        // List existing indexes
        console.log('\n📋 Current indexes on profiles collection:');
        const indexes = await collection.indexes();
        indexes.forEach(index => {
            console.log(`  - ${index.name}:`, JSON.stringify(index.key));
        });

        // Check if email_1 index exists
        const emailIndexExists = indexes.some(index => index.name === 'email_1');

        if (emailIndexExists) {
            console.log('\n🗑️  Dropping email_1 unique index...');
            await collection.dropIndex('email_1');
            console.log('✅ Successfully dropped email_1 index');
        } else {
            console.log('\n✅ email_1 index does not exist (already removed or never created)');
        }

        // List indexes after drop
        console.log('\n📋 Indexes after migration:');
        const indexesAfter = await collection.indexes();
        indexesAfter.forEach(index => {
            console.log(`  - ${index.name}:`, JSON.stringify(index.key));
        });

        console.log('\n✅ Migration completed successfully!');
    } catch (error) {
        console.error('\n❌ Migration failed:', error.message);
        process.exit(1);
    } finally {
        await client.close();
        console.log('🔌 Disconnected from MongoDB');
    }
}

dropEmailIndex();
