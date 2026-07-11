import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from '../config/db.js';
import { seedInitialData } from '../utils/seeder.js';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const run = async () => {
  console.log('Starting custom seeder script...');
  await connectDB();
  await seedInitialData(true);
  console.log('Seeder script execution complete. Closing connection...');
  await mongoose.connection.close();
  console.log('Done!');
  process.exit(0);
};

run().catch((err) => {
  console.error('Fatal error during seed run:', err);
  process.exit(1);
});
