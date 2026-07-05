import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  BookOpen,
  Plus,
  Play,
  ArrowRight,
  Loader2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Star,
  Zap,
  CheckCircle,
  BarChart3,
  Brain,
  MessageSquare,
  Code2,
  FileText,
  Target,
  Lightbulb,
  RefreshCw,
  ChevronRight,
  Clock,
  History,
  Cpu
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { useTheme } from '../context/ThemeContext';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../components/Toast';
import { useInterviewStore } from '../store/interviewStore';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface HistoryItem {
  sessionId: number;
  title: string;
  interviewType: string;
  difficulty: string;
  status: string;
  startedAt: string | null;
  durationSeconds: number | null;
  resumeScore: number | null;
  hrScore: number | null;
  technicalScore: number | null;
  codingScore: number | null;
  overallScore: number | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Tiny helpers
// ─────────────────────────────────────────────────────────────────────────────

const scoreColor = (v: number | null | undefined) => {
  if (v == null) return '#64748B';
  if (v >= 8) return '#10B981';
  if (v >= 6) return '#F59E0B';
  return '#EF4444';
};

const scoreLabel = (v: number | null | undefined) => {
  if (v == null) return 'N/A';
  if (v >= 8) return 'Excellent';
  if (v >= 6) return 'Good';
  if (v >= 4) return 'Average';
  return 'Needs Work';
};

const formatDate = (iso: string | null) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
};

const formatDuration = (s: number | null) => {
  if (!s) return '—';
  const m = Math.floor(s / 60);
  return m > 0 ? `${m}m ${s % 60}s` : `${s}s`;
};

const avg = (arr: (number | null)[]): number | null => {
  const valid = arr.filter((v): v is number => v !== null);
  return valid.length ? Math.round((valid.reduce((a, b) => a + b, 0) / valid.length) * 10) / 10 : null;
};

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

// Animated score ring
const ScoreRing: React.FC<{ score: number | null; size?: number; strokeW?: number }> = ({
  score, size = 80, strokeW = 6
}) => {
  const r = (size - strokeW * 2) / 2;
  const circ = 2 * Math.PI * r;
  const pct = score != null ? Math.min(score / 10, 1) : 0;
  const color = scoreColor(score);
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="transparent"
          stroke="rgba(255,255,255,0.06)" strokeWidth={strokeW} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="transparent"
          stroke={color} strokeWidth={strokeW}
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ * (1 - pct) }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-black text-base leading-none" style={{ color }}>
          {score ?? '—'}
        </span>
        <span className="text-[8px] font-bold text-slate-400">/10</span>
      </div>
    </div>
  );
};

// Horizontal bar
const SkillBar: React.FC<{
  label: string; value: number | null; color: string; delay?: number;
  icon: React.ElementType;
}> = ({ label, value, color, delay = 0, icon: Icon }) => {
  const pct = value != null ? Math.min((value / 10) * 100, 100) : 0;
  const textColor = scoreColor(value);
  return (
    <div className="flex items-center gap-3">
      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: `${color}18` }}>
        <Icon className="w-3.5 h-3.5" style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">{label}</span>
          <span className="text-xs font-black" style={{ color: textColor }}>
            {value ?? '—'}/10
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.9, ease: 'easeOut', delay }}
            className="h-full rounded-full"
            style={{ background: color }}
          />
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Dashboard
// ─────────────────────────────────────────────────────────────────────────────

