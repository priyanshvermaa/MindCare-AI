import mongoose from 'mongoose';
import User from './models/User.js';

const MONGODB_URI = 'mongodb://127.0.0.1:27017/mindcare';

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log('MongoDB connected.');

  const email = 'direct.user@company.com';
  const user = await User.findOne({ email });

  if (user) {
    user.role = 'admin';
    user.password = 'password123';
    await user.save();
    console.log(`Successfully updated ${email} to admin role with password: password123.`);
  } else {
    console.log(`User ${email} not found.`);
  }

  await mongoose.disconnect();
}

main().catch(err => console.error(err));
