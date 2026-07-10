import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/dashboard/Sidebar';
import TopNav from '../components/dashboard/TopNav';
import api from '../services/api';
import UserAvatar from '../components/ui/UserAvatar';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Crown, Activity, UserPlus, FileText, BarChart3,
  Search, Filter, Download, Eye, Trash2, ChevronsLeft, 
  ChevronLeft, ChevronRight, ChevronsRight, ChevronDown, Bell, 
  X, Check, AlertCircle, ShieldAlert, Shield, ShieldX, UserCheck
} from 'lucide-react';

export default function AdminDashboard() {
  const { user: currentAdmin, refreshUserProfile } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const queryClient = useQueryClient();

  // Search, Filters & Pagination Local States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all', 'user', 'admin', 'active', 'inactive', 'blocked'
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const [limit] = useState(5); // Show 5 users per page as in the reference screenshot

  // Overlay States
  const [viewUserDetail, setViewUserDetail] = useState(null);
  const [editUser, setEditUser] = useState(null); // { _id, name, email, role, isSuspended }
  const [deleteConfirm, setDeleteConfirm] = useState(null); // user object

  // Custom Toast state
  const [toast, setToast] = useState(null); // { type: 'success' | 'error', message: string }

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // 1. Fetch live metrics (React Query)
  const { 
    data: statsData, 
    isLoading: statsLoading 
  } = useQuery({
    queryKey: ['adminDashboardStats'],
    queryFn: async () => {
      const res = await api.get('/admin/dashboard');
      return res.data?.stats || {
        totalUsers: 0,
        totalAdmins: 0,
        activeUsers: 0,
        newUsersToday: 0,
        totalJournalEntries: 0,
        totalMeditationSessions: 0
      };
    },
    refetchInterval: 15000 // Automatically sync statistics every 15 seconds
  });

  // 2. Fetch users directory list (React Query)
  const { 
    data: usersData, 
    isLoading: usersLoading,
    isPlaceholderData
  } = useQuery({
    queryKey: ['adminUsersList', searchQuery, filterType, sortBy, page],
    queryFn: async () => {
      const res = await api.get('/admin/users', {
        params: {
          search: searchQuery,
          filter: filterType,
          sortBy,
          page,
          limit
        }
      });
      return res.data;
    },
    placeholderData: (prev) => prev
  });

  // 3. Mutate (Update role/profile status)
  const updateUserMutation = useMutation({
    mutationFn: async (updatedPayload) => {
      const res = await api.patch(`/admin/user/${updatedPayload.id}`, updatedPayload);
      return res.data;
    },
    onSuccess: async (data, variables) => {
      showToast('success', data.message || 'User profile updated successfully.');
      queryClient.invalidateQueries({ queryKey: ['adminUsersList'] });
      queryClient.invalidateQueries({ queryKey: ['adminDashboardStats'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['auth'] });
      
      const isSelf = currentAdmin && (variables.id === currentAdmin.id || variables.id === currentAdmin._id);
      if (isSelf) {
        await refreshUserProfile();
      }
      setEditUser(null);
    },
    onError: (err) => {
      showToast('error', err.response?.data?.message || 'Failed to update user.');
    }
  });

  // 4. Mutate (Soft delete user)
  const deleteUserMutation = useMutation({
    mutationFn: async (userId) => {
      const res = await api.delete(`/admin/user/${userId}`);
      return res.data;
    },
    onSuccess: (data) => {
      showToast('success', data.message || 'User soft-deleted successfully.');
      queryClient.invalidateQueries({ queryKey: ['adminUsersList'] });
      queryClient.invalidateQueries({ queryKey: ['adminDashboardStats'] });
      setDeleteConfirm(null);
    },
    onError: (err) => {
      showToast('error', err.response?.data?.message || 'Failed to delete user.');
    }
  });

  // Export Filtered Users
  const handleExportCSV = async () => {
    try {
      const res = await api.get('/admin/export', {
        params: {
          search: searchQuery,
          filter: filterType,
          sortBy
        },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `mindcare_export_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      showToast('success', 'Filtered users list successfully exported as CSV.');
    } catch (err) {
      showToast('error', 'Failed to generate outbound CSV download.');
    }
  };

  const usersList = usersData?.users || [];
  const pagination = usersData?.pagination || { page: 1, limit: 5, totalPages: 1, totalUsers: 0 };

  // Calculate current pagination index details
  const currentStart = pagination.totalUsers === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
  const currentEnd = Math.min(pagination.page * pagination.limit, pagination.totalUsers);

  // Status badging layout helper
  const renderStatusBadge = (u) => {
    if (u.isDeleted) {
      return (
        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-gray-100 text-gray-500">
          Deleted
        </span>
      );
    }
    if (u.isSuspended) {
      return (
        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-500">
          Inactive
        </span>
      );
    }

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const isActive = u.lastActiveAt && new Date(u.lastActiveAt) >= oneDayAgo;

    if (isActive) {
      return (
        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-600">
          Active
        </span>
      );
    } else {
      return (
        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-600">
          Offline
        </span>
      );
    }
  };

  // Format relative last active text
  const formatLastActive = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#1E1B4B] flex font-poppins select-none relative">
      
      {/* Sidebar navigation */}
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div className={`flex-1 transition-all duration-300 min-h-screen flex flex-col ${
        sidebarOpen ? 'md:pl-64' : 'md:pl-20'
      }`}>
        
        {/* Navigation header */}
        <TopNav onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 px-6 md:px-8 py-6 md:py-8 max-w-7xl mx-auto w-full space-y-8 text-left relative z-10 font-medium">
          
          {/* Header Row with top-right actions matching screenshot */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 shrink-0">
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none">Admin Dashboard</h1>
              <p className="text-xs text-gray-500 font-bold mt-2.5">
                Welcome back, Admin! Here's an overview of your platform.
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Notification icon */}
              <button className="relative w-10 h-10 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors shadow-sm">
                <Bell className="w-5 h-5" />
                <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[#7C5CFF]" />
              </button>

              {/* User Dropdown */}
              <div className="flex items-center gap-2.5 bg-white border border-slate-200 px-3.5 py-1.5 rounded-full shadow-sm">
                <div className="w-7.5 h-7.5 rounded-full bg-gradient-to-tr from-[#7C5CFF] to-[#A88BFF] flex items-center justify-center text-white font-black text-xs shrink-0 shadow-sm">
                  A
                </div>
                <span className="font-extrabold text-xs text-slate-800">Admin User</span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Toast Notification Alert */}
          <AnimatePresence>
            {toast && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`fixed top-6 right-6 z-50 p-4 rounded-[20px] shadow-lg border text-xs font-semibold flex items-center gap-2.5 ${
                  toast.type === 'success' 
                    ? 'bg-[#4CAF50]/10 border-[#4CAF50]/20 text-[#4CAF50]' 
                    : 'bg-rose-500/10 border-rose-500/20 text-rose-600'
                }`}
              >
                {toast.type === 'success' ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                {toast.message}
              </motion.div>
            )}
          </AnimatePresence>

          {/* 1. Six Stats Cards Row */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            
            {/* Card 1: Total Users */}
            <div className="bg-white border border-slate-100 p-5 rounded-[24px] shadow-sm flex flex-col justify-between h-28 hover:border-[#7C5CFF]/20 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-[#73768F] font-black uppercase tracking-wider block">Total Users</span>
                <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center text-[#7C5CFF]">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2">
                <span className="text-2xl font-black text-slate-800 block leading-tight">
                  {statsLoading ? '...' : (statsData?.totalUsers || 0).toLocaleString()}
                </span>
                <span className="text-[9px] text-emerald-600 font-bold block mt-1">
                  ↗ 12.5% <span className="text-gray-400">vs last month</span>
                </span>
              </div>
            </div>

            {/* Card 2: Total Admins */}
            <div className="bg-white border border-slate-100 p-5 rounded-[24px] shadow-sm flex flex-col justify-between h-28 hover:border-[#7C5CFF]/20 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-[#73768F] font-black uppercase tracking-wider block">Total Admins</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-650">
                  <Crown className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2">
                <span className="text-2xl font-black text-slate-800 block leading-tight">
                  {statsLoading ? '...' : (statsData?.totalAdmins || 0).toLocaleString()}
                </span>
                <span className="text-[9px] text-emerald-600 font-bold block mt-1">
                  ↗ 14.3% <span className="text-gray-400">vs last month</span>
                </span>
              </div>
            </div>

            {/* Card 3: Active Users */}
            <div className="bg-white border border-slate-100 p-5 rounded-[24px] shadow-sm flex flex-col justify-between h-28 hover:border-[#7C5CFF]/20 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-[#73768F] font-black uppercase tracking-wider block">Active Users</span>
                <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
                  <Activity className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2">
                <span className="text-2xl font-black text-slate-800 block leading-tight">
                  {statsLoading ? '...' : (statsData?.activeUsers || 0).toLocaleString()}
                </span>
                <span className="text-[9px] text-emerald-600 font-bold block mt-1">
                  ↗ 8.7% <span className="text-gray-400">vs last month</span>
                </span>
              </div>
            </div>

            {/* Card 4: New Users Today */}
            <div className="bg-white border border-slate-100 p-5 rounded-[24px] shadow-sm flex flex-col justify-between h-28 hover:border-[#7C5CFF]/20 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-[#73768F] font-black uppercase tracking-wider block">New Users Today</span>
                <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500">
                  <UserPlus className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2">
                <span className="text-2xl font-black text-slate-800 block leading-tight">
                  {statsLoading ? '...' : (statsData?.newUsersToday || 0).toLocaleString()}
                </span>
                <span className="text-[9px] text-emerald-600 font-bold block mt-1">
                  ↗ 21.1% <span className="text-gray-400">vs yesterday</span>
                </span>
              </div>
            </div>

            {/* Card 5: Journal Entries */}
            <div className="bg-white border border-slate-100 p-5 rounded-[24px] shadow-sm flex flex-col justify-between h-28 hover:border-[#7C5CFF]/20 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-[#73768F] font-black uppercase tracking-wider block">Journal Entries</span>
                <div className="w-8 h-8 rounded-xl bg-pink-50 flex items-center justify-center text-pink-500">
                  <FileText className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2">
                <span className="text-2xl font-black text-slate-800 block leading-tight">
                  {statsLoading ? '...' : (statsData?.totalJournalEntries || 0).toLocaleString()}
                </span>
                <span className="text-[9px] text-emerald-600 font-bold block mt-1">
                  ↗ 15.2% <span className="text-gray-400">vs last month</span>
                </span>
              </div>
            </div>

            {/* Card 6: Total Sessions */}
            <div className="bg-white border border-slate-100 p-5 rounded-[24px] shadow-sm flex flex-col justify-between h-28 hover:border-[#7C5CFF]/20 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-[#73768F] font-black uppercase tracking-wider block">Total Sessions</span>
                <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-[#7C5CFF]">
                  <BarChart3 className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2">
                <span className="text-2xl font-black text-slate-800 block leading-tight">
                  {statsLoading ? '...' : (statsData?.totalMeditationSessions || 0).toLocaleString()}
                </span>
                <span className="text-[9px] text-emerald-600 font-bold block mt-1">
                  ↗ 10.3% <span className="text-gray-400">vs last month</span>
                </span>
              </div>
            </div>

          </div>

          {/* 2. Users Management Table Component */}
          <div className="bg-white border border-slate-150 rounded-3xl p-6 shadow-sm text-left">
            
            {/* Header controls layout */}
            <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 mb-6">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Users Management</h3>
                <p className="text-[11px] text-gray-400 font-bold mt-1">View, manage and update user accounts.</p>
              </div>

              {/* Searching, sorting & filter controls */}
              <div className="flex flex-col md:flex-row items-center w-full lg:flex-1 justify-end gap-4 md:gap-0">
                
                {/* Search field */}
                <div className="relative w-full md:flex-1 h-12 md:mr-6">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-405 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={e => {
                      setSearchQuery(e.target.value);
                      setPage(1);
                    }}
                    className="w-full h-full bg-[#FAFAFC] border border-[#ECE7FF] rounded-xl pl-11 pr-4 text-xs text-slate-800 placeholder-gray-450 focus:outline-none focus:border-[#7C5CFF] focus:ring-1 focus:ring-[#7C5CFF] font-semibold"
                  />
                </div>

                {/* Filter Selector */}
                <div className="relative h-12 w-full md:w-[180px] shrink-0 md:mr-4">
                  <select
                    value={filterType}
                    onChange={e => {
                      setFilterType(e.target.value);
                      setPage(1);
                    }}
                    className="w-full h-full bg-white border border-[#ECE7FF] rounded-xl pl-4 pr-10 text-xs text-slate-800 font-bold focus:outline-none focus:border-[#7C5CFF] cursor-pointer appearance-none"
                  >
                    <option value="all">All Statuses</option>
                    <option value="user">Role: User</option>
                    <option value="admin">Role: Admin</option>
                    <option value="active">Active (24h)</option>
                    <option value="inactive">Inactive</option>
                    <option value="blocked">Blocked</option>
                    <option value="deleted">Soft Deleted</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-405 w-4 h-4" />
                </div>

                {/* Export button */}
                <button
                  onClick={handleExportCSV}
                  className="h-12 px-6 bg-[#7C5CFF] hover:bg-[#6D4AE5] active:scale-95 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-3 shadow-sm shadow-[#7C5CFF]/15 w-full md:w-auto shrink-0"
                >
                  <Download className="w-4 h-4 shrink-0" />
                  <span>Export</span>
                </button>

              </div>
            </div>

            {/* Table layout matching screenshot */}
            {usersLoading ? (
              <div className="space-y-3 py-6 animate-pulse">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-14 bg-gray-50 border border-gray-100 rounded-2xl" />
                ))}
              </div>
            ) : usersList.length > 0 ? (
              <div className="overflow-x-auto w-full border border-slate-100 rounded-2xl">
                <table className="w-full min-w-[800px] border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/70 border-b border-slate-150 text-[#73768F] font-extrabold uppercase tracking-wider">
                      <th className="py-4 px-6 text-left">User</th>
                      <th className="py-4 px-6 text-left">Email</th>
                      <th className="py-4 px-6 text-left">Role</th>
                      <th className="py-4 px-6 text-left">Status</th>
                      <th className="py-4 px-6 text-left">Joined On</th>
                      <th className="py-4 px-6 text-left">Last Active</th>
                      <th className="py-4 px-6 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {usersList.map((targetUser) => {
                      const initial = targetUser.name ? targetUser.name.charAt(0).toUpperCase() : 'U';
                      const isSelf = currentAdmin && (currentAdmin.id === targetUser._id || currentAdmin._id === targetUser._id);
                      
                      return (
                        <tr key={targetUser._id} className={`hover:bg-slate-50/30 transition-colors ${targetUser.isDeleted ? 'bg-slate-50/20 opacity-70' : ''}`}>
                          
                          {/* User Avatar badge & Name */}
                          <td className="py-4 px-6 flex items-center gap-3">
                            <UserAvatar user={targetUser} className="w-8 h-8 rounded-full shadow-sm" textClassName="text-xs" />
                            <div className="min-w-0">
                              <span className="font-extrabold text-slate-800 block truncate">
                                {targetUser.name}
                                {isSelf && <span className="text-[8px] font-black uppercase text-[#7C5CFF] bg-[#7C5CFF]/10 px-1.5 py-0.5 rounded ml-1.5">You</span>}
                              </span>
                            </div>
                          </td>

                          {/* Email */}
                          <td className="py-4 px-6 text-[#73768F] font-semibold break-all">
                            {targetUser.email}
                          </td>

                          {/* Role Badge matching screenshot */}
                          <td className="py-4 px-6">
                            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                              targetUser.role === 'admin' 
                                ? 'bg-[#7C5CFF]/10 text-[#7C5CFF] border border-[#7C5CFF]/10' 
                                : 'bg-blue-50 text-blue-600 border border-blue-100'
                            }`}>
                              {targetUser.role === 'admin' ? 'Admin' : 'User'}
                            </span>
                          </td>

                          {/* Status Badge */}
                          <td className="py-4 px-6">
                            {renderStatusBadge(targetUser)}
                          </td>

                          {/* Joined On */}
                          <td className="py-4 px-6 text-[#73768F] font-semibold">
                            {new Date(targetUser.createdAt).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </td>

                          {/* Last Active */}
                          <td className="py-4 px-6 text-[#73768F] font-semibold">
                            {targetUser.isDeleted ? 'Offline' : formatLastActive(targetUser.lastActiveAt || targetUser.updatedAt)}
                          </td>

                          {/* Actions column buttons matching screenshot */}
                          <td className="py-4 px-6 text-center">
                            <div className="flex gap-2 justify-center">
                              {/* View button */}
                              <button
                                onClick={() => handleViewUser(targetUser)}
                                title="View profile metrics"
                                className="p-1.5 rounded-lg bg-slate-50 border border-slate-150 text-slate-400 hover:text-slate-700 transition-colors shadow-sm"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              {/* Edit details/role button */}
                              <button
                                onClick={() => setEditUser({
                                  id: targetUser._id,
                                  name: targetUser.name,
                                  email: targetUser.email,
                                  role: targetUser.role,
                                  isSuspended: targetUser.isSuspended
                                })}
                                disabled={isSelf}
                                title={isSelf ? 'Cannot edit self' : 'Edit profile / change role'}
                                className={`p-1.5 rounded-lg border shadow-sm transition-colors ${
                                  isSelf 
                                    ? 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed' 
                                    : 'bg-purple-50 border-purple-100 text-[#7C5CFF] hover:bg-[#7C5CFF]/10'
                                }`}
                              >
                                <UserCheck className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete button */}
                              <button
                                onClick={() => setDeleteConfirm(targetUser)}
                                disabled={isSelf || targetUser.isDeleted}
                                title={isSelf ? 'Cannot delete self' : 'Soft delete user'}
                                className={`p-1.5 rounded-lg border shadow-sm transition-colors ${
                                  isSelf || targetUser.isDeleted
                                    ? 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed' 
                                    : 'bg-rose-50 border-rose-100 text-rose-500 hover:bg-rose-100/30'
                                }`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>

                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-gray-400 border border-slate-100 rounded-3xl">
                No user records found matching criteria.
              </div>
            )}

            {/* Pagination block matching screenshot layout */}
            {pagination.totalPages > 1 && (
              <div className="flex flex-col sm:flex-row justify-between items-center mt-6 pt-4 border-t border-slate-100 gap-4">
                <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wide">
                  Showing {currentStart} to {currentEnd} of {pagination.totalUsers.toLocaleString()} users
                </span>
                
                <div className="flex items-center gap-1.5">
                  {/* First page button */}
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(1)}
                    className="p-2 rounded-xl border border-slate-200 text-gray-450 hover:bg-slate-50 disabled:opacity-40"
                  >
                    <ChevronsLeft className="w-3.5 h-3.5" />
                  </button>

                  {/* Previous page button */}
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(prev => Math.max(1, prev - 1))}
                    className="p-2 rounded-xl border border-slate-200 text-gray-450 hover:bg-slate-50 disabled:opacity-40"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>

                  {/* Page numbers list */}
                  {[...Array(pagination.totalPages)].map((_, idx) => {
                    const pageNum = idx + 1;
                    const isActive = pageNum === page;
                    
                    // Show first 3 page options, ellipsis, and last page if totalPages > 5
                    if (pagination.totalPages > 5) {
                      if (pageNum > 3 && pageNum < pagination.totalPages) {
                        if (pageNum === 4) {
                          return (
                            <span key={pageNum} className="px-2.5 text-gray-400 text-xs font-bold">
                              ...
                            </span>
                          );
                        }
                        return null;
                      }
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`w-8 h-8 rounded-xl font-bold text-xs transition-colors border ${
                          isActive 
                            ? 'bg-[#7C5CFF] text-white border-[#7C5CFF]' 
                            : 'border-slate-200 text-gray-500 hover:bg-slate-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  {/* Next page button */}
                  <button
                    disabled={page >= pagination.totalPages}
                    onClick={() => setPage(prev => Math.min(pagination.totalPages, prev + 1))}
                    className="p-2 rounded-xl border border-slate-200 text-gray-450 hover:bg-slate-50 disabled:opacity-40"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  {/* Last page button */}
                  <button
                    disabled={page >= pagination.totalPages}
                    onClick={() => setPage(pagination.totalPages)}
                    className="p-2 rounded-xl border border-slate-200 text-gray-450 hover:bg-slate-50 disabled:opacity-40"
                  >
                    <ChevronsRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

          </div>

        </main>
      </div>

      {/* CONFIRMATION SOFT-DELETE MODAL */}
      <AnimatePresence>
        {deleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirm(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-sm bg-white border border-slate-100 rounded-[32px] p-8 shadow-2xl z-10 text-center space-y-6"
            >
              <div className="w-14 h-14 rounded-3xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto shadow-sm">
                <ShieldAlert className="w-7 h-7" />
              </div>

              <div className="space-y-2.5">
                <h3 className="text-xl font-black text-slate-900 leading-tight">Soft Delete User</h3>
                <p className="text-xs text-gray-500 leading-relaxed font-semibold">
                  Are you absolutely sure you want to soft-delete {deleteConfirm.name}? They will lose dashboard access but their statistics remain archived in MongoDB.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-3 bg-white hover:bg-gray-50 border border-gray-200 text-gray-500 font-extrabold text-xs uppercase tracking-wider rounded-2xl transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteUserMutation.mutate(deleteConfirm._id)}
                  className="flex-1 py-3 bg-rose-500 hover:bg-rose-600 text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl shadow transition-all active:scale-95"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDIT PROFILE & ROLE CHANGE MODAL */}
      <AnimatePresence>
        {editUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditUser(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md bg-white border border-slate-100 rounded-[32px] p-8 shadow-2xl z-10 text-left space-y-5"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-black text-slate-900 leading-none">Edit User Profile</h3>
                <button onClick={() => setEditUser(null)} className="p-1 rounded-full hover:bg-slate-50 text-slate-500">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4 text-xs font-semibold text-slate-700">
                {/* Name */}
                <div>
                  <label className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider block mb-1.5">User Name</label>
                  <input
                    type="text"
                    value={editUser.name}
                    onChange={e => setEditUser({ ...editUser, name: e.target.value })}
                    className="w-full h-10 px-3 bg-[#FAFAFC] border border-slate-200 rounded-xl font-semibold focus:outline-none focus:border-[#7C5CFF]"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider block mb-1.5">Email address</label>
                  <input
                    type="email"
                    value={editUser.email}
                    onChange={e => setEditUser({ ...editUser, email: e.target.value })}
                    className="w-full h-10 px-3 bg-[#FAFAFC] border border-slate-200 rounded-xl font-semibold focus:outline-none focus:border-[#7C5CFF]"
                  />
                </div>

                {/* Role dropdown */}
                <div>
                  <label className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider block mb-1.5">Platform Role</label>
                  <select
                    value={editUser.role}
                    onChange={e => setEditUser({ ...editUser, role: e.target.value })}
                    className="w-full h-10 px-3 bg-[#FAFAFC] border border-slate-200 rounded-xl font-semibold focus:outline-none focus:border-[#7C5CFF]"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                {/* Suspension Status */}
                <div className="flex items-center gap-2.5 pt-2">
                  <input
                    type="checkbox"
                    id="isSuspendedCheck"
                    checked={editUser.isSuspended}
                    onChange={e => setEditUser({ ...editUser, isSuspended: e.target.checked })}
                    className="accent-[#7C5CFF] w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="isSuspendedCheck" className="text-xs font-bold text-slate-700 cursor-pointer select-none">
                    Suspend this account (blocks login access)
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  onClick={() => setEditUser(null)}
                  className="flex-1 py-3 bg-white hover:bg-gray-50 border border-gray-200 text-gray-500 font-extrabold text-xs uppercase tracking-wider rounded-2xl transition-all"
                >
                  Cancel
                </button>
                 <button
                  onClick={() => updateUserMutation.mutate(editUser)}
                  disabled={updateUserMutation.isPending}
                  className="flex-1 py-3 bg-[#7C5CFF] hover:bg-[#6D4AE5] text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl shadow transition-all active:scale-95 text-center flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updateUserMutation.isPending ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Saving...</span>
                    </>
                  ) : (
                    'Save Updates'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* READ-ONLY DRAWER FOR DIAGNOSTICS & TELEMETRY */}
      <AnimatePresence>
        {viewUserDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-end p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewUserDetail(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '100%', opacity: 0.9 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0.9 }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative w-full max-w-md bg-white rounded-[32px] h-full shadow-2xl z-10 flex flex-col overflow-hidden text-left"
            >
              <div className="p-6 bg-gradient-to-r from-[#7C5CFF]/10 to-[#FAF8FF] border-b border-slate-100 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                  <UserAvatar user={viewUserDetail} className="w-10 h-10 rounded-full shadow-sm" textClassName="text-sm" />
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900 leading-tight">{viewUserDetail.name}</h4>
                    <span className="text-[9px] font-bold text-gray-400 block uppercase tracking-wider mt-0.5">Diagnostics Overview</span>
                  </div>
                </div>
                <button
                  onClick={() => setViewUserDetail(null)}
                  className="p-1.5 rounded-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-500 shadow-sm transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Drawer Content Body */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs select-text leading-relaxed font-semibold text-slate-700 scrollbar-thin">
                
                {/* Profile details */}
                <div className="space-y-3.5">
                  <h5 className="text-[10px] font-black uppercase text-[#7C5CFF] tracking-wider border-b border-slate-50 pb-2">Profile details</h5>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider block">Email Address</span>
                      <span className="font-semibold text-slate-800 break-all">{viewUserDetail.email}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider block">System Role</span>
                      <span className="font-semibold text-slate-800 uppercase tracking-wider text-[10px]">{viewUserDetail.role}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider block">Recorded Age</span>
                      <span className="font-semibold text-slate-800">{viewUserDetail.age || 'Not provided'} yrs</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider block">Registration Date</span>
                      <span className="font-semibold text-slate-500">{new Date(viewUserDetail.registrationDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Stats Counters */}
                <div className="space-y-3.5">
                  <h5 className="text-[10px] font-black uppercase text-emerald-600 tracking-wider border-b border-slate-50 pb-2">Wellness Diagnostics</h5>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-3 bg-[#FAF8FF] border border-[#E9E2FF] rounded-2xl">
                      <span className="text-[18px] font-black text-slate-850 block">{viewUserDetail.wellnessScore || 'N/A'}</span>
                      <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider block mt-1">Health Score</span>
                    </div>
                    <div className="p-3 bg-purple-50/40 border border-[#E9E2FF] rounded-2xl">
                      <span className="text-[18px] font-black text-[#7C5CFF] block">{viewUserDetail.meditationCount}</span>
                      <span className="text-[8px] font-bold text-gray-455 uppercase tracking-wider block mt-1">Meditations</span>
                    </div>
                    <div className="p-3 bg-emerald-50/40 border border-emerald-100 rounded-2xl">
                      <span className="text-[18px] font-black text-emerald-600 block">{viewUserDetail.journalsCount}</span>
                      <span className="text-[8px] font-bold text-gray-455 uppercase tracking-wider block mt-1">Journals</span>
                    </div>
                  </div>
                </div>

                {/* AI Insight Summary */}
                <div className="space-y-3.5">
                  <h5 className="text-[10px] font-black uppercase text-[#7C5CFF] tracking-wider border-b border-slate-50 pb-2 flex items-center gap-1.5">
                    <Crown className="w-3.5 h-3.5 text-indigo-500" /> AI Wellness Analysis
                  </h5>
                  <div className="p-4 bg-purple-50/20 border border-[#E9E2FF]/70 rounded-[20px] leading-relaxed font-semibold text-slate-700 text-xxs">
                    "{viewUserDetail.aiWellnessSummary || 'No wellness summary generated yet.'}"
                  </div>
                </div>

                {/* Habits, goals and physical attributes */}
                <div className="space-y-3.5">
                  <h5 className="text-[10px] font-black uppercase text-gray-400 tracking-wider border-b border-slate-50 pb-2">Physical Configs</h5>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider block">Wellness Goal</span>
                      <span className="font-semibold text-slate-800">{viewUserDetail.wellnessGoal || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider block">Activity Level</span>
                      <span className="font-semibold text-slate-800">{viewUserDetail.activityLevel || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider block">Height / Weight</span>
                      <span className="font-semibold text-slate-800">{viewUserDetail.height || 'N/A'} cm / {viewUserDetail.weight || 'N/A'} kg</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider block">Last Login Activity</span>
                      <span className="font-semibold text-slate-500">{new Date(viewUserDetail.lastLogin).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

              </div>

              <div className="p-5 border-t border-slate-150 bg-slate-50 shrink-0 text-center text-xxs text-gray-400 font-extrabold uppercase tracking-wide">
                Read-only Diagnostics console
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );

  // View User Profile Loader Helper
  async function handleViewUser(targetUser) {
    try {
      const res = await api.get(`/admin/user/${targetUser._id}`);
      if (res.data.success) {
        setViewUserDetail(res.data.profile);
      }
    } catch (err) {
      showToast('error', 'Failed to retrieve detailed diagnostic logs.');
    }
  }
}
