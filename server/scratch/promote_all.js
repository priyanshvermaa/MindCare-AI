import mongoose from 'mongoose';
import User from '../models/User.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mindcare';

async function updateAll() {
  try {
    await mongoose.connect(MONGODB_URI);
    
    // Promote any user with email containing 'pv811' or starting with 'pv'
    const result = await User.updateMany(
      { email: { $regex: /^pv/i } },
      { $set: { role: 'admin' } }
    );
    
    console.log(`✅ Promoted ${result.modifiedCount} users starting with 'pv' to admin!`);
    
    const users = await User.find();
    console.log('👤 All Users in DB now:');
    users.forEach(u => {
      console.log(`- Name: ${u.name} | Email: ${u.email} | Role: ${u.role}`);
    });
    
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

updateAll();
