import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const connString = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mindcare';

const collectionsToClear = [
  'comments',
  'conversations',
  'emergencycontacts',
  'goals',
  'habits',
  'journalentries',
  'moods',
  'notifications',
  'posts',
  'reports',
  'systemlogs',
  'wellnessprofiles',
  'wellnessstats',
  'moodlogs'
];

async function resetDatabase() {
  console.log('⚡ Starting database reset script...');
  console.log(`📡 Connecting to MongoDB: ${connString}`);
  
  try {
    await mongoose.connect(connString);
    console.log('✅ Connected to MongoDB successfully.');

    const db = mongoose.connection.db;
    const existingCollections = (await db.listCollections().toArray()).map(c => c.name);
    
    for (const colName of collectionsToClear) {
      if (existingCollections.includes(colName)) {
        console.log(`🧹 Clearing collection: "${colName}"...`);
        await db.collection(colName).deleteMany({});
        console.log(`  └─ Done clearing "${colName}"`);
      } else {
        console.log(`⚠️ Collection "${colName}" does not exist in database, skipping.`);
      }
    }

    console.log('\n🌟 All user-generated collections have been successfully cleared!');
    console.log('🎉 Reset complete. User accounts, roles, and seeded resources are preserved.');
  } catch (err) {
    console.error('❌ Error executing database reset:', err);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB.');
    process.exit(0);
  }
}

resetDatabase();
