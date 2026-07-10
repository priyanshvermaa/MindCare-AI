import React from 'react';
import { 
  Brain, LayoutDashboard, Calendar, BookOpen, BarChart3, Settings, 
  LogOut, Heart, Users, Crown, LifeBuoy, Flower2, PhoneCall, Droplet
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import UserAvatar from '../ui/UserAvatar';

export default function Sidebar({ isOpen, setIsOpen }) {
  const { logout, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'Water Intake', icon: Droplet, path: '/water-intake' },
    { name: 'AI Assistant', icon: Brain, path: '/ai-assistant' },
    { name: 'Mood Tracker', icon: Calendar, path: '/mood-tracker' },
    { name: 'Journal', icon: BookOpen, path: '/journal' },
    { name: 'Meditation', icon: Flower2, path: '/meditation' },
    { name: 'Wellness & Habits', icon: Heart, path: '/wellness' },
    { name: 'Analytics', icon: BarChart3, path: '/analytics' },
    { name: 'Settings', icon: Settings, path: '/settings' }
  ];

  if (user && user.role === 'admin') {
    menuItems.push({ name: 'Admin Panel', icon: Crown, path: '/admin' });
  }

  return (
    <aside
      className={`fixed top-0 left-0 bottom-0 z-40 bg-white border-r border-[#E5E7EB] transition-all duration-300 flex flex-col justify-between shrink-0 font-poppins ${
        isOpen ? 'w-64' : 'w-20'
      }`}
    >
      {/* Sidebar Header Logo */}
      <div className="px-6 flex items-center justify-between border-b border-[#E5E7EB] shrink-0 h-[73px]">
        <Link to="/" className="flex items-center gap-2 overflow-hidden">
          <div className="w-8.5 h-8.5 rounded-lg bg-gradient-to-tr from-[#7C5CFF] to-[#A88BFF] flex items-center justify-center shadow-md shadow-[#7C5CFF]/20 shrink-0">
            <Brain className="w-4.5 h-4.5 text-white" />
          </div>
          {isOpen && (
            <span className="font-black text-base tracking-tight text-[#1E1B4B] truncate">
              MindCare <span className="text-[#7C5CFF]">AI</span>
            </span>
          )}
        </Link>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {menuItems.map((item, idx) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={idx}
              to={item.path}
              className={`flex items-center gap-4 px-4 py-3 rounded-xl font-bold text-xs tracking-wide uppercase transition-all duration-200 relative group ${
                isActive
                  ? 'text-[#7C5CFF] bg-[#7C5CFF]/8'
                  : 'text-gray-500 hover:text-[#7C5CFF] hover:bg-gray-50/60'
              }`}
            >
              <Icon className={`w-4.5 h-4.5 shrink-0 ${isActive ? 'text-[#7C5CFF]' : 'text-gray-400 group-hover:text-[#7C5CFF] transition-colors'}`} />
              {isOpen && <span className="truncate">{item.name}</span>}
              {!isOpen && (
                <div className="absolute left-16 bg-white text-gray-900 text-xxs px-2.5 py-1.5 rounded border border-[#E5E7EB] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-lg">
                  {item.name}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Profile Summary / Logout / SOS */}
      <div className="p-4 border-t border-[#E5E7EB] flex flex-col gap-2 shrink-0 bg-gray-50/50">
        {isOpen && user && (
          <div className="flex items-center gap-3 px-3 py-2.5 bg-white rounded-2xl border border-[#E5E7EB] shadow-sm mb-1 text-left">
            <UserAvatar user={user} className="w-10 h-10 rounded-full" textClassName="text-xs" />
            <div className="overflow-hidden">
              <span className="font-extrabold text-xs text-gray-900 block truncate leading-tight">
                {user.name === 'Test User' ? 'Priyansh Verma' : user.name}
              </span>
              <span className="text-[9px] text-gray-400 font-bold block truncate uppercase mt-0.5 tracking-wider">
                {user.role === 'admin' ? 'Administrator' : 'Resilience Advisor'}
              </span>
            </div>
          </div>
        )}

        <button
          onClick={logout}
          className={`flex items-center gap-4 px-4 py-3 rounded-xl font-bold text-xs tracking-wide uppercase transition-all w-full text-left border border-rose-100 text-[#F43F5E] bg-rose-50/30 hover:bg-rose-50/60 ${
            !isOpen && 'justify-center px-0'
          }`}
        >
          <LogOut className="w-4.5 h-4.5 shrink-0" />
          {isOpen && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
