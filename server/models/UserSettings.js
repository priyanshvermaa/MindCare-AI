import mongoose from 'mongoose';

const userSettingsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  notifications: {
    emailNotifications: { type: Boolean, default: true },
    moodReminder: { type: Boolean, default: true },
    journalReminder: { type: Boolean, default: true },
    habitReminder: { type: Boolean, default: true },
    pushNotifications: { type: Boolean, default: true },
    communityNotifications: { type: Boolean, default: true }
  },
  appearance: {
    theme: { type: String, enum: ['light', 'dark', 'system'], default: 'dark' },
    accentColor: { type: String, default: '#14b8a6' },
    fontSize: { type: String, enum: ['small', 'medium', 'large'], default: 'medium' }
  }
}, { timestamps: true });

const UserSettings = mongoose.model('UserSettings', userSettingsSchema);
export default UserSettings;
