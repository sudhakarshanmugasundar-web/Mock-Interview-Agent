import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Award,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';

import { useTheme } from '../context/ThemeContext';
import { useInterviewStore } from '../store/interviewStore';
import { ThemeToggle } from '../components/ThemeToggle';

export const ResultPage: React.FC = () => {
  const { darkMode } = useTheme();
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { result, fetchResult, isLoading } = useInterviewStore();

  useEffect(() => {
    if (sessionId) {
      fetchResult(Number(sessionId));
    }
  }, [sessionId, fetchResult]);

  if (isLoading || !result) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-300
        ${darkMode ? 'bg-dark-bg text-white' : 'bg-light-bg text-slate-900'}`}
      >
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-brand-purple" />
          <p className="text-sm text-slate-400">Loading AI evaluation report...</p>
        </div>
      </div>
    );
  }

  const scoreDetails = [
    { label: 'Technical Knowledge', val: getAverageRating('technicalKnowledge') },
    { label: 'Communication & Vocabulary', val: getAverageRating('communication') },
    { label: 'Confidence & Delivery', val: getAverageRating('confidence') },
    { label: 'Grammar Accuracy', val: getAverageRating('grammar') },
    { label: 'Relevance to Prompt', val: getAverageRating('relevance') },
    { label: 'Completeness', val: getAverageRating('completeness') },
    { label: 'Professionalism', val: getAverageRating('professionalism') }
  ];

  function getAverageRating(field: string): number {
    const list = result?.questionsEvaluations || [];
    if (list.length === 0) return 0;
    let sum = 0;
    let count = 0;
    list.forEach((item: any) => {
      if (item[field] !== null && item[field] !== undefined) {
        sum += item[field];
        count++;
      }
    });
    return count > 0 ? Math.round((sum / count) * 10) / 10 : 0;
  }

  return (
    <div className={`min-h-screen p-6 md:p-12 transition-colors duration-300
      ${darkMode ? 'bg-dark-bg bg-gradient-mesh text-slate-100' : 'bg-light-bg bg-gradient-mesh-light text-slate-900'}`}
    >
      <div className="max-w-5xl mx-auto text-left">
        {/* Header */}
        <header className="flex items-center justify-between mb-12">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200/50 dark:border-white/10 bg-white/5 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300 font-bold text-sm cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Dashboard</span>
          </button>
          <ThemeToggle />
        </header>

        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12"
        >
          {/* Main Score Ring Card */}
          <div className={`p-8 md:col-span-1 rounded-3xl border shadow-xl flex flex-col items-center justify-center text-center
            ${darkMode ? 'bg-dark-card border-white/8 glass-panel' : 'bg-light-card border-slate-200/50 glass-panel-light'}`}
          >
            <div className="w-12 h-12 rounded-2xl bg-brand-purple/15 text-brand-purple flex items-center justify-center mb-6">
              <Award className="w-6 h-6" />
            </div>

            <h2 className="font-display font-extrabold text-md text-slate-400 mb-2 uppercase tracking-wide">Overall Score</h2>
            
            <div className="relative w-40 h-40 flex items-center justify-center mb-6">
              {/* Circular progress bar SVG */}
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" stroke={darkMode ? '#ffffff10' : '#e2e8f0'} strokeWidth="8" fill="transparent" />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  stroke="url(#purpleGradient)"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray="264"
                  strokeDashoffset={264 - (264 * (result.averageScore * 10)) / 100}
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="purpleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#8B5CF6" />
                    <stop offset="100%" stopColor="#6366F1" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute text-4xl font-black text-slate-800 dark:text-white">
                {result.averageScore}
                <span className="text-xs text-slate-400 font-bold block">out of 10</span>
              </div>
            </div>

            <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold uppercase">
              {result.interviewType} • {result.difficulty}
            </p>
          </div>

          {/* Subscores Grid */}
          <div className={`p-8 md:col-span-2 rounded-3xl border shadow-xl backdrop-blur-2xl
            ${darkMode ? 'bg-dark-card border-white/8 glass-panel' : 'bg-light-card border-slate-200/50 glass-panel-light'}`}
          >
            <h3 className="font-display font-extrabold text-lg mb-6">Evaluation Category Scores</h3>

            <div className="space-y-4">
              {scoreDetails.map((score, idx) => (
                <div key={idx}>
                  <div className="flex justify-between text-xs font-bold mb-1.5">
                    <span>{score.label}</span>
                    <span className="text-brand-purple">{score.val}/10</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-white/10 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-brand-purple to-brand-indigo h-full rounded-full transition-all duration-1000"
                      style={{ width: `${score.val * 10}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Strengths & Weaknesses */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {/* Strengths */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`p-6.5 rounded-3xl border shadow-lg text-left backdrop-blur-2xl
              ${darkMode ? 'bg-dark-card border-white/8 glass-panel' : 'bg-light-card border-slate-200/50 glass-panel-light'}`}
          >
            <div className="flex items-center gap-2.5 text-emerald-500 font-extrabold mb-4 text-sm uppercase">
              <ThumbsUp className="w-5 h-5" />
              <span>Key Strengths</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold leading-relaxed">
              {result.questionsEvaluations[0]?.strengths || 'Consistent phrasing structure and appropriate industry keyword mappings.'}
            </p>
          </motion.div>

          {/* Weaknesses */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`p-6.5 rounded-3xl border shadow-lg text-left backdrop-blur-2xl
              ${darkMode ? 'bg-dark-card border-white/8 glass-panel' : 'bg-light-card border-slate-200/50 glass-panel-light'}`}
          >
            <div className="flex items-center gap-2.5 text-rose-500 font-extrabold mb-4 text-sm uppercase">
              <ThumbsDown className="w-5 h-5" />
              <span>Weaknesses</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold leading-relaxed">
              {result.questionsEvaluations[0]?.weaknesses || 'Explanation details could be expanded to demonstrate trade-off knowledge.'}
            </p>
          </motion.div>

          {/* Suggestions */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={`p-6.5 rounded-3xl border shadow-lg text-left backdrop-blur-2xl
              ${darkMode ? 'bg-dark-card border-white/8 glass-panel' : 'bg-light-card border-slate-200/50 glass-panel-light'}`}
          >
            <div className="flex items-center gap-2.5 text-indigo-500 font-extrabold mb-4 text-sm uppercase">
              <Sparkles className="w-5 h-5" />
              <span>AI Recommendations</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold leading-relaxed">
              {result.questionsEvaluations[0]?.suggestions || 'Leverage concrete metrics (e.g. system throughput, scale) when summarizing Java backend tasks.'}
            </p>
          </motion.div>
        </div>

        {/* Question by Question Review */}
        <div className="space-y-6 text-left">
          <h3 className="font-display font-extrabold text-xl">Question-by-Question Transcript</h3>

          <div className="space-y-6">
            {result.questionsEvaluations.map((qa, index) => (
              <motion.div
                key={qa.responseId}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                className={`p-6.5 rounded-3xl border shadow-md
                  ${darkMode ? 'bg-white/3 border-white/5' : 'bg-white border-slate-200/50'}`}
              >
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs font-bold uppercase text-brand-purple">
                    Question {qa.questionSequence} of 5 ({qa.answerMode} round)
                  </span>
                  <span className="text-xs font-bold text-slate-400">
                    Response time: {qa.responseTime} seconds
                  </span>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider mb-1">Interviewer</h4>
                    <p className="text-sm font-semibold leading-relaxed text-slate-800 dark:text-slate-200">{qa.questionText}</p>
                  </div>

                  <div>
                    <h4 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider mb-1">Candidate</h4>
                    <p className="text-sm font-semibold leading-relaxed text-slate-600 dark:text-slate-400 italic">
                      "{qa.responseText}"
                    </p>
                    {qa.audioPath && (
                      <div className="mt-3">
                        <audio src={qa.audioPath} controls className="h-9 max-w-full" />
                      </div>
                    )}
                  </div>

                  {qa.feedbackText && (
                    <div className={`p-4 rounded-xl border mt-3 text-xs leading-relaxed font-semibold
                      ${darkMode ? 'bg-white/3 border-white/5 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'}`}
                    >
                      <strong>AI Evaluation Breakdown ({qa.overallScore}/10):</strong> {qa.feedbackText}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
