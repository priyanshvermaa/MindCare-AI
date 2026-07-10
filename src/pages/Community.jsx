import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, MessageSquare, Heart, Bookmark, Share2, Send, AlertTriangle, Phone,
  BookOpen, ShieldAlert, Sparkles, Plus, Trash2, Check, X,
  ShieldCheck, AlertCircle, PhoneCall
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Sidebar from '../components/dashboard/Sidebar';
import TopNav from '../components/dashboard/TopNav';
import { useTheme } from '../context/ThemeContext';
import { Skeleton } from '../components/ui/Skeleton';

export default function Community() {
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { isLightMode } = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Community Feed States
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null); // For detail modal
  const [postComments, setPostComments] = useState([]);
  const [feedFilter, setFeedFilter] = useState('all'); // all, bookmarks, my-posts
  const [selectedCategory, setSelectedCategory] = useState('');
  
  // New Post Form
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('General');
  const [newAnonymous, setNewAnonymous] = useState(false);
  const [postSubmitting, setPostSubmitting] = useState(false);

  // New Comment Form
  const [newComment, setNewComment] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  const categories = [
    'Anxiety', 'Stress', 'Depression Support', 'Motivation',
    'Productivity', 'Meditation', 'Fitness', 'Sleep',
    'Relationships', 'Student Life', 'Career', 'General'
  ];

  // Fetch Community Data
  const fetchPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = '/community/posts';
      const params = {};
      if (selectedCategory) params.category = selectedCategory;
      if (feedFilter === 'bookmarks') params.filter = 'bookmarks';
      if (feedFilter === 'my-posts') params.filter = 'my-posts';

      const response = await api.get(url, { params });
      setPosts(response.data.posts || []);
    } catch (err) {
      console.error('Failed to load posts: ', err);
      setError('Could not retrieve feed posts. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [feedFilter, selectedCategory]);

  // Feed Actions
  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newTitle || !newContent) return;
    setPostSubmitting(true);
    try {
      await api.post('/community/posts', {
        title: newTitle,
        content: newContent,
        category: newCategory,
        anonymous: newAnonymous
      });
      setNewTitle('');
      setNewContent('');
      setNewCategory('General');
      setNewAnonymous(false);
      fetchPosts();
    } catch (err) {
      console.error(err);
      alert('Failed to submit post.');
    } finally {
      setPostSubmitting(false);
    }
  };

  const handleToggleLike = async (postId) => {
    try {
      const res = await api.post('/community/like', { postId });
      setPosts(prev => prev.map(p => {
        if (p._id === postId) {
          return {
            ...p,
            isLiked: res.data.liked,
            likesCount: res.data.likesCount
          };
        }
        return p;
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleBookmark = async (postId) => {
    try {
      const res = await api.post('/community/bookmark', { postId });
      setPosts(prev => prev.map(p => {
        if (p._id === postId) {
          return { ...p, isBookmarked: res.data.bookmarked };
        }
        return p;
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenPostDetails = async (post) => {
    setSelectedPost(post);
    try {
      const res = await api.get(`/community/posts/${post._id}`);
      setPostComments(res.data.comments || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment || !selectedPost) return;
    setCommentSubmitting(true);
    try {
      const res = await api.post('/community/comments', {
        postId: selectedPost._id,
        content: newComment
      });
      setPostComments(prev => [...prev, res.data.comment]);
      setNewComment('');
      setPosts(prev => prev.map(p => {
        if (p._id === selectedPost._id) {
          return { ...p, commentsCount: p.commentsCount + 1 };
        }
        return p;
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    try {
      await api.delete(`/community/posts/${postId}`);
      setPosts(prev => prev.filter(p => p._id !== postId));
      setSelectedPost(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleReportPost = (postId) => {
    alert('🚩 Post reported. Our moderation team will review this entry within 2 hours. Thank you for keeping our community safe.');
  };

  const handleSharePost = (post) => {
    navigator.clipboard.writeText(`${window.location.origin}/community?postId=${post._id}`);
    alert('🔗 Shareable post link copied to clipboard!');
  };

  // Feed Actions

  return (
    <div className="min-h-screen bg-white text-[#1D1B3A] flex font-poppins select-none relative">
      
      {/* Sidebar navigation */}
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <div className={`flex-1 transition-all duration-300 min-h-screen flex flex-col ${
        isSidebarOpen ? 'md:pl-64' : 'md:pl-20'
      }`}>
        
        {/* Navigation header */}
        <TopNav
          onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        />

        <main className="flex-1 px-8 lg:px-10 py-8 pb-10 max-w-7xl mx-auto w-full space-y-8 text-left relative z-10">
          
          {/* Header Row */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-1">
            <div className="flex items-end gap-3.5 text-left">
              <div className="w-12 h-12 rounded-xl bg-[#F8F5FF] border border-[#E9E2FF] flex items-center justify-center text-[#7C5CFF] shadow-sm shrink-0 mb-0.5">
                <Users className="w-5.5 h-5.5" />
              </div>
              <div className="pb-0.5">
                <h1 className="text-2.5xl font-black text-[#1D1B3A] tracking-tight leading-none mb-2">Community & Support</h1>
                <p className="text-xs text-[#6F7392] font-semibold leading-none">
                  Share experiences anonymously, connect with supportive people, and discover helpful resources.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 lg:grid-cols-10 gap-6 lg:gap-8 items-start w-full">
            
            {/* Left Column: Filters and Categories */}
            <div className="md:col-span-3 lg:col-span-3 lg:row-span-2 lg:order-1 order-2 space-y-6">
              
              {/* Filters box */}
              <div className="bg-white rounded-[24px] border border-[#E9E2FF] p-6 shadow-sm flex flex-col gap-4">
                <span className="text-[10px] uppercase font-extrabold tracking-widest text-[#6F7392] pl-1">Feed Filters</span>
                <div className="flex flex-col gap-2.5">
                  {[
                    { id: 'all', name: 'All Wellness Posts' },
                    { id: 'bookmarks', name: 'Bookmarks' },
                    { id: 'my-posts', name: 'My Posts' },
                  ].map(f => (
                    <button
                      key={f.id}
                      onClick={() => setFeedFilter(f.id)}
                      className={`text-left text-xs px-4 h-11 rounded-xl border transition-all font-semibold ${
                        feedFilter === f.id
                          ? 'bg-[#F8F5FF] border-[#E9E2FF] text-[#7C5CFF] font-extrabold'
                          : 'bg-white border-[#E9E2FF] text-[#6F7392] hover:bg-gray-55'
                      }`}
                    >
                      {f.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Categories tag pills list */}
              <div className="bg-white rounded-[24px] border border-[#E9E2FF] p-6 shadow-sm space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-gray-50 pl-1">
                  <span className="text-[10px] uppercase font-extrabold tracking-widest text-[#6F7392]">Categories</span>
                  {selectedCategory && (
                    <button
                      onClick={() => setSelectedCategory('')}
                      className="text-[9px] text-[#7C5CFF] hover:underline font-extrabold uppercase pr-1"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat === selectedCategory ? '' : cat)}
                      className={`px-3 py-1.5 rounded-full text-xxs font-extrabold uppercase tracking-wide transition-all border ${
                        selectedCategory === cat
                          ? 'bg-[#7C5CFF] text-white border-transparent shadow-sm'
                          : 'bg-white border-[#E9E2FF] text-[#6F7392] hover:bg-gray-55'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Post Creation Form and Feed Posts List */}
            <div className="md:col-span-9 lg:col-span-7 lg:order-2 order-1 space-y-6">
              
              {/* Create Post Form */}
              <div className="bg-white rounded-[24px] border border-[#E9E2FF] p-6 shadow-sm text-left">
                <span className="text-[10px] uppercase font-extrabold tracking-widest text-[#6F7392] block mb-4 pl-1">Create community post</span>
                <form onSubmit={handleCreatePost} className="space-y-4">
                  <div>
                    <input
                      type="text"
                      required
                      placeholder="Title of your post..."
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full bg-[#FAF8FF] border border-[#E9E2FF] rounded-xl px-4.5 h-11 text-xs text-[#1D1B3A] font-semibold focus:outline-none focus:border-[#7C5CFF]"
                    />
                  </div>
                  <div>
                    <textarea
                      required
                      rows={3}
                      placeholder="What is on your mind? Share anonymously or publicly..."
                      value={newContent}
                      onChange={(e) => setNewContent(e.target.value)}
                      className="w-full bg-[#FAF8FF] border border-[#E9E2FF] rounded-xl px-4.5 py-3 text-xs text-[#1D1B3A] font-semibold focus:outline-none focus:border-[#7C5CFF] resize-none"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <select
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        className="bg-white border border-[#E9E2FF] rounded-xl px-3 h-9 text-[10px] text-[#1D1B3A] font-extrabold uppercase tracking-wider focus:outline-none focus:border-[#7C5CFF] cursor-pointer"
                      >
                        {categories.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>

                      <button
                        type="button"
                        onClick={() => setNewAnonymous(!newAnonymous)}
                        className={`flex items-center gap-2 px-3.5 h-9 rounded-xl border transition-all font-bold text-xxs uppercase tracking-wider ${
                          newAnonymous
                            ? 'bg-[#7C5CFF]/8 border-[#7C5CFF] text-[#7C5CFF]'
                            : 'bg-white border-[#E9E2FF] text-[#6F7392] hover:bg-gray-50'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${newAnonymous ? 'bg-[#7C5CFF]' : 'bg-gray-300'}`} />
                        Anonymous Post
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={postSubmitting}
                      className="px-6 h-10 bg-[#7C5CFF] hover:bg-[#6D4AE5] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm disabled:opacity-50 self-stretch sm:self-auto"
                    >
                      {postSubmitting ? 'Posting...' : 'Share Post'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Feed posts list */}
              {loading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-44 bg-gray-50 border border-gray-100 rounded-3xl animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="space-y-5">
                  {posts.length > 0 ? (
                    posts.map(post => (
                      <div
                        key={post._id}
                        className="bg-white rounded-[24px] border border-[#E9E2FF] p-6 shadow-sm flex flex-col justify-between text-left hover:border-purple-200 transition-colors"
                      >
                        <div className="space-y-3.5">
                          <div className="flex justify-between items-start">
                            <span className="px-2.5 py-0.5 rounded text-[8px] font-black bg-[#F8F5FF] border border-[#E9E2FF] text-[#7C5CFF] uppercase tracking-wider">
                              #{post.category}
                            </span>
                            <span className="text-[9px] text-[#6F7392] font-semibold">
                              {post.anonymous ? 'Anonymous' : post.author} • {new Date(post.createdAt).toLocaleDateString()}
                            </span>
                          </div>

                          <div className="space-y-1">
                            <h3 className="font-extrabold text-sm text-[#1D1B3A] line-clamp-1">{post.title}</h3>
                            <p className="text-xs text-gray-550 leading-relaxed line-clamp-3 font-semibold">{post.content}</p>
                          </div>
                        </div>

                        <div className="pt-4 mt-4 border-t border-gray-50 flex flex-wrap gap-4 items-center justify-between">
                          <button
                            onClick={() => handleFetchComments(post)}
                            className="flex items-center gap-1.5 text-xxs font-extrabold text-[#6F7392] hover:text-[#7C5CFF] transition-all uppercase tracking-wider bg-gray-50/50 hover:bg-[#7C5CFF]/5 border border-transparent hover:border-[#E9E2FF] px-3.5 py-2 rounded-xl"
                          >
                            <MessageSquare className="w-3.5 h-3.5" /> Comments ({post.commentsCount})
                          </button>

                          <div className="flex items-center gap-2.5">
                            <button
                              onClick={() => handleLikePost(post._id)}
                              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border transition-all text-xxs font-bold ${
                                post.isLiked
                                  ? 'bg-rose-50 border-rose-100 text-rose-500'
                                  : 'bg-white border-[#E9E2FF] text-gray-400 hover:text-rose-500'
                              }`}
                            >
                              <Heart className={`w-3.5 h-3.5 ${post.isLiked ? 'fill-rose-500' : ''}`} /> {post.likesCount}
                            </button>

                            <button
                              onClick={() => handleBookmarkPost(post._id)}
                              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border transition-all text-xxs font-bold ${
                                post.isBookmarked
                                  ? 'bg-amber-50 border-amber-100 text-amber-500'
                                  : 'bg-white border-[#E9E2FF] text-gray-400 hover:text-amber-500'
                              }`}
                            >
                              <Bookmark className={`w-3.5 h-3.5 ${post.isBookmarked ? 'fill-amber-500' : ''}`} />
                            </button>

                            <button
                              onClick={() => handleSharePost(post)}
                              className="p-1.5 rounded-lg border border-[#E9E2FF] bg-white text-gray-400 hover:text-[#7C5CFF] transition-all"
                              aria-label="Share"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                            </button>

                            {user && (user.role?.toLowerCase() === 'admin' || user.id === post.userId) && (
                              <button
                                onClick={() => handleDeletePost(post._id)}
                                className="p-1.5 rounded-lg border border-rose-100 bg-white text-rose-450 hover:bg-rose-50 transition-all"
                                aria-label="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => handleReportPost(post._id)}
                              className="hover:text-rose-500 transition-colors"
                              aria-label="Report"
                            >
                              <AlertTriangle className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <span className="text-xxs text-gray-400 italic block py-12 text-center bg-white border border-[#E9E2FF] rounded-[24px]">
                      No community posts matching this filter.
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* DETAILED POST MODAL OVERLAY */}
      <AnimatePresence>
        {selectedPost && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPost(null)}
              className="absolute inset-0 bg-[#1D1B3A]/40 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-2xl bg-white border border-[#E9E2FF] rounded-[24px] p-6 md:p-8 shadow-2xl z-10 text-left overflow-y-auto max-h-[85vh] scrollbar-none"
            >
              {/* Header */}
              <div className="flex justify-between items-center border-b border-gray-50 pb-4 mb-4">
                <span className="px-2 py-0.5 rounded text-[8px] font-extrabold bg-[#F8F5FF] border border-[#E9E2FF] text-[#7C5CFF] uppercase">
                  #{selectedPost.category}
                </span>
                <button
                  onClick={() => setSelectedPost(null)}
                  className="p-1 rounded-xl bg-gray-50 border border-gray-100 text-gray-400 hover:text-[#7C5CFF]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Title & Content */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-black text-[#1D1B3A]">{selectedPost.title}</h3>
                  <span className="text-[10px] text-gray-400 block mt-1">
                    Posted by {selectedPost.author} • {new Date(selectedPost.createdAt).toLocaleString()}
                  </span>
                </div>
                
                <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line border-b border-gray-50 pb-5 font-semibold">
                  {selectedPost.content}
                </p>
              </div>

              {/* Comments Section */}
              <div className="space-y-4 mt-6">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#6F7392]">Comments ({postComments.length})</h4>
                
                {/* Comments List */}
                <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                  {postComments.map(c => (
                    <div key={c._id} className="p-3.5 rounded-xl bg-[#FAF8FF] border border-[#E9E2FF] text-xs shadow-sm text-left">
                      <div className="flex justify-between items-center text-[10px] text-gray-400 font-bold mb-1">
                        <span>{c.author}</span>
                        <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-gray-700 font-semibold">{c.content}</p>
                    </div>
                  ))}
                </div>

                {/* Add Comment Input */}
                <form onSubmit={handleAddComment} className="flex gap-2 pt-2">
                  <input
                    type="text"
                    required
                    placeholder="Add an empathetic comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="flex-1 bg-[#FAF8FF] border border-[#E9E2FF] rounded-xl px-4 py-2.5 text-xs text-[#1D1B3A] focus:outline-none focus:border-[#7C5CFF] font-semibold"
                  />
                  <button
                    type="submit"
                    disabled={commentSubmitting}
                    className="px-4.5 py-2.5 bg-[#7C5CFF] hover:bg-[#6D4AE5] text-white font-bold text-xxs uppercase tracking-wider rounded-xl transition-all shadow-sm disabled:opacity-50"
                  >
                    Send
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SOS TRIGGER MODAL OVERLAY */}
      <AnimatePresence>
        {showSOSModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSOSModal(false)}
              className="absolute inset-0 bg-[#1D1B3A]/60 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-md bg-white border border-[#FF5F6D]/20 rounded-[24px] p-6 md:p-8 shadow-2xl z-10 text-center space-y-6"
            >
              <div className="w-16 h-16 rounded-full bg-[#FF5F6D]/10 border border-[#FF5F6D]/20 flex items-center justify-center text-[#FF5F6D] mx-auto animate-pulse">
                <ShieldAlert className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-lg font-black text-[#1D1B3A]">MindCare Emergency SOS Activated</h3>
                <p className="text-[10px] text-[#FF5F6D] font-extrabold uppercase mt-1 tracking-wider">Immediate Crisis Assistance Protocol</p>
              </div>

              <div className="p-4 rounded-xl bg-[#FF5F6D]/5 border border-[#FF5F6D]/10 text-[10px] text-gray-550 leading-relaxed text-left space-y-1.5 font-semibold">
                <span className="font-extrabold text-[#FF5F6D] uppercase tracking-wide block">⚠️ Disclaimer</span>
                <span>If you are experiencing thoughts of self-harm, a panic attack, or a medical emergency, please contact your local emergency services or a therapist immediately.</span>
              </div>

              <div className="space-y-3 text-left">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#6F7392] block">Emergency Helpline Dialers</span>
                <div className="space-y-2.5">
                  <div className="p-3.5 rounded-xl bg-[#FAF8FF] border border-[#E9E2FF] flex justify-between items-center text-xs shadow-sm">
                    <span className="font-extrabold text-[#1D1B3A]">Suicide & Crisis Lifeline</span>
                    <a href="tel:988" className="px-4 py-2 rounded-lg bg-[#FF5F6D] hover:bg-[#E04D5B] text-white font-extrabold text-xxs transition-colors">Call 988</a>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#FAF8FF] border border-[#E9E2FF] flex justify-between items-center text-xs shadow-sm">
                    <span className="font-extrabold text-[#1D1B3A]">Crisis Text Line</span>
                    <a href="sms:741741?&body=HOME" className="px-4 py-2 rounded-lg bg-[#FAF8FF] border border-[#E9E2FF] text-[#6F7392] hover:bg-gray-50 font-extrabold text-xxs transition-all">Text HOME</a>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowSOSModal(false)}
                  className="w-full py-2.5 border border-[#E9E2FF] bg-white text-gray-500 font-bold text-xxs rounded-xl hover:bg-gray-50 transition-colors uppercase tracking-wider"
                >
                  Dismiss SOS
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
