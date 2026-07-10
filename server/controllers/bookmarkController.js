import Bookmark from '../models/Bookmark.js';

/**
 * @desc    Get all bookmarks for the logged-in user
 * @route   GET /api/bookmarks
 * @access  Private
 */
export const getBookmarks = async (req, res) => {
  const userId = req.user._id;
  try {
    const bookmarks = await Bookmark.find({ userId }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      bookmarks,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Toggle a bookmark (save/unsave) for any resource
 * @route   POST /api/bookmarks/toggle
 * @access  Private
 */
export const toggleBookmark = async (req, res) => {
  const userId = req.user._id;
  const { itemType, itemId, title, description, url, thumbnail, duration, category, author, publishedDate } = req.body;

  if (!itemType || !itemId || !title) {
    return res.status(400).json({ success: false, message: 'Item type, item ID, and title are required.' });
  }

  try {
    const existing = await Bookmark.findOne({ userId, itemType, itemId });
    if (existing) {
      await Bookmark.deleteOne({ _id: existing._id });
      return res.status(200).json({
        success: true,
        bookmarked: false,
        message: 'Bookmark successfully removed.',
      });
    } else {
      const newBookmark = await Bookmark.create({
        userId,
        itemType,
        itemId,
        title,
        description,
        url,
        thumbnail,
        duration,
        category,
        author,
        publishedDate,
      });
      return res.status(201).json({
        success: true,
        bookmarked: true,
        bookmark: newBookmark,
        message: 'Bookmark successfully added.',
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
