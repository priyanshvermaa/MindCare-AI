import Post from '../models/Post.js';
import Comment from '../models/Comment.js';
import Notification from '../models/Notification.js';
import SupportGroup from '../models/SupportGroup.js';

/**
 * @desc    Create a new post in community feed
 * @route   POST /api/community/posts
 * @access  Private
 */
export const createPost = async (req, res) => {
  const { title, content, category, anonymous } = req.body;
  const userId = req.user._id;

  if (!title || !content) {
    return res.status(400).json({ message: 'Title and content are required.' });
  }

  try {
    const post = await Post.create({
      userId,
      title,
      content,
      category: category || 'General',
      anonymous: !!anonymous,
      likes: [],
      bookmarks: [],
    });

    res.status(201).json({
      success: true,
      message: 'Post created successfully!',
      post,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get all community posts with optional category, bookmark, or user filters
 * @route   GET /api/community/posts
 * @access  Private
 */
export const getPosts = async (req, res) => {
  const userId = req.user._id;
  const { category, filter } = req.query; // filter can be 'bookmarks', 'my-posts'

  let query = { isDeleted: false };

  if (category) {
    query.category = category;
  }

  if (filter === 'bookmarks') {
    query.bookmarks = userId;
  } else if (filter === 'my-posts') {
    query.userId = userId;
  }

  try {
    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .populate('userId', 'name')
      .lean();

    // Map responses to clean up user details if anonymous
    const sanitizedPosts = posts.map(post => {
      const isLiked = post.likes.some(id => id.toString() === userId.toString());
      const isBookmarked = post.bookmarks.some(id => id.toString() === userId.toString());

      return {
        ...post,
        author: post.anonymous ? 'Anonymous' : (post.userId?.name || 'Deleted User'),
        likesCount: post.likes.length,
        commentsCount: 0, // Will calculate separately or populate
        isLiked,
        isBookmarked,
        // Hide userId if anonymous
        userId: post.anonymous ? null : post.userId
      };
    });

    // Populate comments count for each post
    for (let i = 0; i < sanitizedPosts.length; i++) {
      sanitizedPosts[i].commentsCount = await Comment.countDocuments({ postId: sanitizedPosts[i]._id });
    }

    res.status(200).json({
      success: true,
      posts: sanitizedPosts,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get a specific post by ID with comments populated
 * @route   GET /api/community/posts/:id
 * @access  Private
 */
export const getPostById = async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  try {
    const post = await Post.findOne({ _id: id, isDeleted: false })
      .populate('userId', 'name')
      .lean();

    if (!post) {
      return res.status(404).json({ message: 'Post not found.' });
    }

    const comments = await Comment.find({ postId: id })
      .sort({ createdAt: 1 })
      .populate('userId', 'name')
      .lean();

    const sanitizedComments = comments.map(c => ({
      ...c,
      author: c.userId?.name || 'User',
    }));

    const isLiked = post.likes.some(lId => lId.toString() === userId.toString());
    const isBookmarked = post.bookmarks.some(bId => bId.toString() === userId.toString());

    res.status(200).json({
      success: true,
      post: {
        ...post,
        author: post.anonymous ? 'Anonymous' : (post.userId?.name || 'Deleted User'),
        likesCount: post.likes.length,
        isLiked,
        isBookmarked,
        userId: post.anonymous ? null : post.userId
      },
      comments: sanitizedComments,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Edit own community post
 * @route   PUT /api/community/posts/:id
 * @access  Private
 */
export const editPost = async (req, res) => {
  const { id } = req.params;
  const { title, content, category, anonymous } = req.body;
  const userId = req.user._id;

  try {
    const post = await Post.findOne({ _id: id, isDeleted: false });

    if (!post) {
      return res.status(404).json({ message: 'Post not found.' });
    }

    // Verify creator authorization
    if (post.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'You are not authorized to edit this post.' });
    }

    if (title) post.title = title;
    if (content) post.content = content;
    if (category) post.category = category;
    if (anonymous !== undefined) post.anonymous = !!anonymous;

    await post.save();

    res.status(200).json({
      success: true,
      message: 'Post updated successfully!',
      post,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Soft delete community post
 * @route   DELETE /api/community/posts/:id
 * @access  Private
 */
export const deletePost = async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  try {
    const post = await Post.findOne({ _id: id, isDeleted: false });

    if (!post) {
      return res.status(404).json({ message: 'Post not found.' });
    }

    // Verify creator authorization
    if (post.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'You are not authorized to delete this post.' });
    }

    post.isDeleted = true;
    await post.save();

    res.status(200).json({
      success: true,
      message: 'Post deleted successfully!',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Toggle user like status on post and emit alerts
 * @route   POST /api/community/like
 * @access  Private
 */
export const toggleLike = async (req, res) => {
  const { postId } = req.body;
  const userId = req.user._id;

  if (!postId) {
    return res.status(400).json({ message: 'postId is required.' });
  }

  try {
    const post = await Post.findOne({ _id: postId, isDeleted: false });
    if (!post) {
      return res.status(404).json({ message: 'Post not found.' });
    }

    const likeIndex = post.likes.indexOf(userId);
    let liked = false;

    if (likeIndex > -1) {
      post.likes.splice(likeIndex, 1);
    } else {
      post.likes.push(userId);
      liked = true;

      // Trigger notifications alert (skip self-like)
      if (post.userId.toString() !== userId.toString()) {
        await Notification.create({
          userId: post.userId,
          type: 'like',
          title: '❤️ Post Liked!',
          message: `${req.user.name} liked your post "${post.title.substring(0, 20)}..."`,
          link: `/community?postId=${post._id}`,
        });
      }
    }

    await post.save();

    res.status(200).json({
      success: true,
      liked,
      likesCount: post.likes.length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Toggle post bookmarks
 * @route   POST /api/community/bookmark
 * @access  Private
 */
export const toggleBookmark = async (req, res) => {
  const { postId } = req.body;
  const userId = req.user._id;

  if (!postId) {
    return res.status(400).json({ message: 'postId is required.' });
  }

  try {
    const post = await Post.findOne({ _id: postId, isDeleted: false });
    if (!post) {
      return res.status(404).json({ message: 'Post not found.' });
    }

    const bookmarkIndex = post.bookmarks.indexOf(userId);
    let bookmarked = false;

    if (bookmarkIndex > -1) {
      post.bookmarks.splice(bookmarkIndex, 1);
    } else {
      post.bookmarks.push(userId);
      bookmarked = true;
    }

    await post.save();

    res.status(200).json({
      success: true,
      bookmarked,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Add a comment on a community post
 * @route   POST /api/community/comments
 * @access  Private
 */
export const addComment = async (req, res) => {
  const { postId, content } = req.body;
  const userId = req.user._id;

  if (!postId || !content) {
    return res.status(400).json({ message: 'postId and content are required.' });
  }

  try {
    const post = await Post.findOne({ _id: postId, isDeleted: false });
    if (!post) {
      return res.status(404).json({ message: 'Post not found.' });
    }

    const comment = await Comment.create({
      userId,
      postId,
      content,
    });

    const populatedComment = await comment.populate('userId', 'name');

    // Trigger comment notification alert (skip self-comments)
    if (post.userId.toString() !== userId.toString()) {
      await Notification.create({
        userId: post.userId,
        type: 'comment',
        title: '💬 New Comment!',
        message: `${req.user.name} commented: "${content.substring(0, 30)}..." on your post.`,
        link: `/community?postId=${post._id}`,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Comment added successfully!',
      comment: {
        ...populatedComment.toObject(),
        author: populatedComment.userId?.name || 'User',
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Delete a specific comment
 * @route   DELETE /api/community/comments/:id
 * @access  Private
 */
export const deleteComment = async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  try {
    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found.' });
    }

    const post = await Post.findById(comment.postId);

    // Verify creator authorization (Comment creator OR Post creator can delete)
    const isAuthorized =
      comment.userId.toString() === userId.toString() ||
      (post && post.userId.toString() === userId.toString());

    if (!isAuthorized) {
      return res.status(403).json({ message: 'You are not authorized to delete this comment.' });
    }

    await Comment.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully!',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get list of all Support Groups
 * @route   GET /api/community/groups
 * @access  Private
 */
export const getGroups = async (req, res) => {
  const userId = req.user._id;

  try {
    const groups = await SupportGroup.find({}).lean();
    
    const groupsWithStatus = groups.map(g => {
      const isMember = g.members.some(mId => mId.toString() === userId.toString());
      return {
        ...g,
        membersCount: g.members.length,
        isJoined: isMember,
      };
    });

    res.status(200).json({
      success: true,
      groups: groupsWithStatus,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Join a support group
 * @route   POST /api/community/groups/join
 * @access  Private
 */
export const joinGroup = async (req, res) => {
  const { groupId } = req.body;
  const userId = req.user._id;

  if (!groupId) {
    return res.status(400).json({ message: 'groupId is required.' });
  }

  try {
    const group = await SupportGroup.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Support Group not found.' });
    }

    if (group.members.includes(userId)) {
      return res.status(400).json({ message: 'You are already a member of this group.' });
    }

    group.members.push(userId);
    await group.save();

    res.status(200).json({
      success: true,
      message: `Successfully joined ${group.name}!`,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Leave a support group
 * @route   POST /api/community/groups/leave
 * @access  Private
 */
export const leaveGroup = async (req, res) => {
  const { groupId } = req.body;
  const userId = req.user._id;

  if (!groupId) {
    return res.status(400).json({ message: 'groupId is required.' });
  }

  try {
    const group = await SupportGroup.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Support Group not found.' });
    }

    const memberIndex = group.members.indexOf(userId);
    if (memberIndex === -1) {
      return res.status(400).json({ message: 'You are not a member of this group.' });
    }

    group.members.splice(memberIndex, 1);
    await group.save();

    res.status(200).json({
      success: true,
      message: `Successfully left ${group.name}.`,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
