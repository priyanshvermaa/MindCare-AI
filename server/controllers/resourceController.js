import Resource from '../models/Resource.js';
import Bookmark from '../models/Bookmark.js';
import ResourceProgress from '../models/ResourceProgress.js';

/**
 * @desc    Get all self-care educational resources with user status flags
 * @route   GET /api/resources
 * @access  Private
 */
export const getResources = async (req, res) => {
  const userId = req.user._id;
  const { type, category } = req.query;
  let query = {};

  if (type) {
    query.type = type;
  }
  
  if (category) {
    query.category = category;
  }

  try {
    const [resources, bookmarks, progressList] = await Promise.all([
      Resource.find(query).sort({ createdAt: -1 }),
      Bookmark.find({ userId, itemType: { $in: ['article', 'video'] } }),
      ResourceProgress.find({ userId })
    ]);

    const enriched = resources.map(resItem => {
      const isBookmarked = bookmarks.some(b => b.itemId === resItem._id.toString());
      const progObj = progressList.find(p => p.resourceId.toString() === resItem._id.toString());
      return {
        ...resItem.toObject(),
        bookmarked: isBookmarked,
        progress: progObj ? progObj.progress : 0,
        currentTime: progObj ? progObj.currentTime : 0,
        completed: progObj ? progObj.completed : false,
      };
    });

    res.status(200).json({
      success: true,
      resources: enriched,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get details of a single resource with user metadata
 * @route   GET /api/resources/:id
 * @access  Private
 */
export const getResourceById = async (req, res) => {
  const userId = req.user._id;
  const { id } = req.params;

  try {
    const resource = await Resource.findById(id);
    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found.' });
    }

    const [bookmark, progressRecord, related] = await Promise.all([
      Bookmark.findOne({ userId, itemId: id }),
      ResourceProgress.findOne({ userId, resourceId: id }),
      Resource.find({
        type: resource.type,
        _id: { $ne: id }
      }).limit(3)
    ]);

    res.status(200).json({
      success: true,
      resource: {
        ...resource.toObject(),
        bookmarked: !!bookmark,
        progress: progressRecord ? progressRecord.progress : 0,
        currentTime: progressRecord ? progressRecord.currentTime : 0,
        completed: progressRecord ? progressRecord.completed : false,
      },
      relatedArticles: related
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Update reading or watching progress for an article or video
 * @route   POST /api/resources/:id/progress
 * @access  Private
 */
export const updateResourceProgress = async (req, res) => {
  const userId = req.user._id;
  const { id } = req.params;
  const { progress, currentTime } = req.body;

  try {
    const resource = await Resource.findById(id);
    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found.' });
    }

    const completed = progress >= 95;
    const progressRecord = await ResourceProgress.findOneAndUpdate(
      { userId, resourceId: id },
      {
        userId,
        resourceId: id,
        itemType: resource.type,
        progress: Math.min(100, Math.max(0, progress)),
        currentTime: currentTime || 0,
        completed,
        lastPlayed: new Date()
      },
      { upsert: true, new: true }
    );

    res.status(200).json({
      success: true,
      progress: progressRecord,
      message: 'Resource progress successfully updated.',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