export const DashboardPage: React.FC = () => {
  const { darkMode } = useTheme();
  const { isAuthenticated, loadStoredAuth } = useAuthStore();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const {
    profile, history, activeSession,
    fetchProfile, fetchHistory,
    fetchCurrentSession, createSession, startSession
  } = useInterviewStore();

  // Detailed history with per-round scores
  const [detailedHistory, setDetailedHistory] = useState<HistoryItem[]>([]);
  const [histLoading, setHistLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState('CODING');
  const [newDifficulty, setNewDifficulty] = useState('MEDIUM');
  const [isStarting, setIsStarting] = useState(false);

  // Fetch enriched history
  const fetchDetailed = useCallback(async () => {
    setHistLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch('/api/interviews/history/detailed?page=0&size=50', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setDetailedHistory(data.sessions || []);
    } catch {
      // silently ignore — fall back to empty
    } finally {
      setHistLoading(false);
    }
  }, []);

  useEffect(() => { loadStoredAuth(); }, [loadStoredAuth]);

  useEffect(() => {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    if (!token && !isAuthenticated) {
      showToast('Please sign in to access the dashboard.', 'error');
      navigate('/login');
    }
  }, [isAuthenticated, navigate, showToast]);

  useEffect(() => {
    fetchProfile();
    fetchHistory(0, 5);
    fetchCurrentSession();
    fetchDetailed();
  }, [fetchProfile, fetchHistory, fetchCurrentSession, fetchDetailed]);

  // ── Derived metrics ─────────────────────────────────────────────────────
  const completed = useMemo(
    () => detailedHistory.filter(s => s.status === 'COMPLETED'),
    [detailedHistory]
  );

  const avgOverall   = useMemo(() => avg(completed.map(s => s.overallScore)), [completed]);
  const highestScore = useMemo(
    () => completed.reduce<number | null>((best, s) =>
      s.overallScore != null && (best === null || s.overallScore > best) ? s.overallScore : best, null),
    [completed]
  );
  const recentInterview = completed[0] ?? null;

  // Skill averages across all completed sessions
  const avgResume    = useMemo(() => avg(completed.map(s => s.resumeScore)), [completed]);
  const avgHr        = useMemo(() => avg(completed.map(s => s.hrScore)), [completed]);
  const avgTech      = useMemo(() => avg(completed.map(s => s.technicalScore)), [completed]);
  const avgCoding    = useMemo(() => avg(completed.map(s => s.codingScore)), [completed]);

  // Skill progress bars data
  const skills = useMemo(() => [
    { label: 'Resume',    value: avgResume,  color: '#8B5CF6', icon: FileText   },
    { label: 'HR Round',  value: avgHr,      color: '#EC4899', icon: MessageSquare },
    { label: 'Technical', value: avgTech,    color: '#0EA5E9', icon: Brain      },
    { label: 'Coding',    value: avgCoding,  color: '#10B981', icon: Code2      },
  ], [avgResume, avgHr, avgTech, avgCoding]);

  // Weak = skills scored below 6; Strong = skills scored >= 8
  const weakSkills   = skills.filter(s => s.value != null && s.value < 6);
  const strongSkills = skills.filter(s => s.value != null && s.value >= 7.5);

  // AI recommendation logic
  const recommendation = useMemo(() => {
    if (completed.length === 0) return {
      text: 'Complete your first interview to unlock personalised AI recommendations.',
      icon: '🚀', color: '#8B5CF6', action: 'Start Your First Interview'
    };
    const lowestSkill = skills.filter(s => s.value != null).sort((a, b) => (a.value! - b.value!))[0];
    const lowestRound = lowestSkill?.label ?? 'Technical';
    const score = avgOverall ?? 0;

    if (score < 5) return {
      text: `Focus heavily on your ${lowestRound} round — score is critically low. Practice daily with mock sessions and review AI feedback for each answer.`,
      icon: '⚠️', color: '#EF4444', action: 'Practice Now'
    };
    if (score < 7) return {
      text: `Good progress! Your ${lowestRound} round needs most attention. Review your AI-generated sample answers and weak-area feedback from recent sessions.`,
      icon: '📈', color: '#F59E0B', action: 'Review Feedback'
    };
    return {
      text: `Excellent performance! Maintain your consistency. Consider attempting HARD difficulty interviews to push your ${lowestRound} score higher.`,
      icon: '🏆', color: '#10B981', action: 'Try Hard Mode'
    };
  }, [completed, skills, avgOverall]);

  // Learning progress (based on session count and score trend)
  const learningProgress = useMemo(() => {
    if (completed.length < 2) return { pct: Math.min(completed.length * 15, 20), label: 'Getting Started' };
    const recent3 = completed.slice(0, 3).map(s => s.overallScore).filter(Boolean) as number[];
    const older3  = completed.slice(3, 6).map(s => s.overallScore).filter(Boolean) as number[];
    const recentAvg = avg(recent3) ?? 0;
    const olderAvg  = avg(older3) ?? recentAvg;
    const trend     = recentAvg - olderAvg;
    const basePct   = Math.min(completed.length * 10, 60);
    const scorePct  = ((recentAvg / 10) * 30);
    const trendPct  = Math.max(0, trend * 5);
    const total     = Math.min(Math.round(basePct + scorePct + trendPct), 100);
    const label = total >= 80 ? 'Advanced' : total >= 55 ? 'Intermediate' : total >= 30 ? 'Developing' : 'Beginner';
    return { pct: total, label };
  }, [completed]);

  // ── Create session ────────────────────────────────────────────────────────
  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) { showToast('Please enter an interview title.', 'error'); return; }
    setIsStarting(true);
    try {
      const session = await createSession(newTitle, newType, newDifficulty);
      await startSession(session.id);
      localStorage.setItem('active_interview_session_id', String(session.id));
      localStorage.setItem('active_interview_stage', '0');
      showToast('Interview session started!', 'success');
      setIsModalOpen(false);
      navigate('/interview');
    } catch (err: any) {
      showToast(err.message || 'Failed to start session.', 'error');
    } finally {
      setIsStarting(false);
    }
  };

  const card = `rounded-3xl border shadow-xl backdrop-blur-2xl
    ${darkMode ? 'bg-dark-card border-white/8 glass-panel' : 'bg-light-card border-slate-200/50'}`;

  // ── Loading state ──────────────────────────────────────────────────────────
  if (!profile) {
    return (
      <div className={`min-h-screen flex items-center justify-center
        ${darkMode ? 'bg-dark-bg text-white' : 'bg-light-bg text-slate-900'}`}>
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-brand-purple" />
          <p className="text-sm text-slate-400 font-semibold">Syncing dashboard...</p>
        </div>
      </div>
    );
  }

  const displayName = profile.firstName
    ? `${profile.firstName} ${profile.lastName}`
    : profile.email.split('@')[0];

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="max-w-7xl mx-auto space-y-8">

        {/* ── Hero Header ────────────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-display font-extrabold text-4xl leading-tight mb-2">
              Welcome back,{' '}
              <span className="bg-gradient-to-r from-brand-purple to-brand-indigo bg-clip-text text-transparent">
                {displayName}
              </span>!
            </h1>
            <p className="text-slate-400 font-semibold text-sm">
              {completed.length > 0
                ? `${completed.length} interview${completed.length > 1 ? 's' : ''} completed · Overall avg ${avgOverall ?? '—'}/10`
                : 'Start your first interview session to get personalised AI insights.'}
            </p>
          </motion.div>
          <div className="flex items-center gap-3">
            <button onClick={() => fetchDetailed()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold
                border border-white/10 text-slate-400 hover:bg-white/5 cursor-pointer transition-colors">
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
            <button onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white
                bg-gradient-to-r from-brand-purple to-brand-indigo hover:brightness-110
                shadow-lg shadow-brand-purple/20 cursor-pointer transition-all">
              <Plus className="w-5 h-5" /> New Interview
            </button>
          </div>
        </div>

        {/* ── Active session banner ───────────────────────────────────────── */}
        {activeSession && (
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
            className="p-5 rounded-2xl border border-brand-purple/20 bg-brand-purple/5
              flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-purple/15 text-brand-purple
                flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm">Ongoing Session Detected</h4>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">
                  "{activeSession.title}" — {activeSession.status}. Resume to continue scoring.
                </p>
              </div>
            </div>
            <button onClick={() => navigate('/interview')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-white
                bg-brand-purple hover:brightness-110 cursor-pointer transition-all flex-shrink-0">
              Resume Round <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* ── KPI Strip ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {[
            {
              label: 'Completed',
              value: completed.length,
              sub: `of ${detailedHistory.length} total`,
              icon: CheckCircle, color: '#10B981'
            },
            {
              label: 'Average Score',
              value: avgOverall != null ? `${avgOverall}/10` : '—',
              sub: avgOverall != null ? scoreLabel(avgOverall) : 'No data yet',
              icon: BarChart3, color: '#8B5CF6'
            },
            {
              label: 'Highest Score',
              value: highestScore != null ? `${highestScore}/10` : '—',
              sub: highestScore != null ? scoreLabel(highestScore) : 'Complete an interview',
              icon: Star, color: '#F59E0B'
            },
            {
              label: 'Resume Score',
              value: avgResume != null ? `${avgResume}/10` : '—',
              sub: avgResume != null ? scoreLabel(avgResume) : 'Upload a resume',
              icon: FileText, color: '#EC4899'
            },
          ].map((kpi, i) => {
            const Icon = kpi.icon;
            return (
              <motion.div key={i} initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                className={`${card} p-5`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: `${kpi.color}18` }}>
                    <Icon className="w-5 h-5" style={{ color: kpi.color }} />
                  </div>
                </div>
                <p className="text-2xl font-black mb-0.5" style={{ color: kpi.color }}>{kpi.value}</p>
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">{kpi.label}</p>
                <p className="text-[10px] text-slate-500 font-semibold mt-0.5">{kpi.sub}</p>
              </motion.div>
            );
          })}
        </div>

        {/* ── Main Grid ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* LEFT: Skill Progress + Weak/Strong + Learning ─────────────── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Skill Progress */}
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }} className={`${card} p-6`}>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-brand-purple" />
                  <h3 className="font-display font-extrabold text-sm uppercase tracking-wide">
                    Skill Progress
                  </h3>
                </div>
                <button onClick={() => navigate('/interview-history')}
                  className="text-[10px] font-extrabold text-brand-purple hover:text-brand-indigo
                    flex items-center gap-1 cursor-pointer transition-colors">
                  View History <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              {histLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-brand-purple" />
                </div>
              ) : completed.length === 0 ? (
                <p className="text-xs text-slate-500 font-semibold text-center py-6">
                  Complete an interview to see skill progress.
                </p>
              ) : (
                <div className="space-y-4">
                  {skills.map((s, i) => (
                    <SkillBar key={s.label} {...s} delay={0.1 + i * 0.06} />
                  ))}
                </div>
              )}
            </motion.div>

            {/* Weak Skills + Strong Skills */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Weak Skills */}
              <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }} className={`${card} p-6`}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-xl bg-rose-500/10 flex items-center justify-center">
                    <TrendingDown className="w-4 h-4 text-rose-400" />
                  </div>
                  <h3 className="font-display font-extrabold text-sm uppercase tracking-wide">Weak Areas</h3>
                </div>
                {weakSkills.length === 0 ? (
                  <p className="text-xs text-slate-500 font-semibold">
                    {completed.length === 0
                      ? 'No interviews completed yet.'
                      : '🎉 No critical weak areas found!'}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {weakSkills.map(s => {
                      const Icon = s.icon;
                      return (
                        <div key={s.label} className="flex items-center gap-3 p-3 rounded-xl bg-rose-500/5 border border-rose-500/10">
                          <Icon className="w-4 h-4 text-rose-400 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-extrabold">{s.label}</p>
                            <p className="text-[10px] text-rose-400 font-semibold">
                              {s.value}/10 — Needs focus
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>

              {/* Strong Skills */}
              <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }} className={`${card} p-6`}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                  </div>
                  <h3 className="font-display font-extrabold text-sm uppercase tracking-wide">Strong Areas</h3>
                </div>
                {strongSkills.length === 0 ? (
                  <p className="text-xs text-slate-500 font-semibold">
                    {completed.length === 0
                      ? 'No interviews completed yet.'
                      : 'Keep practicing to unlock strong areas!'}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {strongSkills.map(s => {
                      const Icon = s.icon;
                      return (
                        <div key={s.label} className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                          <Icon className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-extrabold">{s.label}</p>
                            <p className="text-[10px] text-emerald-400 font-semibold">
                              {s.value}/10 — {scoreLabel(s.value)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            </div>

            {/* Learning Progress */}
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22 }} className={`${card} p-6`}>
              <div className="flex items-center gap-2 mb-5">
                <Cpu className="w-4 h-4 text-brand-purple" />
                <h3 className="font-display font-extrabold text-sm uppercase tracking-wide">Learning Progress</h3>
                <span className="ml-auto text-xs font-extrabold px-2.5 py-1 rounded-lg
                  bg-brand-purple/10 text-brand-purple border border-brand-purple/20">
                  {learningProgress.label}
                </span>
              </div>

              {/* Big progress bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                    Overall Journey
                  </span>
                  <span className="text-sm font-black text-brand-purple">{learningProgress.pct}%</span>
                </div>
                <div className="h-3 rounded-full bg-white/5 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${learningProgress.pct}%` }}
                    transition={{ duration: 1.2, ease: 'easeOut', delay: 0.4 }}
                    className="h-full rounded-full bg-gradient-to-r from-brand-purple to-brand-indigo"
                  />
                </div>
              </div>

              {/* Milestone chips */}
              <div className="flex flex-wrap gap-2">
                {[
                  { label: '1st Interview', done: completed.length >= 1 },
                  { label: '3 Completed', done: completed.length >= 3 },
                  { label: 'Score ≥ 6', done: (avgOverall ?? 0) >= 6 },
                  { label: 'Score ≥ 8', done: (avgOverall ?? 0) >= 8 },
                  { label: '5 Interviews', done: completed.length >= 5 },
                  { label: 'All Rounds', done: avgResume != null && avgHr != null && avgTech != null && avgCoding != null },
                ].map((m, i) => (
                  <span key={i}
                    className={`text-[9px] font-extrabold px-2.5 py-1 rounded-lg uppercase tracking-wide
                      flex items-center gap-1 border transition-all
                      ${m.done
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                        : 'bg-white/3 border-white/5 text-slate-500'
                      }`}>
                    {m.done ? <CheckCircle className="w-3 h-3" /> : <div className="w-3 h-3 rounded-full border border-slate-600" />}
                    {m.label}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>

          {/* RIGHT: Recent Interview + AI Recommendation + Upcoming ────── */}
          <div className="space-y-5">

            {/* Recent Interview */}
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }} className={`${card} p-6`}>
              <div className="flex items-center gap-2 mb-4">
                <History className="w-4 h-4 text-brand-purple" />
                <h3 className="font-display font-extrabold text-sm uppercase tracking-wide">Recent Interview</h3>
              </div>

              {recentInterview ? (
                <div className="space-y-4">
                  {/* Score ring + title */}
                  <div className="flex items-center gap-4">
                    <ScoreRing score={recentInterview.overallScore} size={72} strokeW={5} />
                    <div className="min-w-0">
                      <p className="font-bold text-sm leading-tight line-clamp-2">{recentInterview.title}</p>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-lg
                          bg-brand-purple/10 text-brand-purple border border-brand-purple/20">
                          {recentInterview.interviewType}
                        </span>
                        <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-lg
                          bg-white/5 text-slate-400 border border-white/8">
                          {recentInterview.difficulty}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-semibold mt-1.5 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {formatDate(recentInterview.startedAt)}
                        {recentInterview.durationSeconds && (
                          <> · {formatDuration(recentInterview.durationSeconds)}</>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Mini round scores */}
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: 'HR',    value: recentInterview.hrScore,        color: '#EC4899' },
                      { label: 'Tech',  value: recentInterview.technicalScore, color: '#0EA5E9' },
                      { label: 'Code',  value: recentInterview.codingScore,    color: '#10B981' },
                      { label: 'CV',    value: recentInterview.resumeScore,    color: '#8B5CF6' },
                    ].map(rs => (
                      <div key={rs.label} className="flex flex-col items-center gap-0.5">
                        <span className="text-sm font-black" style={{ color: scoreColor(rs.value) }}>
                          {rs.value ?? '—'}
                        </span>
                        <span className="text-[9px] font-extrabold text-slate-400 uppercase">{rs.label}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => navigate('/interview-history')}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl
                      text-[11px] font-extrabold text-brand-purple bg-brand-purple/8
                      border border-brand-purple/20 hover:bg-brand-purple/15 cursor-pointer transition-all">
                    <FileText className="w-3.5 h-3.5" /> View Full Report
                  </button>
                </div>
              ) : (
                <div className="text-center py-6">
                  <BookOpen className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                  <p className="text-xs text-slate-500 font-semibold">No completed interviews yet.</p>
                  <button onClick={() => setIsModalOpen(true)}
                    className="mt-3 flex items-center gap-1.5 px-4 py-2 rounded-xl text-[11px] font-extrabold
                      text-brand-purple bg-brand-purple/10 border border-brand-purple/20 mx-auto
                      hover:bg-brand-purple/20 cursor-pointer transition-colors">
                    <Plus className="w-3.5 h-3.5" /> Start First Interview
                  </button>
                </div>
              )}
            </motion.div>

            {/* Upcoming Recommendation */}
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.17 }} className={`${card} p-6`}>
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-4 h-4 text-amber-400" />
                <h3 className="font-display font-extrabold text-sm uppercase tracking-wide">
                  Upcoming Recommendation
                </h3>
              </div>
              <div className="p-4 rounded-2xl border bg-amber-500/5 border-amber-500/15">
                <p className="text-[11px] text-slate-300 leading-relaxed font-semibold">
                  {avgTech == null
                    ? '💡 Start a Technical Round to evaluate your Java, Spring Boot, and system design knowledge.'
                    : avgTech < 6
                    ? '📚 Schedule a Technical Round — core Java & Spring Boot concepts need reinforcement.'
                    : avgHr == null
                    ? '🗣️ Add an HR Round to measure communication, grammar, and professional delivery.'
                    : avgCoding == null
                    ? '💻 Try a Coding Round — practice Java DSA problems with real test-case evaluation.'
                    : avgOverall != null && avgOverall < 7
                    ? '🔄 Retake your weakest round to push your overall score above 7.0.'
                    : '🚀 Try HARD difficulty to challenge yourself and unlock top-tier scoring.'}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(true)}
                className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 rounded-xl
                  text-[11px] font-extrabold text-white bg-gradient-to-r from-amber-500 to-orange-500
                  hover:brightness-110 cursor-pointer shadow-sm transition-all">
                <Zap className="w-3.5 h-3.5" /> {recommendation.action}
              </button>
            </motion.div>

            {/* AI Recommendation */}
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22 }} className={`${card} p-6`}>
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="w-4 h-4 text-brand-purple" />
                <h3 className="font-display font-extrabold text-sm uppercase tracking-wide">AI Recommendation</h3>
              </div>
              <div className="p-4 rounded-2xl border"
                style={{ background: `${recommendation.color}08`, borderColor: `${recommendation.color}25` }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{recommendation.icon}</span>
                  <span className="text-[10px] font-extrabold uppercase tracking-wide"
                    style={{ color: recommendation.color }}>
                    AI Insight
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed font-semibold"
                  style={{ color: darkMode ? '#CBD5E1' : '#475569' }}>
                  {recommendation.text}
                </p>
              </div>

              {/* Profile bio snippet */}
              {profile.bio && (
                <div className={`mt-4 p-3 rounded-xl border text-[10px] font-semibold leading-relaxed
                  ${darkMode ? 'bg-white/3 border-white/5 text-slate-400' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
                  <span className="font-extrabold text-slate-300 uppercase text-[9px] tracking-wider block mb-1">
                    Your Bio
                  </span>
                  {profile.bio}
                </div>
              )}
            </motion.div>

            {/* Quick actions */}
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.26 }} className={`${card} p-5`}>
              <h3 className="font-display font-extrabold text-xs uppercase tracking-wider text-slate-400 mb-4">
                Quick Actions
              </h3>
              <div className="space-y-2">
                {[
                  { label: 'View All Interviews', icon: History, path: '/interview-history', color: '#8B5CF6' },
                  { label: 'Analyse My Resume', icon: FileText, path: '/resume-analyzer', color: '#EC4899' },
                  { label: 'Update Profile', icon: User, path: '/profile', color: '#0EA5E9' },
                ].map((qa, i) => {
                  const Icon = qa.icon;
                  return (
                    <button key={i} onClick={() => navigate(qa.path)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold
                        border cursor-pointer transition-all text-left
                        ${darkMode
                          ? 'border-white/5 hover:bg-white/5 text-slate-300'
                          : 'border-slate-200/50 hover:bg-slate-50 text-slate-700'
                        }`}>
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ background: `${qa.color}18` }}>
                        <Icon className="w-3.5 h-3.5" style={{ color: qa.color }} />
                      </div>
                      <span className="flex-1">{qa.label}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </div>

        {/* ── Recent History Strip ────────────────────────────────────────── */}
        {history.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28 }} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-extrabold text-lg">Recent Sessions</h3>
              <button onClick={() => navigate('/interview-history')}
                className="flex items-center gap-1 text-xs font-extrabold text-brand-purple
                  hover:text-brand-indigo cursor-pointer transition-colors">
                See All <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {history.slice(0, 6).map((session, i) => {
                const typeColors: Record<string, string> = {
                  TECHNICAL: '#0EA5E9', CODING: '#10B981', HR: '#EC4899'
                };
                const tColor = typeColors[session.interviewType] ?? '#8B5CF6';
                const TypeIcon = session.interviewType === 'TECHNICAL' ? Brain
                  : session.interviewType === 'CODING' ? Code2 : MessageSquare;
                return (
                  <motion.div key={session.id} initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.04 }}
                    className={`${card} p-4 flex items-center gap-4 hover:scale-[1.01] transition-transform`}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: `${tColor}18` }}>
                      <TypeIcon className="w-5 h-5" style={{ color: tColor }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-xs truncate">{session.title}</p>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">
                        {session.interviewType} · {session.difficulty}
                      </p>
                    </div>
                    <div>
                      {session.status === 'COMPLETED' ? (
                        <button onClick={() => navigate('/interview-history')}
                          className="flex items-center gap-1 text-[10px] font-extrabold text-brand-purple
                            bg-brand-purple/10 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-brand-purple/20">
                          Report <ArrowRight className="w-3 h-3" />
                        </button>
                      ) : session.status === 'CANCELLED' ? (
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-400/15 px-2.5 py-1 rounded-lg">
                          Cancelled
                        </span>
                      ) : (
                        <button onClick={() => navigate('/interview')}
                          className="flex items-center gap-1 text-[10px] font-extrabold text-amber-400
                            bg-amber-500/10 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-amber-500/20">
                          Resume <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>

      {/* ── New Interview Modal ─────────────────────────────────────────── */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6
            bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className={`w-full max-w-lg p-8 rounded-3xl border shadow-2xl text-left
                ${darkMode ? 'bg-dark-card border-white/10 glass-panel' : 'bg-white border-slate-200'}`}>
              <h2 className="font-display font-extrabold text-2xl mb-6
                bg-gradient-to-r from-brand-purple to-brand-indigo bg-clip-text text-transparent">
                Start Mock Interview
              </h2>
              <form onSubmit={handleCreateSession} className="space-y-5">
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2">
                    Interview Title
                  </label>
                  <input type="text" required value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    placeholder="e.g. Senior Java Spring Boot Interview"
                    className={`w-full px-4 py-3 rounded-xl border font-semibold text-sm
                      focus:outline-none focus:ring-2 focus:ring-brand-purple/35 transition-all
                      ${darkMode
                        ? 'bg-white/5 border-white/8 text-white focus:bg-white/8'
                        : 'bg-slate-50 border-slate-200 text-slate-800 focus:bg-white'
                      }`}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2">
                      Type
                    </label>
                    <select value={newType} onChange={e => setNewType(e.target.value)}
                      className={`w-full px-4 py-3 rounded-xl border font-semibold text-sm
                        focus:outline-none focus:ring-2 focus:ring-brand-purple/35 cursor-pointer
                        ${darkMode ? 'bg-white/5 border-white/8 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}>
                      <option value="HR">HR</option>
                      <option value="TECHNICAL">Technical</option>
                      <option value="CODING">Coding</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2">
                      Difficulty
                    </label>
                    <select value={newDifficulty} onChange={e => setNewDifficulty(e.target.value)}
                      className={`w-full px-4 py-3 rounded-xl border font-semibold text-sm
                        focus:outline-none focus:ring-2 focus:ring-brand-purple/35 cursor-pointer
                        ${darkMode ? 'bg-white/5 border-white/8 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}>
                      <option value="EASY">Easy</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HARD">Hard</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setIsModalOpen(false)}
                    className="px-5 py-3 rounded-xl font-bold text-sm text-slate-500
                      bg-slate-100 dark:bg-white/5 dark:text-slate-300 cursor-pointer hover:brightness-95">
                    Cancel
                  </button>
                  <button type="submit" disabled={isStarting}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white
                      bg-gradient-to-r from-brand-purple to-brand-indigo hover:brightness-110
                      shadow-lg shadow-brand-purple/20 cursor-pointer transition-all disabled:opacity-50">
                    {isStarting
                      ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Starting...</span></>
                      : <><Play className="w-4 h-4 fill-current" /><span>Start Session</span></>
                    }
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
