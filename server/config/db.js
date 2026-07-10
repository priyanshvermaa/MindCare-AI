import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const connString = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mindcare';
    
    const conn = await mongoose.connect(connString, {
      serverSelectionTimeoutMS: 5000,
    });
    
    console.log(`📡 MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ Database connection failure:', error.stack || error);
  }
};

export default connectDB;
