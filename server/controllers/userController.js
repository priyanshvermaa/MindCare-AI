import User from '../models/User.js';
import { clearAICache, generateWellnessAnalysis, getRecommendedSleepRange, recalculateUserWellnessScores } from '../services/aiService.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// GET /api/user/profile
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const profile = {
      id: user._id,
      name: user.name,
      email: user.email,
      age: user.age !== undefined && user.age !== null ? user.age : null,
      recommendedSleep: user.recommendedSleep || '',
      profileCompleted: user.profileCompleted || false,
      onboardingCompleted: user.onboardingCompleted || false,
      height: user.height !== undefined && user.height !== null ? user.height : null,
      weight: user.weight !== undefined && user.weight !== null ? user.weight : null,
      activityLevel: user.activityLevel || '',
      wellnessGoal: user.wellnessGoal || '',
      profilePicture: user.profilePicture || user.avatar || '',
      avatar: user.avatar || ''
    };

    if (!user.onboardingCompleted && (user.age === null || user.age === undefined)) {
      profile.onboardingRequired = true;
    }

    res.status(200).json({
      success: true,
      profile
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH /api/user/profile
export const updateUserProfile = async (req, res) => {
  const { age, height, weight, activityLevel, wellnessGoal } = req.body;

  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    let ageChanged = false;

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

    if (height !== undefined) {
      const parsedHeight = parseFloat(height);
      if (height !== null && (isNaN(parsedHeight) || parsedHeight <= 0)) {
        return res.status(400).json({ message: 'Please provide a valid height.' });
      }
      user.height = height === null ? null : parsedHeight;
    }

    if (weight !== undefined) {
      const parsedWeight = parseFloat(weight);
      if (weight !== null && (isNaN(parsedWeight) || parsedWeight <= 0)) {
        return res.status(400).json({ message: 'Please provide a valid weight.' });
      }
      user.weight = weight === null ? null : parsedWeight;
    }

    if (activityLevel !== undefined) {
      user.activityLevel = activityLevel || '';
    }

    if (wellnessGoal !== undefined) {
      user.wellnessGoal = wellnessGoal || '';
    }

    await user.save();

    if (ageChanged) {
      // Clear cache and regenerate sleep rating, score, wellness insights, and save to MongoDB
      clearAICache(user._id);
      await recalculateUserWellnessScores(user._id, user.age);
      try {
        await generateWellnessAnalysis(user._id);
      } catch (aiErr) {
        console.error('[USER PROFILE API] Acknowledged wellness insights generation failure:', aiErr.message);
      }
    }

    const profile = {
      id: user._id,
      name: user.name,
      email: user.email,
      age: user.age,
      recommendedSleep: user.recommendedSleep,
      profileCompleted: user.profileCompleted,
      onboardingCompleted: user.onboardingCompleted,
      height: user.height,
      weight: user.weight,
      activityLevel: user.activityLevel,
      wellnessGoal: user.wellnessGoal,
      profilePicture: user.profilePicture || user.avatar || '',
      avatar: user.avatar || ''
    };

    if (!user.onboardingCompleted && (user.age === null || user.age === undefined)) {
      profile.onboardingRequired = true;
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully!',
      profile
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/users/profile-picture
export const uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a file.' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Delete old profile picture if stored locally
    if (user.profilePicture && user.profilePicture.startsWith('/uploads/')) {
      const oldPath = path.join(__dirname, '..', user.profilePicture);
      if (fs.existsSync(oldPath)) {
        try {
          fs.unlinkSync(oldPath);
        } catch (err) {
          console.warn('Failed to delete old profile picture:', err);
        }
      }
    }

    const filePath = `/uploads/${req.file.filename}`;
    user.profilePicture = filePath;
    user.avatar = filePath;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile picture updated successfully!',
      user: {
        _id: user._id,
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture,
        avatar: user.avatar
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/users
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ isDeleted: { $ne: true } }).select('_id name email role profilePicture avatar');
    res.status(200).json({
      success: true,
      users: users.map(u => ({
        _id: u._id,
        id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        profilePicture: u.profilePicture || u.avatar || '',
        avatar: u.avatar || ''
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
