import UserSettings from '../models/UserSettings.js';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import { generateToken } from './authController.js';
import { getRecommendedSleepRange, clearAICache, generateWellnessAnalysis, recalculateUserWellnessScores } from '../services/aiService.js';

// Get settings for logged in user
export const getSettings = async (req, res) => {
  try {
    let settings = await UserSettings.findOne({ user: req.user._id });
    if (!settings) {
      settings = await UserSettings.create({ user: req.user._id });
    }
    
    const user = await User.findById(req.user._id);
    
    res.status(200).json({
      success: true,
      settings: {
        username: user.username || '',
        phoneNumber: user.phoneNumber || '',
        name: user.name,
        email: user.email,
        avatar: user.avatar || '',
        profilePicture: user.profilePicture || user.avatar || '',
        age: user.age || null,
        notifications: settings.notifications,
        appearance: settings.appearance
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update settings for logged in user
export const updateSettings = async (req, res) => {
  const {
    name,
    email,
    username,
    phoneNumber,
    avatar,
    profilePicture,
    age,
    notifications,
    appearance
  } = req.body;

  try {
    const user = await User.findById(req.user._id);
    if (name) user.name = name;
    if (email) {
      if (email !== user.email) {
        const emailExists = await User.findOne({ email });
        if (emailExists) {
          return res.status(400).json({ message: 'Email address already in use.' });
        }
        user.email = email;
      }
    }
    if (username !== undefined) user.username = username;
    if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;
    let ageChanged = false;
    if (avatar !== undefined) {
      user.avatar = avatar;
      user.profilePicture = avatar;
    }
    if (profilePicture !== undefined) {
      user.profilePicture = profilePicture;
      user.avatar = profilePicture;
    }
    if (age !== undefined) {
      const parsedAge = parseInt(age, 10);
      if (isNaN(parsedAge) || parsedAge < 1 || parsedAge > 120) {
        return res.status(400).json({ message: 'Please provide a valid age between 1 and 120.' });
      }
      if (user.age !== parsedAge) {
        user.age = parsedAge;
        ageChanged = true;
      }
      user.profileCompleted = true;
      user.onboardingCompleted = true;

      // Recalculate sleep recommendations
      const range = getRecommendedSleepRange(parsedAge);
      user.recommendedSleep = range.label;
    }
    await user.save();

    if (ageChanged) {
      clearAICache(user._id);
      await recalculateUserWellnessScores(user._id, user.age);
      try {
        await generateWellnessAnalysis(user._id);
      } catch (aiErr) {
        console.error('[SETTINGS API] Acknowledged wellness insights generation failure:', aiErr.message);
      }
    }

    let settings = await UserSettings.findOne({ user: req.user._id });
    if (!settings) {
      settings = new UserSettings({ user: req.user._id });
    }

    if (notifications) settings.notifications = { ...settings.notifications, ...notifications };
    if (appearance) settings.appearance = { ...settings.appearance, ...appearance };
    await settings.save();

    res.status(200).json({
      success: true,
      message: 'Settings successfully updated!',
      settings: {
        username: user.username,
        phoneNumber: user.phoneNumber,
        name: user.name,
        email: user.email,
        avatar: user.avatar || '',
        profilePicture: user.profilePicture || user.avatar || '',
        age: user.age,
        notifications: settings.notifications,
        appearance: settings.appearance
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Change Password setting
export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  try {
    const user = await User.findById(req.user._id).select('+password');
    
    if (user.authMethod !== 'local') {
      return res.status(400).json({ message: `Password management is not available for ${user.authMethod} authenticated accounts.` });
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password incorrect.' });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully!'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete user account
export const deleteAccount = async (req, res) => {
  try {
    const userId = req.user._id;

    await UserSettings.deleteOne({ user: userId });
    await User.findByIdAndDelete(userId);

    res.status(200).json({
      success: true,
      message: 'Account deleted successfully.'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

