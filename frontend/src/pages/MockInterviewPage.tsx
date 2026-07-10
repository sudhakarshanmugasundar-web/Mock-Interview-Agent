import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Play,
  ArrowRight,
  Loader2,
  Brain,
  MessageSquare,
  Code2,
  FileText,
  Clock,
  History,
  UploadCloud,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';

import { useTheme } from '../context/ThemeContext';
import { useToast } from '../components/Toast';
import { useInterviewStore } from '../store/interviewStore';
import { axiosClient } from '../api/axiosClient';

// ─────────────────────────────────────────────────────────────────────────────
// Types & Helpers
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

const scoreColor = (v: number | null | undefined) => {
  if (v == null) return '#64748B'; // Gray
  if (v >= 8) return '#10B981'; // Green
  if (v >= 6) return '#F59E0B'; // Amber
  return '#EF4444'; // Red
};

const formatDate = (iso: string | null) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

const getFileNameFromUrl = (url: string) => {
  if (!url) return '';
  try {
    if (url.includes('filename=')) {
      const parts = url.split('filename=');
      return decodeURIComponent(parts[1]);
    }
    const parsed = new URL(url, window.location.origin);
    const filename = parsed.searchParams.get('filename');
    return filename ? decodeURIComponent(filename) : 'resume.pdf';
  } catch {
    return 'resume.pdf';
  }
};

