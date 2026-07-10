import mongoose from 'mongoose';

const adminSettingsSchema = new mongoose.Schema({
  systemName: { 
    type: String, 
    default: 'MindCare AI' 
  },
  maintenanceMode: { 
    type: Boolean, 
    default: false 
  },
  allowRegistrations: { 
    type: Boolean, 
    default: true 
  },
  aiSettings: {
    model: { type: String, default: 'grok-beta' },
    temperature: { type: Number, default: 0.7 },
    maxTokens: { type: Number, default: 1024 }
  },
  emailSettings: {
    smtpHost: { type: String, default: '' },
    smtpPort: { type: Number, default: 587 },
    senderEmail: { type: String, default: 'no-reply@mindcare.ai' }
  },
  security: {
    passwordMinLength: { type: Number, default: 8 },
    mfaRequired: { type: Boolean, default: false },
    sessionTimeout: { type: Number, default: 30 } // in minutes
  },
  roles: {
    allowedRoles: { type: [String], default: ['user', 'admin'] }
  }
}, { timestamps: true });

const AdminSettings = mongoose.model('AdminSettings', adminSettingsSchema);
export default AdminSettings;
