import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface ComingSoonPageProps {
  title: string;
}

export const ComingSoonPage: React.FC<ComingSoonPageProps> = ({ title }) => {
  const { darkMode } = useTheme();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center">
      <div className={`p-8 md:p-12 rounded-3xl border max-w-lg w-full backdrop-blur-2xl shadow-2xl text-center
        ${darkMode ? 'bg-dark-card border-white/8 glass-panel' : 'bg-light-card border-slate-200/50 glass-panel-light'}`}
      >
        <div className="w-16 h-16 mx-auto rounded-2xl bg-brand-purple/10 text-brand-purple flex items-center justify-center mb-6 animate-pulse">
          <Sparkles className="w-8 h-8" />
        </div>
        
        <h2 className="font-display font-extrabold text-3xl mb-3 tracking-tight bg-gradient-to-r from-brand-purple to-brand-indigo bg-clip-text text-transparent">
          {title}
        </h2>
        
        <div className="inline-block px-3 py-1 mb-6 rounded-full text-xs font-bold uppercase tracking-wider text-brand-purple bg-brand-purple/10 border border-brand-purple/20">
          Module coming soon
        </div>
        
        <p className="text-slate-500 dark:text-slate-400 font-semibold text-sm leading-relaxed mb-8">
          We are currently building this section to integrate advanced AI feedback and personalized analysis. Stay tuned for the upcoming update!
        </p>

        <button
          onClick={() => navigate('/dashboard')}
          className="mx-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm tracking-wide text-white bg-gradient-to-r from-brand-purple to-brand-indigo hover:brightness-110 shadow-lg shadow-brand-purple/20 transition-all cursor-pointer focus-ring"
        >
          <span>Return to Dashboard</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
