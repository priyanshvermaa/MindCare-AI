import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/dashboard/Sidebar';
import TopNav from '../components/dashboard/TopNav';
import { useTheme } from '../context/ThemeContext';
import { Skeleton } from '../components/ui/Skeleton';
import {
  User, Lock, Bell, Shield, Check, Save,
  Trash2, LogOut, AlertCircle, Settings as SettingsIcon, Heart, ArrowRight
} from 'lucide-react';
import api from '../services/api';

export default function Settings() {
  const { user, logout, updateUserProfile, refreshUserProfile } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { isLightMode } = useTheme();

  // Active Tab Settings Section
  const [activeTab, setActiveTab] = useState('profile'); // 'profile', 'security', 'notifications', 'account'

  // Loading & Error States
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Settings State Form
  const [profileForm, setProfileForm] = useState({
    name: '',
    username: '',
    email: '',
    phoneNumber: '',
    avatar: '',
    age: '',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [notificationsForm, setNotificationsForm] = useState({
    emailNotifications: true,
    moodReminder: true,
    journalReminder: true,
    habitReminder: true,
    pushNotifications: true,
    communityNotifications: true
  });

  const [personalForm, setPersonalForm] = useState({
    age: '',
    height: '',
    weight: '',
    activityLevel: 'Moderate',
    wellnessGoal: 'Stress Reduction'
  });

  // Load Settings
  const fetchSettings = async () => {
    setLoading(true);
    try {
      const [settingsRes, profileRes] = await Promise.all([
        api.get('/settings'),
        api.get('/user/profile')
      ]);

      if (settingsRes.data.success) {
        const { settings } = settingsRes.data;
        setProfileForm({
          name: settings.name || '',
          username: settings.username || '',
          email: settings.email || '',
          phoneNumber: settings.phoneNumber || '',
          avatar: settings.avatar || '',
          age: settings.age || '',
        });
        setNotificationsForm(settings.notifications || {});
      }

      if (profileRes.data.success) {
        const { profile } = profileRes.data;
        setPersonalForm({
          age: profile.age || '',
          height: profile.height || '',
          weight: profile.weight || '',
          activityLevel: profile.activityLevel || 'Moderate',
          wellnessGoal: profile.wellnessGoal || 'Stress Reduction'
        });
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch user settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const triggerMessage = (type, msg) => {
    if (type === 'success') {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(null), 3000);
    } else {
      setError(msg);
      setTimeout(() => setError(null), 3000);
    }
  };

  // Save Settings
  const handleSaveSettings = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: profileForm.name,
        username: profileForm.username,
        email: profileForm.email,
        phoneNumber: profileForm.phoneNumber,
        avatar: profileForm.avatar,
        age: profileForm.age ? parseInt(profileForm.age, 10) : null,
        notifications: notificationsForm
      };
      
      const response = await api.put('/settings', payload);
      if (response.data.success) {
        triggerMessage('success', response.data.message || 'Settings saved successfully!');
        await refreshUserProfile();
      }
    } catch (err) {
      console.error(err);
      triggerMessage('error', err.response?.data?.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePersonal = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        age: personalForm.age ? parseInt(personalForm.age, 10) : null,
        height: personalForm.height ? parseFloat(personalForm.height) : null,
        weight: personalForm.weight ? parseFloat(personalForm.weight) : null,
        activityLevel: personalForm.activityLevel,
        wellnessGoal: personalForm.wellnessGoal
      };

      const response = await updateUserProfile(payload);
      if (response.success) {
        triggerMessage('success', 'Personal information saved successfully!');
        setProfileForm(prev => ({ ...prev, age: payload.age || '' }));
      }
    } catch (err) {
      console.error(err);
      triggerMessage('error', err.response?.data?.message || 'Failed to save personal information.');
    } finally {
      setSaving(false);
    }
  };

  // Change Password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      triggerMessage('error', 'New passwords do not match.');
      return;
    }
    setSaving(true);
    try {
      const response = await api.post('/settings/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      if (response.data.success) {
        triggerMessage('success', response.data.message || 'Password changed successfully!');
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (err) {
      console.error(err);
      triggerMessage('error', err.response?.data?.message || 'Failed to change password.');
    } finally {
      setSaving(false);
    }
  };

  // Delete Account
  const handleDeleteAccount = async () => {
    if (window.confirm('WARNING: Are you sure you want to permanently delete your account? This action cannot be undone.')) {
      try {
        await api.delete('/settings/delete-account');
        alert('Your account has been deleted.');
        logout();
      } catch (err) {
        console.error(err);
        alert('Failed to delete account.');
      }
    }
  };

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'personal', name: 'Personal Info', icon: SettingsIcon },
    { id: 'security', name: 'Security', icon: Lock },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'account', name: 'Account Settings', icon: Shield }
  ];

  return (
    <div className="min-h-screen bg-white text-[#1C1C3A] flex font-poppins select-none relative">
      
      {/* Left Sidebar */}
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div className={`flex-1 transition-all duration-300 min-h-screen flex flex-col ${
        sidebarOpen ? 'md:pl-64' : 'md:pl-20'
      }`}>
        
        {/* Top Navigation */}
        <TopNav
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6 text-left relative z-10">
          
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3 text-left">
              <div className="w-11 h-11 rounded-2xl bg-[#F8F5FF] border border-[#E9E2FF] flex items-center justify-center text-[#7C5CFF] shadow-sm shrink-0">
                <SettingsIcon className="w-5.5 h-5.5" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-[#1C1C3A] tracking-tight">Settings</h1>
                <p className="text-xs text-[#73768F] mt-1 font-semibold leading-relaxed">
                  Manage your profile, security, notifications and personalization settings.
                </p>
              </div>
            </div>
          </div>

          {/* Success / Error Alerts */}
          {successMsg && (
            <div className="p-4 rounded-[20px] bg-[#4CAF50]/10 border border-[#4CAF50]/20 text-[#4CAF50] text-xs font-semibold flex items-center gap-2.5 shadow-sm">
              <Check className="w-4.5 h-4.5 shrink-0" /> {successMsg}
            </div>
          )}
          {error && (
            <div className="p-4 rounded-[20px] bg-[#FF5A6B]/10 border border-[#FF5A6B]/20 text-[#FF5A6B] text-xs font-semibold flex items-center gap-2.5 shadow-sm">
              <AlertCircle className="w-4.5 h-4.5 shrink-0" /> {error}
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-3 space-y-3">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-11 rounded-xl bg-[#FAF8FF] border border-[#E9E2FF]" />
                ))}
              </div>
              <div className="lg:col-span-9">
                <Skeleton className="h-[400px] rounded-[24px] bg-white border border-[#E9E2FF]" />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left Settings categories tabs */}
              <div className="lg:col-span-3 space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        setError(null);
                        setSuccessMsg(null);
                      }}
                      className={`flex items-center gap-3.5 w-full px-4 py-3 rounded-2xl text-left font-bold text-xs transition-all border ${
                        isActive
                          ? 'text-[#7C5CFF] bg-[#F8F5FF] border-[#E9E2FF] shadow-sm shadow-[#7C5CFF]/5'
                          : 'bg-white border-[#E9E2FF] hover:bg-[#FAF8FF] text-[#73768F]'
                      }`}
                    >
                      <Icon className={`w-4.5 h-4.5 shrink-0 ${isActive ? 'text-[#7C5CFF]' : 'text-gray-400'}`} />
                      <span>{tab.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* Right content panel */}
              <div className="lg:col-span-9">
                <div className="bg-white rounded-[24px] p-6 md:p-8 border border-[#E9E2FF] shadow-sm text-left">
                  
                  {/* TAB 1: PROFILE */}
                  {activeTab === 'profile' && (
                    <form onSubmit={handleSaveSettings} className="space-y-6">
                      <h3 className="text-sm font-extrabold text-[#1C1C3A] border-b border-gray-50 pb-3">Edit Profile</h3>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#73768F] mb-1.5 pl-0.5">Display Name</label>
                          <input
                            type="text"
                            value={profileForm.name}
                            onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                            className="w-full bg-[#FAF8FF] border border-[#E9E2FF] rounded-xl px-4 py-3 text-xs text-[#1C1C3A] font-semibold focus:outline-none focus:border-[#7C5CFF] focus:ring-1 focus:ring-[#7C5CFF] transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#73768F] mb-1.5 pl-0.5">Username</label>
                          <input
                            type="text"
                            value={profileForm.username}
                            onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
                            className="w-full bg-[#FAF8FF] border border-[#E9E2FF] rounded-xl px-4 py-3 text-xs text-[#1C1C3A] font-semibold focus:outline-none focus:border-[#7C5CFF] focus:ring-1 focus:ring-[#7C5CFF] transition-all"
                            placeholder="username123"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                        <div>
                          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#73768F] mb-1.5 pl-0.5">Email Address</label>
                          <input
                            type="email"
                            value={profileForm.email}
                            onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                            className="w-full bg-[#FAF8FF] border border-[#E9E2FF] rounded-xl px-4 py-3 text-xs text-[#1C1C3A] font-semibold focus:outline-none focus:border-[#7C5CFF] focus:ring-1 focus:ring-[#7C5CFF] transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#73768F] mb-1.5 pl-0.5">Phone Number</label>
                          <input
                            type="tel"
                            value={profileForm.phoneNumber}
                            onChange={(e) => setProfileForm({ ...profileForm, phoneNumber: e.target.value })}
                            className="w-full bg-[#FAF8FF] border border-[#E9E2FF] rounded-xl px-4 py-3 text-xs text-[#1C1C3A] font-semibold focus:outline-none focus:border-[#7C5CFF] focus:ring-1 focus:ring-[#7C5CFF] transition-all"
                            placeholder="+1 (555) 123-4567"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#73768F] mb-1.5 pl-0.5">Your Age</label>
                          <input
                            type="number"
                            value={profileForm.age}
                            onChange={(e) => setProfileForm({ ...profileForm, age: e.target.value })}
                            className="w-full bg-[#FAF8FF] border border-[#E9E2FF] rounded-xl px-4 py-3 text-xs text-[#1C1C3A] font-semibold focus:outline-none focus:border-[#7C5CFF] focus:ring-1 focus:ring-[#7C5CFF] transition-all"
                            placeholder="Age"
                            min="1"
                            max="120"
                            required
                          />
                        </div>
                      </div>

                      {/* Profile upload details */}
                      <div className="space-y-2">
                        <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#73768F] pl-0.5">Profile Picture</label>
                        <div className="flex flex-col sm:flex-row gap-5 items-center bg-white p-5 rounded-2xl border border-[#E9E2FF] shadow-sm">
                          {profileForm.avatar ? (
                            <img
                              src={profileForm.avatar}
                              alt="Profile Preview"
                              className="w-14 h-14 rounded-full object-cover border border-[#E9E2FF] shrink-0 shadow-md"
                              onError={(e) => { e.target.src = 'https://via.placeholder.com/150'; }}
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#7C5CFF] to-[#A88BFF] flex items-center justify-center text-white font-black text-xl shrink-0 shadow-md shadow-[#7C5CFF]/20">
                              {profileForm.name ? profileForm.name.charAt(0).toUpperCase() : 'U'}
                            </div>
                          )}
                          <div className="flex-1 w-full">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    setProfileForm({ ...profileForm, avatar: reader.result });
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                              className="block w-full text-[10px] text-gray-550 file:mr-4 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-[10px] file:font-extrabold file:uppercase file:bg-[#F8F5FF] file:text-[#7C5CFF] hover:file:bg-[#E9E2FF] cursor-pointer font-bold"
                            />
                          </div>
                        </div>
                      </div>



                      <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-1.5 px-6 py-3 bg-gradient-to-r from-[#7C5CFF] to-[#A98CFF] text-white font-bold text-xs uppercase tracking-wider rounded-full shadow-md shadow-[#7C5CFF]/15 hover:-translate-y-0.5 active:scale-95 transition-all disabled:opacity-50"
                      >
                        <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </form>
                  )}

                  {/* TAB 2: PERSONAL INFORMATION */}
                  {activeTab === 'personal' && (
                    <form onSubmit={handleSavePersonal} className="space-y-6">
                      <h3 className="text-sm font-extrabold text-[#1C1C3A] border-b border-gray-50 pb-3">Personal Information</h3>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                        <div>
                          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#73768F] mb-1.5 pl-0.5">Age (years)</label>
                          <input
                            type="number"
                            value={personalForm.age}
                            onChange={(e) => setPersonalForm({ ...personalForm, age: e.target.value })}
                            className="w-full bg-[#FAF8FF] border border-[#E9E2FF] rounded-xl px-4 py-3 text-xs text-[#1C1C3A] font-semibold focus:outline-none focus:border-[#7C5CFF] focus:ring-1 focus:ring-[#7C5CFF] transition-all"
                            min="1"
                            max="120"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#73768F] mb-1.5 pl-0.5">Height (cm)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={personalForm.height}
                            onChange={(e) => setPersonalForm({ ...personalForm, height: e.target.value })}
                            className="w-full bg-[#FAF8FF] border border-[#E9E2FF] rounded-xl px-4 py-3 text-xs text-[#1C1C3A] font-semibold focus:outline-none focus:border-[#7C5CFF] focus:ring-1 focus:ring-[#7C5CFF] transition-all"
                            placeholder="Height in cm"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#73768F] mb-1.5 pl-0.5">Weight (kg)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={personalForm.weight}
                            onChange={(e) => setPersonalForm({ ...personalForm, weight: e.target.value })}
                            className="w-full bg-[#FAF8FF] border border-[#E9E2FF] rounded-xl px-4 py-3 text-xs text-[#1C1C3A] font-semibold focus:outline-none focus:border-[#7C5CFF] focus:ring-1 focus:ring-[#7C5CFF] transition-all"
                            placeholder="Weight in kg"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#73768F] mb-1.5 pl-0.5">Activity Level</label>
                          <select
                            value={personalForm.activityLevel}
                            onChange={(e) => setPersonalForm({ ...personalForm, activityLevel: e.target.value })}
                            className="w-full bg-[#FAF8FF] border border-[#E9E2FF] rounded-xl px-4 py-3 text-xs text-[#1C1C3A] font-semibold focus:outline-none focus:border-[#7C5CFF] focus:ring-1 focus:ring-[#7C5CFF] transition-all font-semibold"
                          >
                            <option value="Sedentary">Sedentary (Little/no exercise)</option>
                            <option value="Light">Light (1-3 days/week)</option>
                            <option value="Moderate">Moderate (3-5 days/week)</option>
                            <option value="Active">Active (6-7 days/week)</option>
                            <option value="Very Active">Very Active (Athletic/Physical job)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#73768F] mb-1.5 pl-0.5">Wellness Goal</label>
                          <select
                            value={personalForm.wellnessGoal}
                            onChange={(e) => setPersonalForm({ ...personalForm, wellnessGoal: e.target.value })}
                            className="w-full bg-[#FAF8FF] border border-[#E9E2FF] rounded-xl px-4 py-3 text-xs text-[#1C1C3A] font-semibold focus:outline-none focus:border-[#7C5CFF] focus:ring-1 focus:ring-[#7C5CFF] transition-all font-semibold"
                          >
                            <option value="Stress Reduction">Stress Reduction & Mindfulness</option>
                            <option value="Sleep Consistency">Sleep consistency & Quality</option>
                            <option value="Physical Fitness">Physical Fitness & Strength</option>
                            <option value="Hydration Focus">Hydration & Daily Energy</option>
                            <option value="Emotional Balance">Emotional Balance & Reflection</option>
                          </select>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-1.5 px-6 py-3 bg-gradient-to-r from-[#7C5CFF] to-[#A98CFF] text-white font-bold text-xs uppercase tracking-wider rounded-full shadow-md shadow-[#7C5CFF]/15 hover:-translate-y-0.5 active:scale-95 transition-all disabled:opacity-50"
                      >
                        <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Personal Info'}
                      </button>
                    </form>
                  )}

                  {/* TAB 2: SECURITY */}
                  {activeTab === 'security' && (
                    <div className="space-y-8">
                      {/* Password form */}
                      <form onSubmit={handleChangePassword} className="space-y-6">
                        <h3 className="text-sm font-extrabold text-[#1C1C3A] border-b border-gray-50 pb-3">Update Password</h3>
                        
                        <div>
                          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#73768F] mb-1.5 pl-0.5">Current Password</label>
                          <input
                            type="password"
                            required
                            value={passwordForm.currentPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                            className="w-full bg-[#FAF8FF] border border-[#E9E2FF] rounded-xl px-4 py-3 text-xs text-[#1C1C3A] font-semibold focus:outline-none focus:border-[#7C5CFF] focus:ring-1 focus:ring-[#7C5CFF] transition-all"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                          <div>
                            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#73768F] mb-1.5 pl-0.5">New Password</label>
                            <input
                              type="password"
                              required
                              value={passwordForm.newPassword}
                              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                              className="w-full bg-[#FAF8FF] border border-[#E9E2FF] rounded-xl px-4 py-3 text-xs text-[#1C1C3A] font-semibold focus:outline-none focus:border-[#7C5CFF] focus:ring-1 focus:ring-[#7C5CFF] transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#73768F] mb-1.5 pl-0.5">Confirm New Password</label>
                            <input
                              type="password"
                              required
                              value={passwordForm.confirmPassword}
                              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                              className="w-full bg-[#FAF8FF] border border-[#E9E2FF] rounded-xl px-4 py-3 text-xs text-[#1C1C3A] font-semibold focus:outline-none focus:border-[#7C5CFF] focus:ring-1 focus:ring-[#7C5CFF] transition-all"
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={saving}
                          className="flex items-center gap-1.5 px-6 py-3 bg-[#7C5CFF] hover:bg-[#6D4AE5] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-sm transition-colors disabled:opacity-50"
                        >
                          {saving ? 'Updating...' : 'Update Password'}
                        </button>
                      </form>
                    </div>
                  )}

                  {/* TAB 3: NOTIFICATIONS */}
                  {activeTab === 'notifications' && (
                    <form onSubmit={handleSaveSettings} className="space-y-6">
                      <h3 className="text-sm font-extrabold text-[#1C1C3A] border-b border-gray-50 pb-3">Notification Reminders</h3>
                      
                      <div className="space-y-4">
                        {[
                          { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive daily resilience stats digest via email.' },
                          { key: 'moodReminder', label: 'Daily Mood Logging Check-in', desc: 'Alert check-in prompt if mood is not logged by 5 PM.' },
                          { key: 'journalReminder', label: 'CBT Journal Reminders', desc: 'Prompts to record thought distortions when experiencing stress.' },
                          { key: 'habitReminder', label: 'Habit Completeness Alerts', desc: 'Alert notifications for checklist target streaks.' },
                          { key: 'pushNotifications', label: 'Push Desktop Notifications', desc: 'Receive instant notifications inside your browser tab.' },
                          { key: 'communityNotifications', label: 'Community Thread Updates', desc: 'Get updates on comments and likes on your posts.' }
                        ].map((item) => (
                          <div key={item.key} className="flex justify-between items-center bg-[#FAF8FF] p-4.5 rounded-2xl border border-[#E9E2FF] text-xs">
                            <div>
                              <span className="font-bold text-[#1C1C3A] block">{item.label}</span>
                              <span className="text-[10px] text-[#73768F] block mt-0.5">{item.desc}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setNotificationsForm({ ...notificationsForm, [item.key]: !notificationsForm[item.key] })}
                              className={`w-10 h-6 rounded-full transition-colors flex items-center p-0.5 ${
                                notificationsForm[item.key] ? 'bg-[#7C5CFF] justify-end' : 'bg-gray-200 justify-start'
                              }`}
                            >
                              <span className="w-5 h-5 rounded-full bg-white block shadow" />
                            </button>
                          </div>
                        ))}
                      </div>

                      <button
                        type="submit"
                        disabled={saving}
                        className="px-6 py-3 bg-[#7C5CFF] hover:bg-[#6D4AE5] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-sm transition-colors disabled:opacity-50"
                      >
                        {saving ? 'Saving...' : 'Save Notification Toggles'}
                      </button>
                    </form>
                  )}







                  {/* TAB 6: ACCOUNT */}
                  {activeTab === 'account' && (
                    <div className="space-y-6">
                      <h3 className="text-sm font-extrabold text-[#1C1C3A] border-b border-gray-50 pb-3">Critical Actions</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Logout Card */}
                        <div className="p-5 rounded-2xl border border-[#E9E2FF] bg-[#FAF8FF] flex flex-col justify-between h-36">
                          <div>
                            <span className="font-extrabold text-xs text-[#1C1C3A] block">Terminate Active Session</span>
                            <span className="text-[10px] text-[#73768F] block mt-1 font-medium leading-relaxed">Sign out from your current device immediately.</span>
                          </div>
                          <button
                            onClick={logout}
                            className="flex items-center justify-center gap-2 w-full py-2.5 bg-white border border-[#E9E2FF] rounded-xl text-xs font-bold text-[#73768F] hover:bg-gray-50 transition-colors shadow-sm"
                          >
                            <LogOut className="w-4.5 h-4.5" /> Logout Session
                          </button>
                        </div>

                        {/* Delete Account Card */}
                        <div className="p-5 rounded-2xl border border-[#FF5A6B]/20 bg-[#FF5A6B]/5 flex flex-col justify-between h-36">
                          <div>
                            <span className="font-extrabold text-xs text-[#FF5A6B] block">Delete Account Permanently</span>
                            <span className="text-[10px] text-[#73768F] block mt-1 font-medium leading-relaxed">Delete all files, CBT journal entries, and telemetry.</span>
                          </div>
                          <button
                            onClick={handleDeleteAccount}
                            className="flex items-center justify-center gap-2 w-full py-2.5 bg-[#FF5A6B] hover:bg-[#E54859] rounded-xl text-xs font-bold text-white transition-colors shadow-md shadow-[#FF5A6B]/15"
                          >
                            <Trash2 className="w-4.5 h-4.5" /> Delete Account
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </div>

            </div>
          )}

        </main>
      </div>

    </div>
  );
}
