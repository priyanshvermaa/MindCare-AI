import Goal from '../models/Goal.js';
import { clearAICache } from '../services/aiService.js';
import { grantXP } from '../services/gamificationService.js';

/**
 * @desc    Create a new wellness goal
 * @route   POST /api/goals
 * @access  Private
 */
export const createGoal = async (req, res) => {
  const userId = req.user._id;
  const { title, description, category, priority, targetDate } = req.body;

  if (!title || !targetDate) {
    return res.status(400).json({ message: 'Goal title and target date are required.' });
  }

  try {
    const goal = await Goal.create({
      userId,
      title,
      description,
      category: category || 'Wellness',
      priority: priority || 'medium',
      targetDate: new Date(targetDate),
    });

    // Grant 50 XP for goal creation
    const { didLevelUp } = await grantXP(userId, 50);

    clearAICache(userId);

    res.status(201).json({
      success: true,
      message: 'Goal created successfully!',
      goal,
      xpAwarded: 50,
      levelUp: didLevelUp
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get all user goals
 * @route   GET /api/goals
 * @access  Private
 */
export const getGoals = async (req, res) => {
  const userId = req.user._id;

  try {
    const goals = await Goal.find({ userId }).sort({ targetDate: 1 });
    res.status(200).json({
      success: true,
      goals,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Update a goal (complete/edit)
 * @route   PUT /api/goals/:id
 * @access  Private
 */
export const updateGoal = async (req, res) => {
  const userId = req.user._id;
  const { id } = req.params;
  const { title, description, category, priority, completed, targetDate } = req.body;

  try {
    const goal = await Goal.findOne({ _id: id, userId });
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found.' });
    }

    const wasCompleted = goal.completed;
    
    if (title !== undefined) goal.title = title;
    if (description !== undefined) goal.description = description;
    if (category !== undefined) goal.category = category;
    if (priority !== undefined) goal.priority = priority;
    if (completed !== undefined) goal.completed = completed;
    if (targetDate !== undefined) goal.targetDate = new Date(targetDate);

    await goal.save();

    let xpAwarded = 0;
    let levelUp = false;

    // Grant 150 XP when goal is marked completed
    if (completed === true && !wasCompleted) {
      const xpRes = await grantXP(userId, 150);
      xpAwarded = 150;
      levelUp = xpRes.didLevelUp;
    }

    clearAICache(userId);

    res.status(200).json({
      success: true,
      message: 'Goal successfully updated!',
      goal,
      xpAwarded,
      levelUp
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Delete a goal
 * @route   DELETE /api/goals/:id
 * @access  Private
 */
export const deleteGoal = async (req, res) => {
  const userId = req.user._id;
  const { id } = req.params;

  try {
    const goal = await Goal.findOneAndDelete({ _id: id, userId });
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found.' });
    }

    clearAICache(userId);

    res.status(200).json({
      success: true,
      message: 'Goal deleted successfully.',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
