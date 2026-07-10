import React, { useState, useEffect, useRef } from 'react';
import { Bell, Sun, Moon, User, LogOut, Heart, HelpCircle, ChevronRight, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function TopNav({ onMenuToggle, isDashboard = false }) {
  const { user, logout } = useAuth();
  const { isLightMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const notificationsRef = useRef(null);
  const profileRef = useRef(null);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications');
      if (response.data.success) {
        setNotifications(response.data.notifications || []);
      }
    } catch (err) {
      console.warn('Could not compile notifications list:', err.message);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Refresh notifications every 20 seconds to stay synchronized
    const interval = setInterval(fetchNotifications, 20000);
    return () => clearInterval(interval);
  }, []);

  // Handle outside clicks
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (notificationsRef.current && !notificationsRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleToggleTheme = () => {
    toggleTheme();
  };

  const handleMarkAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}`);
      fetchNotifications();
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const unread = notifications.filter(n => !n.read);
      await Promise.all(unread.map(n => api.put(`/notifications/${n._id}`)));
      fetchNotifications();
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="sticky top-0 z-30 flex items-center border-b border-[#E5E7EB] bg-white/90 backdrop-blur-md shrink-0 font-poppins text-[#1D1D1F] h-[73px]">
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between px-6 md:px-8">
        
        {/* Left side: Hamburger menu & Greeting/Breadcrumbs */}
        <div className="flex items-center gap-4">
          {/* Mobile menu toggle */}
          <button
            onClick={onMenuToggle}
            className="md:hidden p-2 rounded-xl bg-gray-50 border border-[#E5E7EB] text-gray-500 hover:text-[#7C5CFF] transition-colors"
            aria-label="Toggle mobile navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Breadcrumb Navigation */}
          <nav aria-label="Breadcrumb" className="hidden sm:flex items-center gap-1.5 text-xs text-gray-400 font-extrabold tracking-wide uppercase select-none">
            <span className="hover:text-gray-650 cursor-pointer">Platform</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-gray-700 font-extrabold">Dashboard</span>
          </nav>
        </div>

        {/* Right side: Actions, Notifications, Profile */}
        <div className="flex items-center gap-6">

          {/* Theme Toggle */}
          <button
            onClick={handleToggleTheme}
            className="h-10 w-10 flex items-center justify-center rounded-full border border-[#E5E7EB] text-gray-500 hover:text-[#7C5CFF] hover:bg-gray-50 transition-all"
            aria-label="Toggle Dark/Light Mode"
          >
            {isLightMode ? <Moon className="w-4.5 h-4.5" /> : <Sun className="w-4.5 h-4.5" />}
          </button>

          {/* Notification Center */}
          <div className="relative" ref={notificationsRef}>
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowProfileMenu(false);
              }}
              className="h-10 w-10 flex items-center justify-center rounded-full border border-[#E5E7EB] text-gray-500 hover:text-[#7C5CFF] hover:bg-gray-50 transition-all relative"
              aria-label="View notifications"
            >
              <Bell className="w-4.5 h-4.5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#7C5CFF] text-white text-[9px] font-bold flex items-center justify-center border border-white">
                  {unreadCount}
                </span>
              )}
            </button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 15 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-3 w-80 bg-white border border-[#E5E7EB] rounded-2xl shadow-xl p-4 overflow-hidden text-left z-50"
                >
                  <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-100">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-500">Resilience alerts</h4>
                    {unreadCount > 0 && (
                      <span 
                        onClick={handleMarkAllRead}
                        className="text-[10px] text-[#7C5CFF] font-bold hover:underline cursor-pointer"
                      >
                        Mark all read
                      </span>
                    )}
                  </div>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map((n) => (
                        <div 
                          key={n._id} 
                          onClick={() => handleMarkAsRead(n._id)}
                          className={`flex items-start gap-2.5 p-2 rounded-xl transition-colors cursor-pointer hover:bg-gray-50 ${!n.read ? 'bg-gray-50/50' : 'opacity-65'}`}
                        >
                          <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!n.read ? 'bg-[#7C5CFF]' : 'bg-transparent'}`} />
                          <div>
                            <p className="text-xs text-gray-700 leading-normal font-medium">{n.message || n.title}</p>
                            <span className="text-[10px] text-gray-400 font-bold block mt-1">
                              {new Date(n.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-xxs text-gray-400 italic py-8 text-center">
                        All caught up! No new notifications.
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User Profile Dropdown */}
          {user && (
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => {
                  setShowProfileMenu(!showProfileMenu);
                  setShowNotifications(false);
                }}
                className="flex items-center gap-2 h-10 p-1 pr-3.5 rounded-full border border-[#E5E7EB] hover:border-gray-300 transition-all text-gray-700 hover:bg-gray-50/50"
              >
                <div className="w-7.5 h-7.5 rounded-full bg-gradient-to-tr from-[#7C5CFF] to-[#A88BFF] flex items-center justify-center text-white font-extrabold text-xs shadow-sm">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:inline text-xs font-extrabold tracking-wide truncate max-w-[80px]">
                  {user.name.split(' ')[0]}
                </span>
                <span className="text-[8px] text-gray-400 ml-0.5 select-none">▼</span>
              </button>

              <AnimatePresence>
                {showProfileMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 15 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-3 w-56 bg-white border border-[#E5E7EB] rounded-2xl shadow-xl p-2.5 overflow-hidden text-left z-50"
                  >
                    {/* Account Header */}
                    <div className="px-3.5 py-2.5 border-b border-gray-100 mb-2">
                      <span className="font-extrabold text-xs text-gray-900 block truncate">{user.name}</span>
                      <span className="text-[9px] text-gray-400 font-bold block truncate uppercase tracking-wider mt-0.5">
                        {user.role === 'admin' ? 'Administrator' : 'Resilience Advisor'}
                      </span>
                    </div>

                    {/* Actions list */}
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        navigate('/settings');
                      }}
                      className="flex items-center gap-3 w-full px-3.5 py-2 rounded-xl text-xs text-gray-700 hover:text-[#7C5CFF] hover:bg-gray-50 transition-all text-left font-bold"
                    >
                      <User className="w-4 h-4" /> Personal Profile
                    </button>
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        navigate('/wellness');
                      }}
                      className="flex items-center gap-3 w-full px-3.5 py-2 rounded-xl text-xs text-gray-700 hover:text-[#7C5CFF] hover:bg-gray-50 transition-all text-left font-bold"
                    >
                      <Heart className="w-4 h-4 text-[#7C5CFF]" /> Calming Targets
                    </button>
                    <button className="flex items-center gap-3 w-full px-3.5 py-2 rounded-xl text-xs text-gray-700 hover:text-[#7C5CFF] hover:bg-gray-50 transition-all text-left font-bold">
                      <HelpCircle className="w-4 h-4" /> Support Portal
                    </button>

                    <div className="h-px bg-gray-100 my-2"></div>

                    <button
                      onClick={logout}
                      className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-50/50 transition-all text-left font-bold"
                    >
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

        </div>
      </div>
    </header>
  );
}