export const MockInterviewPage: React.FC = () => {
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const {
    profile,
    activeSession,
    fetchProfile,
    fetchCurrentSession,
    createSession,
    startSession,
    uploadResume
  } = useInterviewStore();

  const [detailedHistory, setDetailedHistory] = useState<HistoryItem[]>([]);
  const [histLoading, setHistLoading] = useState(true);

  // Form Configuration State
  const [title, setTitle] = useState('');
  const [selectedType, setSelectedType] = useState<'HR' | 'TECHNICAL' | 'CODING'>('TECHNICAL');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('MEDIUM');
  const [isStarting, setIsStarting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Fetch enriched user sessions detail
  const fetchDetailed = useCallback(async () => {
    setHistLoading(true);
    try {
      const res = await axiosClient.get('/interviews/history/detailed?page=0&size=50');
      setDetailedHistory(res.data.sessions || []);
    } catch {
      // silently fall back
    } finally {
      setHistLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
    fetchCurrentSession();
    fetchDetailed();
  }, [fetchProfile, fetchCurrentSession, fetchDetailed]);

  // Sync token check on layout
  useEffect(() => {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    if (!token) {
      showToast('Please sign in to access the portal.', 'error');
      navigate('/login');
    }
  }, [navigate, showToast]);

  // Dynamic duration estimate calculation
  const estimatedDuration = useMemo(() => {
    let base = 30; // Medium TECHNICAL is 30 mins
    if (selectedType === 'HR') {
      base = 15;
    } else if (selectedType === 'CODING') {
      base = 45;
    }

    if (selectedDifficulty === 'EASY') {
      base -= 5;
    } else if (selectedDifficulty === 'HARD') {
      base += 15;
    }
    return `${base} Minutes`;
  }, [selectedType, selectedDifficulty]);

  // Resume Upload Handler
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('File size must be under 5MB.', 'error');
      return;
    }

    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (ext !== '.pdf' && ext !== '.docx') {
      showToast('Only PDF and DOCX files are allowed.', 'error');
      return;
    }

    setIsUploading(true);
    try {
      await uploadResume(file);
      showToast('Resume uploaded and configured successfully!', 'success');
      fetchProfile();
    } catch (err: any) {
      showToast(err.message || 'Failed to upload resume', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  // Launch new mock session
  const handleStartSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('Please specify an interview title.', 'error');
      return;
    }
    setIsStarting(true);
    try {
      const session = await createSession(title, selectedType, selectedDifficulty);
      await startSession(session.id);
      localStorage.setItem('active_interview_session_id', String(session.id));
      localStorage.setItem('active_interview_stage', '0');
      showToast('Mock Interview session launched!', 'success');
      
      // Determine if /system-check is available in the layout router, else fall back to /self-introduction
      const isSystemCheckAvailable = true; // Configured and imported inside App.tsx
      if (isSystemCheckAvailable) {
        navigate('/system-check');
      } else {
        navigate('/self-introduction');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to start interview session.', 'error');
    } finally {
      setIsStarting(false);
    }
  };

  const cardClass = `rounded-3xl border shadow-xl backdrop-blur-2xl transition-all duration-300
    ${darkMode ? 'bg-dark-card border-white/8 glass-panel' : 'bg-light-card border-slate-200/50'}`;

  return (
    <div className="max-w-7xl mx-auto space-y-8 text-left">
      
      {/* Page Header */}
      <div>
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display font-extrabold text-3xl mb-1 bg-gradient-to-r from-brand-purple to-brand-indigo bg-clip-text text-transparent">
            Mock Interview Workspace
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-semibold text-xs md:text-sm">
            Launch customized mock interviews powered by AI tailored to your profile description and resume experience.
          </p>
        </motion.div>
      </div>

      {/* ── Active Session Banner ────────────────────────────────────────── */}
      {activeSession && (activeSession.status === 'IN_PROGRESS' || activeSession.status === 'PAUSED' || activeSession.status === 'NOT_STARTED') && (() => {
        const savedStage = localStorage.getItem('active_interview_stage');
        const stageNum = savedStage ? Number(savedStage) : 0;
        const roundLabels = ['Resume Verification', 'HR Round', 'Technical Round', 'Coding Round', 'Final Evaluation', 'Report'];
        const activeRoundName = activeSession.status === 'NOT_STARTED' ? 'Setup (Self Introduction)' : (roundLabels[stageNum] || 'HR Round');

        return (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-3xl border border-amber-500/25 bg-amber-500/5 shadow-xl shadow-amber-500/5 flex flex-col md:flex-row items-center justify-between gap-5"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-500 flex-shrink-0">
                <Clock className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <span className="text-[9px] font-black uppercase text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg">
                  Active Interview in Progress
                </span>
                <h3 className="font-display font-black text-lg text-slate-800 dark:text-slate-100 mt-2.5 leading-tight">
                  {activeSession.title}
                </h3>
                <p className="text-xs text-slate-400 font-semibold mt-1">
                  Active Stage: <span className="text-brand-purple font-bold">{activeRoundName}</span>
                </p>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">
                  {activeSession.status === 'NOT_STARTED'
                    ? 'Begin by verifying your resume details and submitting your self-introduction.'
                    : 'A mock interview session is currently active. Resume to continue rendering feedback.'}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                if (activeSession.status === 'NOT_STARTED') {
                  navigate('/self-introduction');
                } else {
                  navigate('/interview');
                }
              }}
              className="w-full md:w-auto px-8 py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 shadow-lg shadow-amber-500/20 cursor-pointer transition-all flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Resume Interview</span>
            </button>
          </motion.div>
        );
      })()}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* ── Configure New Mock Session (Left Panel) ─────────────────────── */}
        <div className="lg:col-span-7 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className={`${cardClass} p-8`}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-brand-purple/10 text-brand-purple flex items-center justify-center">
                <Plus className="w-5 h-5" />
              </div>
              <h2 className="font-display font-black text-xl">Configure New Mock Session</h2>
            </div>

            <form onSubmit={handleStartSession} className="space-y-6">
              
              {/* Title parameter */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-550 mb-2">
                  Session Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Senior Java Spring Boot Interview"
                  className={`w-full px-4 py-3 rounded-xl border font-semibold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-brand-purple/35
                    ${darkMode ? 'bg-white/5 border-white/8 text-white focus:bg-white/8' : 'bg-slate-50 border-slate-200 text-slate-850 focus:bg-white'}`}
                />
              </div>

              {/* Resume Upload Section */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-550 mb-2">
                  Verify / Upload Resume (Customized focus)
                </label>

                {profile?.resumeUrl ? (
                  <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-semibold text-sm
                    ${darkMode ? 'bg-white/3 border-white/5' : 'bg-slate-50 border-slate-200'}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-brand-purple/15 text-brand-purple flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="text-left min-w-0">
                        <span className="block text-[9px] text-slate-400 uppercase font-black tracking-wide">Target Resume File</span>
                        <p className="text-xs font-bold truncate max-w-[200px] sm:max-w-xs">{getFileNameFromUrl(profile.resumeUrl)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <a
                        href={profile.resumeUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 sm:flex-none text-center px-3.5 py-2 rounded-xl text-xs font-bold bg-brand-purple/10 hover:bg-brand-purple/20 text-brand-purple border border-brand-purple/20 transition-all cursor-pointer"
                      >
                        Preview
                      </a>
                      <button
                        type="button"
                        onClick={() => document.getElementById('mock-replace-resume')?.click()}
                        className="flex-1 sm:flex-none text-center px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-200 hover:bg-slate-300 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-slate-350 transition-all cursor-pointer"
                      >
                        Replace
                      </button>
                      <input
                        id="mock-replace-resume"
                        type="file"
                        accept=".pdf,.docx"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 transition-all
                      ${darkMode ? 'border-white/15 bg-white/2' : 'border-slate-300 bg-slate-50'}`}
                    >
                      <div className="flex flex-col items-center justify-center text-center">
                        <UploadCloud className="w-8 h-8 text-slate-400 dark:text-slate-500 mb-2" />
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Click to upload your resume dynamically</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">PDF or DOCX (Max 5MB)</span>
                      </div>
                      <input
                        type="file"
                        accept=".pdf,.docx"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
                
                {isUploading && (
                  <div className="flex items-center gap-2 mt-2 text-xs text-brand-purple font-bold">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Uploading configuration...</span>
                  </div>
                )}
              </div>

              {/* HR / Technical / Coding Selection */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-550 mb-3">
                  Select Interview Track
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    { id: 'HR', label: 'HR Round', desc: 'Behavioral & cultural fit questions', icon: MessageSquare, color: 'text-pink-500 bg-pink-500/10' },
                    { id: 'TECHNICAL', label: 'Technical Round', desc: 'Language rules & core frameworks', icon: Brain, color: 'text-sky-500 bg-sky-500/10' },
                    { id: 'CODING', label: 'Coding Round', desc: 'Algorithm challenges & test cases', icon: Code2, color: 'text-emerald-500 bg-emerald-500/10' },
                  ].map((track) => {
                    const Icon = track.icon;
                    const isSelected = selectedType === track.id;
                    return (
                      <button
                        key={track.id}
                        type="button"
                        onClick={() => setSelectedType(track.id as any)}
                        className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all duration-200 cursor-pointer hover:border-brand-purple/45
                          ${isSelected 
                            ? 'border-brand-purple bg-gradient-to-br from-brand-purple/15 to-brand-indigo/10 shadow-md ring-1 ring-brand-purple/35' 
                            : darkMode ? 'border-white/5 bg-white/3' : 'border-slate-205 bg-slate-50/50'}`}
                      >
                        <div className="flex items-center justify-between mb-4 w-full">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${track.color}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          {isSelected && (
                            <div className="w-3.5 h-3.5 rounded-full bg-brand-purple flex items-center justify-center">
                              <div className="w-1.5 h-1.5 rounded-full bg-white" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-800 dark:text-slate-100">{track.label}</p>
                          <p className="text-[10px] text-slate-450 dark:text-slate-500 font-semibold mt-1.5 max-w-full leading-tight">{track.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Easy / Medium / Hard Selection */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-550 mb-3">
                  Difficulty Level
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'EASY', label: 'Easy', color: 'border-emerald-500/20 text-emerald-450 hover:bg-emerald-500/5' },
                    { id: 'MEDIUM', label: 'Medium', color: 'border-amber-500/20 text-amber-500 hover:bg-amber-500/5' },
                    { id: 'HARD', label: 'Hard', color: 'border-rose-500/25 text-rose-500 hover:bg-rose-500/5' },
                  ].map((level) => {
                    const isSelected = selectedDifficulty === level.id;
                    return (
                      <button
                        key={level.id}
                        type="button"
                        onClick={() => setSelectedDifficulty(level.id as any)}
                        className={`py-3 rounded-xl border text-xs font-black transition-all cursor-pointer text-center
                          ${isSelected 
                            ? 'border-brand-purple bg-brand-purple text-white shadow shadow-brand-purple/20' 
                            : `${level.color} ${darkMode ? 'bg-white/3' : 'bg-slate-50'}`}`}
                      >
                        {level.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Estimated Duration Banner */}
              <div className={`p-4 rounded-2xl border flex items-center justify-between
                ${darkMode ? 'bg-[#1b1933]/40 border-white/6' : 'bg-slate-100/50 border-slate-200'}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-brand-purple/10 text-brand-purple flex items-center justify-center flex-shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-[9px] font-black uppercase text-slate-400">Estimated Duration</span>
                    <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Depends on target answers count</span>
                  </div>
                </div>
                <div>
                  <span className="text-sm font-black text-brand-purple">{estimatedDuration}</span>
                </div>
              </div>

              {/* Launch & Submit Actions */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={
                    isStarting ||
                    isUploading ||
                    !title.trim() ||
                    !profile?.resumeUrl ||
                    !selectedType ||
                    !selectedDifficulty
                  }
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold text-sm tracking-wide text-white bg-gradient-to-r from-brand-purple to-brand-indigo hover:brightness-110 shadow-lg shadow-brand-purple/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isStarting ? (
                    <>
                      <Loader2 className="w-4.5 h-4.5 animate-spin" />
                      <span>Initializing Mock Environment...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4.5 h-4.5 fill-current" />
                      <span>Start Interview</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </motion.div>
        </div>

        {/* ── Previous Sessions Panel (Right Panel) ─────────────────────── */}
        <div className="lg:col-span-5 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className={`${cardClass} p-6`}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5">
                <History className="w-5 h-5 text-brand-purple" />
                <h3 className="font-display font-black text-base">Previous Sessions</h3>
              </div>
              <button
                onClick={() => navigate('/interview-history')}
                className="text-[10px] font-extrabold text-brand-purple hover:text-brand-indigo flex items-center gap-1 cursor-pointer"
              >
                More History <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {histLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-brand-purple" />
              </div>
            ) : detailedHistory.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="w-8 h-8 text-slate-500 mx-auto mb-3" />
                <p className="text-xs text-slate-400 font-semibold mb-1">No session records found.</p>
                <p className="text-[10px] text-slate-500 leading-normal max-w-[200px] mx-auto">
                  Your feedback and evaluations will reflect here once you complete a session.
                </p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                {detailedHistory.slice(0, 10).map((session) => {
                  const typeColors: Record<string, string> = {
                    TECHNICAL: '#0EA5E9',
                    CODING: '#10B981',
                    HR: '#EC4899'
                  };
                  const tColor = typeColors[session.interviewType] ?? '#8B5CF6';
                  const TypeIcon =
                    session.interviewType === 'TECHNICAL'
                      ? Brain
                      : session.interviewType === 'CODING'
                      ? Code2
                      : MessageSquare;

                  return (
                    <div
                      key={session.sessionId}
                      className={`p-4 rounded-2xl border transition-all hover:scale-[1.01] flex items-center gap-3.5
                        ${darkMode ? 'bg-white/2 border-white/5' : 'bg-slate-50/50 border-slate-200/60'}`}
                    >
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: `${tColor}18` }}
                      >
                        <TypeIcon className="w-4.5 h-4.5" style={{ color: tColor }} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-xs truncate text-slate-800 dark:text-slate-205">{session.title}</p>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                          <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-white/5 border border-white/8 text-slate-400">
                            {session.difficulty}
                          </span>
                          <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded text-slate-400">
                            {formatDate(session.startedAt)}
                          </span>
                        </div>
                      </div>

                      {/* Rightmost actions and scores */}
                      <div className="flex flex-col items-end gap-1.5">
                        {session.status === 'COMPLETED' ? (
                          <div className="flex items-center gap-2">
                            <span
                              className="text-xs font-black"
                              style={{ color: scoreColor(session.overallScore) }}
                            >
                              {session.overallScore ?? '—'}/10
                            </span>
                            <button
                              onClick={() => navigate('/interview-history')}
                              className="p-1 rounded hover:bg-brand-purple/10 text-brand-purple"
                              title="View Report"
                            >
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : session.status === 'CANCELLED' ? (
                          <span className="text-[9px] font-extrabold text-slate-400 bg-slate-400/10 px-2 py-0.5 rounded border border-slate-400/15">
                            Cancelled
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              if (session.status === 'NOT_STARTED') {
                                navigate('/self-introduction');
                              } else {
                                navigate('/interview');
                              }
                            }}
                            className="flex items-center gap-1 px-2.5 py-1 rounded bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/20 text-[9px] font-extrabold text-amber-500"
                          >
                            <span>Resume</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </div>

      </div>

    </div>
  );
};
