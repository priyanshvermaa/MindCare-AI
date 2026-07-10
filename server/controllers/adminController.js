import User from '../models/User.js';
import Mood from '../models/Mood.js';
import JournalEntry from '../models/JournalEntry.js';
import DailyWaterSummary from '../models/DailyWaterSummary.js';
import WaterLog from '../models/WaterLog.js';
import MeditationHistory from '../models/MeditationHistory.js';
import UserMeditation from '../models/UserMeditation.js';
import Habit from '../models/Habit.js';
import Goal from '../models/Goal.js';
import WellnessStats from '../models/WellnessStats.js';
import AIWellness from '../models/AIWellness.js';
import Bookmark from '../models/Bookmark.js';
import ResourceProgress from '../models/ResourceProgress.js';
import Conversation from '../models/Conversation.js';
import SystemLog from '../models/SystemLog.js';
import Report from '../models/Report.js';
import Resource from '../models/Resource.js';
import AdminSettings from '../models/AdminSettings.js';
import mongoose from 'mongoose';

/**
 * @desc    Get dashboard metrics for Admin Console (Matching six cards in reference)
 * @route   GET /api/admin/dashboard
 * @access  Private (Admin only)
 */
export const getAdminDashboard = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ isDeleted: { $ne: true } });
    const totalAdmins = await User.countDocuments({ role: 'admin', isDeleted: { $ne: true } });
    
    // Active Users (within last 24 hours to match instruction "within last 24 hours")
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const activeUsers = await User.countDocuments({
      lastActiveAt: { $gte: oneDayAgo },
      isDeleted: { $ne: true }
    });
    
    // New Users Today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const newUsersToday = await User.countDocuments({
      createdAt: { $gte: startOfToday },
      isDeleted: { $ne: true }
    });

    const totalJournalEntries = await JournalEntry.countDocuments();
    const totalMeditationSessions = await MeditationHistory.countDocuments();

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalAdmins,
        activeUsers,
        newUsersToday,
        totalJournalEntries,
        totalMeditationSessions
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get paginated, searched, sorted, and filtered users directory
 * @route   GET /api/admin/users
 * @access  Private (Admin only)
 */
