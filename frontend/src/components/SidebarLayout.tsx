import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  FileSearch,
  GraduationCap,
  History,
  Sparkles,
  FileText,
  LineChart,
  Trophy,
  BookOpen,
  User,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Terminal
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { useTheme } from '../context/ThemeContext';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../components/Toast';
import { useInterviewStore } from '../store/interviewStore';

export const SidebarLayout: React.FC = () => {
  const { darkMode } = useTheme();
  const { logout } = useAuthStore();
  const { profile, fetchProfile } = useInterviewStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();

  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar_collapsed');
    return saved ? JSON.parse(saved) : false;
  });
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('sidebar_collapsed', JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  // Load user profile if missing
  useEffect(() => {
    if (!profile) {
      fetchProfile();
    }
  }, [profile, fetchProfile]);

  const handleLogout = () => {
    logout();
    showToast('Signed out successfully.', 'success');
    navigate('/login');
  };

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Resume Analyzer', path: '/resume-analyzer', icon: FileSearch },
    { name: 'Mock Interview', path: '/mock-interviews', icon: GraduationCap },
    { name: 'Interview History', path: '/interview-history', icon: History },
    { name: 'AI Feedback', path: '/ai-feedback', icon: Sparkles },
    { name: 'Reports', path: '/reports', icon: FileText },
    { name: 'Progress Analytics', path: '/progress-analytics', icon: LineChart },
    { name: 'Achievements', path: '/achievements', icon: Trophy },
    { name: 'Practice Center', path: '/practice-center', icon: BookOpen },
    { name: 'Profile', path: '/profile', icon: User },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const currentActiveName = menuItems.find(item => item.path === location.pathname)?.name || 'Portal';

  const sidebarVariants = {
    expanded: { width: 260 },
    collapsed: { width: 80 }
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full py-6">
      {/* Sidebar Logo */}
      <div className={`px-6 flex items-center justify-between mb-8 ${isCollapsed ? 'justify-center' : ''}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-purple to-brand-indigo flex items-center justify-center text-white shadow-md shadow-brand-purple/20 flex-shrink-0">
            <Terminal className="w-5 h-5" />
          </div>
          {!isCollapsed && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="font-display font-extrabold text-base tracking-tight bg-gradient-to-r from-brand-purple to-brand-indigo bg-clip-text text-transparent truncate max-w-[150px]"
            >
              Interview Agent
            </motion.span>
          )}
        </div>
        
        {/* Toggle Collapse Desktop */}
        {!isCollapsed && (
          <button
            onClick={() => setIsCollapsed(true)}
            className={`hidden md:flex w-7 h-7 rounded-lg items-center justify-center border hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors
              ${darkMode ? 'border-white/8 bg-dark-bg/40' : 'border-slate-200 bg-white'}`}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Menu List */}
      <div className="flex-1 px-4 overflow-y-auto space-y-1.5 scrollbar-thin">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <button
              key={item.name}
              onClick={() => {
                navigate(item.path);
                setIsMobileOpen(false);
              }}
              className={`w-full flex items-center gap-3.5 px-4.5 py-3 rounded-xl text-left font-bold text-sm tracking-wide transition-all duration-200 cursor-pointer focus-ring group
                ${isActive
                  ? 'bg-gradient-to-r from-brand-purple/15 to-brand-indigo/10 text-brand-purple border-l-3 border-brand-purple shadow-sm shadow-brand-purple/5'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-white/5 border-l-3 border-transparent'}`}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-105 ${isActive ? 'text-brand-purple' : 'text-slate-400 dark:text-slate-500'}`} />
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="truncate"
                >
                  {item.name}
                </motion.span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer Settings & Logout */}
      <div className="px-4 pt-4 border-t border-slate-200/50 dark:border-white/8 space-y-3">
        {/* Theme and Profile Info */}
        {!isCollapsed && profile && (
          <div className="flex items-center justify-between px-2 mb-2">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-brand-purple/10 border border-brand-purple/20 flex items-center justify-center font-bold text-xs text-brand-purple flex-shrink-0">
                {profile.firstName ? profile.firstName[0].toUpperCase() : 'C'}
              </div>
              <div className="text-left overflow-hidden">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                  {profile.firstName ? `${profile.firstName} ${profile.lastName}` : profile.email.split('@')[0]}
                </p>
                <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 truncate">{profile.email}</p>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-3.5 px-4.5 py-3 rounded-xl text-left font-bold text-sm tracking-wide text-rose-500 dark:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer focus-ring group`}
        >
          <LogOut className="w-5 h-5 flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
          {!isCollapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              Logout
            </motion.span>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen flex transition-colors duration-300
      ${darkMode ? 'bg-dark-bg bg-gradient-mesh text-slate-100' : 'bg-light-bg bg-gradient-mesh-light text-slate-900'}`}
    >
      {/* 1. Desktop Left Sidebar */}
      <motion.aside
        animate={isCollapsed ? 'collapsed' : 'expanded'}
        variants={sidebarVariants}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className={`hidden md:block h-screen sticky top-0 border-r flex-shrink-0 select-none overflow-hidden backdrop-blur-3xl z-40
          ${darkMode ? 'bg-[#08051e]/40 border-white/8 glass-panel' : 'bg-white/85 border-slate-200/50 glass-panel-light'}`}
      >
        <SidebarContent />

        {/* Expand button floating on border if collapsed */}
        {isCollapsed && (
          <button
            onClick={() => setIsCollapsed(false)}
            className={`absolute top-7 right-3 w-7 h-7 rounded-lg flex items-center justify-center border hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors
              ${darkMode ? 'border-white/8 bg-dark-bg/40' : 'border-slate-200 bg-white'}`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </motion.aside>

      {/* 2. Mobile Nav Header & Hamburger Drawer */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 border-b z-50 flex items-center justify-between px-6 backdrop-blur-2xl
        ${darkMode ? 'bg-dark-bg/70 border-white/8' : 'bg-light-bg/75 border-slate-200/50'}"
      >
        <div className="flex items-center gap-2.5">
          <Terminal className="w-5 h-5 text-brand-purple" />
          <span className="font-display font-extrabold text-sm tracking-tight bg-gradient-to-r from-brand-purple to-brand-indigo bg-clip-text text-transparent">
            Interview Agent
          </span>
        </div>
        
        <button
          onClick={() => setIsMobileOpen(true)}
          className={`p-2 rounded-xl border ${darkMode ? 'border-white/8 bg-white/5' : 'border-slate-200 bg-white'}`}
        >
          <Menu className="w-5 h-5 text-slate-500 dark:text-slate-400" />
        </button>
      </div>

      {/* Mobile Drawer Backdrop */}
      <AnimatePresence>
        {isMobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex justify-start">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`relative w-[280px] h-full shadow-2xl flex flex-col border-r select-none z-50
                ${darkMode ? 'bg-[#0a0720] border-white/8' : 'bg-white border-slate-200/50'}`}
            >
              <button
                onClick={() => setIsMobileOpen(false)}
                className={`absolute top-6 right-6 p-1.5 rounded-lg border ${darkMode ? 'border-white/8 bg-white/5' : 'border-slate-200 bg-white'}`}
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
              
              <SidebarContent />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. Main Scrollable Content Area */}
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden pt-16 md:pt-0">
        {/* Desktop Header for Page Title & Theme toggle */}
        <header className="hidden md:flex h-16 border-b border-slate-200/40 dark:border-white/5 items-center justify-between px-8 md:px-12 backdrop-blur-md">
          <h2 className="font-display font-extrabold text-base text-slate-800 dark:text-slate-200">
            {currentActiveName}
          </h2>
          
          <div className="flex items-center gap-3">
            {profile && (
              <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-100/50 dark:bg-white/5 border border-slate-200/20 dark:border-white/5">
                <div className="w-6 h-6 rounded-full bg-brand-purple/10 flex items-center justify-center font-bold text-[10px] text-brand-purple">
                  {profile.firstName ? profile.firstName[0].toUpperCase() : 'C'}
                </div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {profile.firstName ? `${profile.firstName} ${profile.lastName}` : profile.email.split('@')[0]}
                </span>
              </div>
            )}
          </div>
        </header>

        {/* Dynamic Nested Route Content */}
        <main className="flex-1 p-6 md:p-12 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
