import mongoose from 'mongoose';
import User from '../models/User.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mindcare';

async function check() {
  try {
    await mongoose.connect(MONGODB_URI);
    const users = await User.find();
    console.log(`👤 Total registered users in MongoDB: ${users.length}`);
    users.forEach(u => {
      console.log(`- ID: ${u._id} | Name: ${u.name} | Email: ${u.email} | Role: ${u.role}`);
    });
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

check();