export const getAdminUsers = async (req, res) => {
  const { search, filter, sortBy, page = 1, limit = 10 } = req.query;

  try {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const matchQuery = {};

    // Search filter
    if (search) {
      matchQuery.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { role: { $regex: search, $options: 'i' } }
      ];
    }

    // Role & Status Dropdown Filters
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    if (filter === 'user' || filter === 'admin') {
      matchQuery.role = filter;
      matchQuery.isDeleted = { $ne: true };
    } else if (filter === 'active') {
      matchQuery.lastActiveAt = { $gte: oneDayAgo };
      matchQuery.isDeleted = { $ne: true };
      matchQuery.isSuspended = { $ne: true };
    } else if (filter === 'inactive') {
      matchQuery.lastActiveAt = { $lt: oneDayAgo };
      matchQuery.isDeleted = { $ne: true };
      matchQuery.isSuspended = { $ne: true };
    } else if (filter === 'blocked') {
      matchQuery.isSuspended = true;
      matchQuery.isDeleted = { $ne: true };
    } else if (filter === 'deleted') {
      matchQuery.isDeleted = true;
    } else {
      matchQuery.isDeleted = { $ne: true };
    }

    // Build aggregation pipeline
    const pipeline = [
      { $match: matchQuery },
      // Lookup journal entries
      {
        $lookup: {
          from: 'journalentries',
          localField: '_id',
          foreignField: 'user',
          as: 'journals'
        }
      },
      // Lookup meditation logs
      {
        $lookup: {
          from: 'meditationhistories',
          localField: '_id',
          foreignField: 'userId',
          as: 'meditations'
        }
      },
      // Calculate sizes
      {
        $addFields: {
          journalsCount: { $size: '$journals' },
          meditationsCount: { $size: '$meditations' }
        }
      }
    ];

    let sortStage = { createdAt: -1 };
    if (sortBy === 'oldest') {
      sortStage = { createdAt: 1 };
    } else if (sortBy === 'mostJournals') {
      sortStage = { journalsCount: -1 };
    } else if (sortBy === 'mostMeditation') {
      sortStage = { meditationsCount: -1 };
    } else if (sortBy === 'mostActive') {
      sortStage = { lastActiveAt: -1 };
    }

    pipeline.push({ $sort: sortStage });

    // Pagination facet
    pipeline.push({
      $facet: {
        metadata: [{ $count: 'total' }],
        data: [{ $skip: skip }, { $limit: limitNum }]
      }
    });

    const result = await User.aggregate(pipeline);
    const users = result[0]?.data || [];
    const total = result[0]?.metadata[0]?.total || 0;

    res.status(200).json({
      success: true,
      users,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
        totalUsers: total
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get detailed user metrics (read-only diagnostics drawer)
 * @route   GET /api/admin/user/:id
 * @access  Private (Admin only)
 */
export const getAdminUserProfile = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const [
      journalsCount,
      moodsCount,
      waterCount,
      meditationCount,
      aiWellness,
      habits,
      goals
    ] = await Promise.all([
      JournalEntry.countDocuments({ user: id }),
      Mood.countDocuments({ userId: id }),
      WaterLog.countDocuments({ userId: id }),
      MeditationHistory.countDocuments({ userId: id }),
      AIWellness.findOne({ userId: id }),
      Habit.find({ userId: id }),
      Goal.find({ userId: id })
    ]);

    res.status(200).json({
      success: true,
      profile: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isSuspended: user.isSuspended,
        isDeleted: user.isDeleted,
        age: user.age || 'Not provided',
        registrationDate: user.createdAt,
        lastLogin: user.lastActiveAt || user.updatedAt,
        wellnessScore: aiWellness ? aiWellness.overallWellnessScore : 'N/A',
        sleepStatus: aiWellness ? aiWellness.sleepStatus : 'N/A',
        hydrationStatus: aiWellness ? aiWellness.hydrationStatus : 'N/A',
        moodStatus: aiWellness ? aiWellness.moodStatus : 'N/A',
        aiWellnessSummary: aiWellness ? aiWellness.aiWellnessSummary : 'No wellness summary generated yet.',
        journalsCount,
        moodsCount,
        waterCount,
        meditationCount,
        habitsCount: habits.length,
        goalsCount: goals.length,
        height: user.height || 'N/A',
        weight: user.weight || 'N/A',
        activityLevel: user.activityLevel || 'N/A',
        wellnessGoal: user.wellnessGoal || 'N/A'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Update user profile or role/status from Admin Dashboard
 * @route   PATCH /api/admin/user/:id
 * @access  Private (Admin only)
 */
export const updateAdminUserProfile = async (req, res) => {
  const { id } = req.params;
  const { name, email, role, isSuspended } = req.body;

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid User ID format.' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const updateFields = {};

    if (name !== undefined) updateFields.name = name;
    if (email !== undefined) updateFields.email = email.toLowerCase();
    
    if (role !== undefined) {
      if (!['user', 'admin'].includes(role)) {
        return res.status(400).json({ success: false, message: 'Invalid role value.' });
      }
      
      // Prevent self-role modification
      if (id === req.user._id.toString() && role !== user.role) {
        return res.status(400).json({ success: false, message: 'You cannot change your own administrator role.' });
      }

      // Check if downgrading the last admin
      if (user.role === 'admin' && role === 'user') {
        const adminCount = await User.countDocuments({ role: 'admin', isDeleted: { $ne: true } });
        if (adminCount <= 1) {
          return res.status(400).json({ success: false, message: 'Cannot downgrade the last remaining administrator account.' });
        }
      }
      
      updateFields.role = role;
    }
    
    if (isSuspended !== undefined) {
      // Prevent suspending self
      if (id === req.user._id.toString() && isSuspended) {
        return res.status(400).json({ success: false, message: 'You cannot suspend your own administrator account.' });
      }
      updateFields.isSuspended = isSuspended;
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    await SystemLog.create({
      user: req.user._id,
      action: 'ADMIN_USER_UPDATE',
      details: `Updated user profile/role/status for: ${updatedUser.email}`
    });

    res.status(200).json({
      success: true,
      message: 'User updated successfully.',
      user: updatedUser
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Export users list as CSV
 * @route   GET /api/admin/export
 * @access  Private (Admin only)
 */
export const exportUsers = async (req, res) => {
  const { search, filter, sortBy } = req.query;

  try {
    const matchQuery = {};

    if (search) {
      matchQuery.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { role: { $regex: search, $options: 'i' } }
      ];
    }

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    if (filter === 'user' || filter === 'admin') {
      matchQuery.role = filter;
      matchQuery.isDeleted = { $ne: true };
    } else if (filter === 'active') {
      matchQuery.lastActiveAt = { $gte: oneDayAgo };
      matchQuery.isDeleted = { $ne: true };
      matchQuery.isSuspended = { $ne: true };
    } else if (filter === 'inactive') {
      matchQuery.lastActiveAt = { $lt: oneDayAgo };
      matchQuery.isDeleted = { $ne: true };
      matchQuery.isSuspended = { $ne: true };
    } else if (filter === 'blocked') {
      matchQuery.isSuspended = true;
      matchQuery.isDeleted = { $ne: true };
    } else if (filter === 'deleted') {
      matchQuery.isDeleted = true;
    } else {
      matchQuery.isDeleted = { $ne: true };
    }

    let sortStage = { createdAt: -1 };
    if (sortBy === 'oldest') {
      sortStage = { createdAt: 1 };
    } else if (sortBy === 'mostActive') {
      sortStage = { lastActiveAt: -1 };
    }

    const users = await User.find(matchQuery).sort(sortStage).select('-password');

    let csv = 'Name,Email,Role,Status,Joined On,Last Active\n';
    users.forEach(u => {
      const status = u.isDeleted ? 'Deleted' : u.isSuspended ? 'Blocked' : 'Active';
      const joined = new Date(u.createdAt).toLocaleDateString();
      const lastActive = u.lastActiveAt ? new Date(u.lastActiveAt).toLocaleString() : 'Never';
      csv += `"${u.name}","${u.email}","${u.role}","${status}","${joined}","${lastActive}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=users_export.csv');
    return res.status(200).send(csv);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get aggregated analytics metrics and chart summaries
 * @route   GET /api/admin/analytics
 * @access  Private (Admin only)
 */
export const getAdminAnalytics = async (req, res) => {
  try {
    const registrationStats = await User.aggregate([
      { $match: { isDeleted: { $ne: true } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      { $limit: 30 }
    ]);

    const moodDistribution = await Mood.aggregate([
      {
        $group: {
          _id: '$feeling',
          count: { $sum: 1 }
        }
      }
    ]);

    const meditationActivity = await MeditationHistory.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          totalDuration: { $sum: '$duration' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      { $limit: 15 }
    ]);

    const journalActivity = await JournalEntry.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      { $limit: 15 }
    ]);

    res.status(200).json({
      success: true,
      registrations: registrationStats,
      moods: moodDistribution,
      meditations: meditationActivity,
      journals: journalActivity
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get auditing recent platform activity feed logs
 * @route   GET /api/admin/activity
 * @access  Private (Admin only)
 */
export const getAdminActivity = async (req, res) => {
  try {
    const [recentUsers, recentJournals, recentMeditations, systemLogs] = await Promise.all([
      User.find({ isDeleted: { $ne: true } }).sort({ createdAt: -1 }).limit(5).select('name email createdAt'),
      JournalEntry.find().sort({ createdAt: -1 }).limit(5).populate('user', 'name').select('title createdAt'),
      MeditationHistory.find().sort({ createdAt: -1 }).limit(5).populate('userId', 'name').select('title duration createdAt'),
      SystemLog.find().sort({ createdAt: -1 }).limit(5).populate('user', 'name').select('action details createdAt')
    ]);

    const feed = [];

    recentUsers.forEach(u => {
      feed.push({
        type: 'registration',
        message: `${u.name} registered a new account.`,
        timestamp: u.createdAt
      });
    });

    recentJournals.forEach(j => {
      feed.push({
        type: 'journal',
        message: `${j.user?.name || 'A user'} logged a new journal entry: "${j.title}".`,
        timestamp: j.createdAt
      });
    });

    recentMeditations.forEach(m => {
      feed.push({
        type: 'meditation',
        message: `${m.userId?.name || 'A user'} completed a ${m.duration} mins meditation: "${m.title}".`,
        timestamp: m.createdAt
      });
    });

    systemLogs.forEach(l => {
      feed.push({
        type: 'audit',
        message: `${l.user?.name || 'Admin'}: ${l.details}`,
        timestamp: l.createdAt
      });
    });

    feed.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.status(200).json({
      success: true,
      feed: feed.slice(0, 15)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get system settings configuration
 * @route   GET /api/admin/settings
 * @access  Private (Admin only)
 */
export const getAdminSettings = async (req, res) => {
  try {
    let settings = await AdminSettings.findOne();
    if (!settings) {
      settings = await AdminSettings.create({});
    }
    res.status(200).json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Save system settings configuration in MongoDB
 * @route   POST /api/admin/settings
 * @access  Private (Admin only)
 */
export const updateAdminSettings = async (req, res) => {
  try {
    let settings = await AdminSettings.findOne();
    if (!settings) {
      settings = new AdminSettings({});
    }

    const { systemName, maintenanceMode, allowRegistrations, aiSettings, emailSettings, security, roles } = req.body;

    if (systemName !== undefined) settings.systemName = systemName;
    if (maintenanceMode !== undefined) settings.maintenanceMode = maintenanceMode;
    if (allowRegistrations !== undefined) settings.allowRegistrations = allowRegistrations;
    if (aiSettings !== undefined) settings.aiSettings = { ...settings.aiSettings, ...aiSettings };
    if (emailSettings !== undefined) settings.emailSettings = { ...settings.emailSettings, ...emailSettings };
    if (security !== undefined) settings.security = { ...settings.security, ...security };
    if (roles !== undefined) settings.roles = { ...settings.roles, ...roles };

    await settings.save();

    await SystemLog.create({
      user: req.user._id,
      action: 'ADMIN_SETTINGS_UPDATE',
      details: 'Updated global system configurations'
    });

    res.status(200).json({ success: true, settings, message: 'Settings saved successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Toggle user suspension status
 * @route   PATCH /api/admin/status/:id
 * @access  Private (Admin only)
 */
export const toggleUserStatus = async (req, res) => {
  const { id } = req.params;

  if (req.user._id.toString() === id) {
    return res.status(400).json({ success: false, message: 'You cannot change your own suspension status.' });
  }

  try {
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    user.isSuspended = !user.isSuspended;
    await user.save();

    await SystemLog.create({
      user: req.user._id,
      action: user.isSuspended ? 'USER_SUSPEND' : 'USER_UNSUSPEND',
      details: `${user.isSuspended ? 'Suspended' : 'Unsuspended'} user account: ${user.email}`
    });

    res.status(200).json({ success: true, message: `Successfully ${user.isSuspended ? 'suspended' : 'unsuspended'} ${user.name}.`, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Soft delete user account
 * @route   DELETE /api/admin/user/:id
 * @access  Private (Admin only)
 */
export const softDeleteUser = async (req, res) => {
  const { id } = req.params;

  if (req.user._id.toString() === id) {
    return res.status(400).json({ success: false, message: 'You cannot delete yourself.' });
  }

  try {
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    if (user.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin', isDeleted: { $ne: true } });
      if (adminCount <= 1) {
        return res.status(400).json({ success: false, message: 'Cannot soft-delete the last remaining Admin account.' });
      }
    }

    user.isDeleted = true;
    user.deletedAt = new Date();
    user.deletedBy = req.user._id;
    await user.save();

    await SystemLog.create({
      user: req.user._id,
      action: 'USER_SOFT_DELETE',
      details: `Soft-deleted user account: ${user.email}`
    });

    res.status(200).json({ success: true, message: `Successfully soft-deleted ${user.name}.` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Restore soft deleted user account
 * @route   POST /api/admin/restore/:id
 * @access  Private (Admin only)
 */
export const restoreDeletedUser = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    user.isDeleted = false;
    user.deletedAt = null;
    user.deletedBy = null;
    await user.save();

    await SystemLog.create({
      user: req.user._id,
      action: 'USER_RESTORE',
      details: `Restored soft-deleted user account: ${user.email}`
    });

    res.status(200).json({ success: true, message: `Successfully restored ${user.name}.`, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
