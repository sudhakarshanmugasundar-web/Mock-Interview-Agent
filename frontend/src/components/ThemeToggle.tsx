import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

export const ThemeToggle: React.FC = () => {
  const { darkMode, toggleDarkMode } = useTheme();

  return (
    <button
      onClick={toggleDarkMode}
      type="button"
      className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-white/10 dark:bg-black/20 border border-slate-200/50 dark:border-white/10 text-slate-700 dark:text-slate-200 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-white/5 transition-colors focus-ring"
      aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      id="theme-toggle"
    >
      <AnimatePresence mode="wait" initial={false}>
        {darkMode ? (
          <motion.div
            key="sun"
            initial={{ y: 20, rotate: 90, opacity: 0 }}
            animate={{ y: 0, rotate: 0, opacity: 1 }}
            exit={{ y: -20, rotate: -90, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Sun className="w-5 h-5 text-amber-400" />
          </motion.div>
        ) : (
          <motion.div
            key="moon"
            initial={{ y: 20, rotate: -90, opacity: 0 }}
            animate={{ y: 0, rotate: 0, opacity: 1 }}
            exit={{ y: -20, rotate: 90, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Moon className="w-5 h-5 text-indigo-600" />
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
};
