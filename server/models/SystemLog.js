import mongoose from 'mongoose';

const systemLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  action: {
    type: String,
    required: true
  },
  details: {
    type: String,
    required: true
  },
  ipAddress: String,
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const SystemLog = mongoose.model('SystemLog', systemLogSchema);
export default SystemLog;
