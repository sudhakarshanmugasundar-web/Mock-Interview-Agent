import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  Award,
  RefreshCw,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Pause,
  Play,
  BarChart3,
  Calendar,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Loader2,
  FileText,
  MessageSquare,
  Code2,
  Brain,
  User,
  Star,
  ArrowUpRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../components/Toast';
import { useInterviewStore } from '../store/interviewStore';
import { InterviewReportPage } from './InterviewReportPage';

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
  endedAt: string | null;
  durationSeconds: number | null;
  resumeScore: number | null;
  hrScore: number | null;
  technicalScore: number | null;
  codingScore: number | null;
  overallScore: number | null;
}

interface DetailedHistoryResponse {
  sessions: HistoryItem[];
  currentPage: number;
  totalItems: number;
  totalPages: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const formatDuration = (seconds: number | null): string => {
  if (!seconds) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
};

const formatDate = (iso: string | null): string => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};

const scoreColor = (v: number | null) => {
  if (v === null || v === undefined) return '#64748B';
  if (v >= 8) return '#10B981';
  if (v >= 6) return '#F59E0B';
  return '#EF4444';
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  COMPLETED:   { label: 'Completed',   color: '#10B981', bg: '#10B98115', icon: CheckCircle  },
  IN_PROGRESS: { label: 'In Progress', color: '#6366F1', bg: '#6366F115', icon: Play          },
  PAUSED:      { label: 'Paused',      color: '#F59E0B', bg: '#F59E0B15', icon: Pause         },
  CANCELLED:   { label: 'Cancelled',   color: '#EF4444', bg: '#EF444415', icon: XCircle       },
  NOT_STARTED: { label: 'Not Started', color: '#64748B', bg: '#64748B15', icon: AlertTriangle },
};

const DIFF_COLOR: Record<string, string> = {
  EASY: '#10B981', MEDIUM: '#F59E0B', HARD: '#EF4444'
};

const TYPE_ICON: Record<string, React.ElementType> = {
  HR: MessageSquare, TECHNICAL: Brain, CODING: Code2, MIXED: BarChart3
};

// ─────────────────────────────────────────────────────────────────────────────
// Score pill
// ─────────────────────────────────────────────────────────────────────────────
const ScorePill: React.FC<{ label: string; value: number | null; icon: React.ElementType }> = ({
  label, value, icon: Icon
}) => {
  const c = scoreColor(value);
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="w-7 h-7 rounded-lg flex items-center justify-center"
        style={{ background: `${c}18` }}>
        <Icon className="w-3.5 h-3.5" style={{ color: c }} />
      </div>
      <span className="text-sm font-black" style={{ color: c }}>
        {value !== null && value !== undefined ? value : '—'}
      </span>
      <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">{label}</span>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Retake confirmation modal
// ─────────────────────────────────────────────────────────────────────────────
const RetakeModal: React.FC<{
  item: HistoryItem;
  onConfirm: () => void;
  onCancel: () => void;
  darkMode: boolean;
}> = ({ item, onConfirm, onCancel, darkMode }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    className="fixed inset-0 z-50 flex items-center justify-center p-4"
    style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
    onClick={onCancel}
  >
    <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.92, opacity: 0 }}
      className={`w-full max-w-md rounded-3xl border p-8 shadow-2xl
        ${darkMode ? 'bg-dark-card border-white/10' : 'bg-white border-slate-200'}`}
      onClick={e => e.stopPropagation()}
    >
      <div className="w-14 h-14 rounded-2xl bg-brand-purple/10 flex items-center justify-center mx-auto mb-5">
        <RefreshCw className="w-7 h-7 text-brand-purple" />
      </div>
      <h3 className="font-display font-extrabold text-xl text-center mb-2">Retake Interview?</h3>
      <p className="text-sm text-slate-400 text-center font-semibold leading-relaxed mb-6">
        Start a fresh interview session with the same settings as <br />
        <span className="text-white font-bold">"{item.title}"</span> ({item.interviewType} · {item.difficulty})?
      </p>
      <div className="flex gap-3">
        <button onClick={onCancel}
          className="flex-1 py-3 rounded-xl font-bold text-sm border cursor-pointer
            border-white/10 text-slate-400 hover:bg-white/5 transition-colors">
          Cancel
        </button>
        <button onClick={onConfirm}
          className="flex-1 py-3 rounded-xl font-bold text-sm text-white cursor-pointer
            bg-gradient-to-r from-brand-purple to-brand-indigo hover:brightness-110
            shadow-lg shadow-brand-purple/25 transition-all">
          Start New Session
        </button>
      </div>
    </motion.div>
  </motion.div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────

export const InterviewHistoryPage: React.FC = () => {
  const { darkMode } = useTheme();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { createSession, startSession } = useInterviewStore();

  // Data
  const [sessions, setSessions] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const PAGE_SIZE = 10;

  // Filters
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterType, setFilterType] = useState('ALL');

  // Modal states
  const [viewReportId, setViewReportId] = useState<number | null>(null);
  const [retakeItem, setRetakeItem] = useState<HistoryItem | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [retaking, setRetaking] = useState(false);

  // Ref for download
  const reportContainerRef = useRef<HTMLDivElement>(null);

  // ── Fetch history ──────────────────────────────────────────────────────────
  const fetchHistory = useCallback(async (p = 0) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(
        `/api/interviews/history/detailed?page=${p}&size=${PAGE_SIZE}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: DetailedHistoryResponse = await res.json();
      setSessions(data.sessions);
      setPage(data.currentPage);
      setTotalPages(data.totalPages);
      setTotalItems(data.totalItems);
    } catch (err: any) {
      showToast('Failed to load interview history.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchHistory(0); }, [fetchHistory]);

  // ── Filtered list (client-side) ────────────────────────────────────────────
  const filtered = sessions.filter(s => {
    const matchSearch = !search || s.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'ALL' || s.status === filterStatus;
    const matchType   = filterType  === 'ALL' || s.interviewType === filterType;
    return matchSearch && matchStatus && matchType;
  });

  // ── Download PDF for a session ─────────────────────────────────────────────
  const handleDownload = async (item: HistoryItem) => {
    if (item.status !== 'COMPLETED') {
      showToast('Report is only available for completed sessions.', 'info');
      return;
    }
    setDownloadingId(item.sessionId);
    try {
      const { default: html2canvas } = await import('html2canvas');
      const { jsPDF } = await import('jspdf');
      // Render report in hidden div
      setViewReportId(item.sessionId);
      // Wait for render
      await new Promise(r => setTimeout(r, 1200));
      const el = reportContainerRef.current;
      if (!el) throw new Error('Report not rendered');
      const canvas = await html2canvas(el, {
        scale: 2, useCORS: true,
        backgroundColor: darkMode ? '#0f0f1a' : '#ffffff',
        logging: false
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const imgH = (canvas.height * pageW) / canvas.width;
      let heightLeft = imgH;
      let position = 0;
      pdf.addImage(imgData, 'PNG', 0, position, pageW, imgH);
      heightLeft -= pageH;
      while (heightLeft > 0) {
        position -= pageH;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pageW, imgH);
        heightLeft -= pageH;
      }
      pdf.save(`report_session_${item.sessionId}_${new Date().toISOString().slice(0, 10)}.pdf`);
      showToast('PDF downloaded successfully!', 'success');
    } catch (e: any) {
      showToast('Failed to generate PDF: ' + e.message, 'error');
    } finally {
      setDownloadingId(null);
      setViewReportId(null);
    }
  };

  // ── Retake interview ───────────────────────────────────────────────────────
  const handleRetakeConfirm = async () => {
    if (!retakeItem) return;
    setRetaking(true);
    try {
      const newSession = await createSession(
        `${retakeItem.title} (Retake)`,
        retakeItem.interviewType,
        retakeItem.difficulty
      );
      await startSession(newSession.id);
      localStorage.setItem('active_interview_session_id', String(newSession.id));
      localStorage.setItem('active_interview_stage', '0');
      navigate('/interview');
      showToast('New interview session started!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to create session.', 'error');
    } finally {
      setRetaking(false);
      setRetakeItem(null);
    }
  };

  const cardCls = `rounded-3xl border shadow-xl backdrop-blur-2xl
    ${darkMode ? 'bg-dark-card border-white/8 glass-panel' : 'bg-light-card border-slate-200/50'}`;

  // ─────────────────────────────────────────────────────────────────────────
  // Report Viewer (fullscreen modal overlay)
  // ─────────────────────────────────────────────────────────────────────────
  if (viewReportId !== null && downloadingId === null) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 overflow-y-auto"
        style={{ background: darkMode ? '#0f0f1a' : '#f8fafc' }}
      >
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setViewReportId(null)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold
                border border-white/10 text-slate-400 hover:bg-white/5 cursor-pointer transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Back to History
            </button>
          </div>
          <InterviewReportPage
            sessionId={viewReportId}
            onDone={() => setViewReportId(null)}
          />
        </div>
      </motion.div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Main Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Hidden report container for PDF generation */}
      {downloadingId !== null && viewReportId !== null && (
        <div ref={reportContainerRef} className="fixed -left-[9999px] top-0 w-[1100px] overflow-visible"
          style={{ background: darkMode ? '#0f0f1a' : '#ffffff', padding: '32px' }}
        >
          <InterviewReportPage sessionId={viewReportId} onDone={() => {}} />
        </div>
      )}

      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-extrabold text-3xl">Interview History</h1>
          <p className="text-sm text-slate-400 font-semibold mt-1">
            {totalItems} total session{totalItems !== 1 ? 's' : ''} · All your interview records
          </p>
        </div>
        <button
          onClick={() => fetchHistory(page)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold
            border border-white/10 text-slate-400 hover:bg-white/5 cursor-pointer transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* ── Stats Strip ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: 'Total', value: totalItems,
            icon: FileText, color: '#8B5CF6'
          },
          {
            label: 'Completed',
            value: sessions.filter(s => s.status === 'COMPLETED').length,
            icon: CheckCircle, color: '#10B981'
          },
          {
            label: 'Avg Score',
            value: (() => {
              const scored = sessions.filter(s => s.overallScore !== null);
              if (!scored.length) return '—';
              return (scored.reduce((a, s) => a + (s.overallScore ?? 0), 0) / scored.length).toFixed(1);
            })(),
            icon: Star, color: '#F59E0B'
          },
          {
            label: 'Best Score',
            value: sessions.reduce((best, s) =>
              s.overallScore !== null && s.overallScore > best ? s.overallScore : best, 0
            ) || '—',
            icon: Award, color: '#EC4899'
          },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className={`${cardCls} p-5 flex items-center gap-4`}
            >
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${stat.color}18` }}>
                <Icon className="w-5 h-5" style={{ color: stat.color }} />
              </div>
              <div>
                <p className="text-xl font-black">{stat.value}</p>
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">{stat.label}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ── Filters ─────────────────────────────────────────────────────── */}
      <div className={`${cardCls} p-4 flex flex-col md:flex-row gap-3`}>
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by interview name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className={`w-full pl-9 pr-4 py-2.5 rounded-xl text-sm font-semibold border outline-none transition-all
              ${darkMode
                ? 'bg-white/5 border-white/8 text-white placeholder-slate-500 focus:border-brand-purple/50'
                : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-brand-purple/40'
              }`}
          />
        </div>
        {/* Status filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className={`px-3 py-2.5 rounded-xl text-sm font-semibold border outline-none cursor-pointer
              ${darkMode
                ? 'bg-white/5 border-white/8 text-white'
                : 'bg-slate-50 border-slate-200 text-slate-900'
              }`}
          >
            <option value="ALL">All Status</option>
            <option value="COMPLETED">Completed</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="PAUSED">Paused</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="NOT_STARTED">Not Started</option>
          </select>
          <select value={filterType} onChange={e => setFilterType(e.target.value)}
            className={`px-3 py-2.5 rounded-xl text-sm font-semibold border outline-none cursor-pointer
              ${darkMode
                ? 'bg-white/5 border-white/8 text-white'
                : 'bg-slate-50 border-slate-200 text-slate-900'
              }`}
          >
            <option value="ALL">All Types</option>
            <option value="HR">HR</option>
            <option value="TECHNICAL">Technical</option>
            <option value="CODING">Coding</option>
          </select>
        </div>
      </div>

      {/* ── Session Cards ────────────────────────────────────────────────── */}
      {loading ? (
        <div className={`${cardCls} p-16 flex flex-col items-center gap-4`}>
          <Loader2 className="w-10 h-10 animate-spin text-brand-purple" />
          <p className="text-sm font-bold text-slate-400">Loading interview history...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className={`${cardCls} p-16 flex flex-col items-center gap-4 text-center`}>
          <FileText className="w-12 h-12 text-slate-600" />
          <div>
            <p className="font-display font-extrabold text-lg">No interviews found</p>
            <p className="text-sm text-slate-400 font-semibold mt-1">
              {sessions.length === 0
                ? "You haven't completed any interviews yet. Start your first session!"
                : 'Try adjusting your filters.'}
            </p>
          </div>
          {sessions.length === 0 && (
            <button
              onClick={() => navigate('/mock-interviews')}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white mt-2
                bg-gradient-to-r from-brand-purple to-brand-indigo hover:brightness-110
                shadow-lg shadow-brand-purple/20 cursor-pointer transition-all"
            >
              <ArrowUpRight className="w-4 h-4" /> Start Interview
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {filtered.map((item, idx) => {
              const StatusIcon  = (STATUS_CONFIG[item.status] ?? STATUS_CONFIG.NOT_STARTED).icon;
              const statusCfg   = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.NOT_STARTED;
              const TypeIcon    = TYPE_ICON[item.interviewType] ?? BarChart3;
              const diffColor   = DIFF_COLOR[item.difficulty] ?? '#8B5CF6';
              const isCompleted = item.status === 'COMPLETED';

              return (
                <motion.div
                  key={item.sessionId}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ delay: idx * 0.04 }}
                  className={`${cardCls} overflow-hidden`}
                >
                  {/* ── Card header ─────────────────────────────────────── */}
                  <div className={`px-6 py-4 flex items-start justify-between gap-4
                    ${darkMode ? 'border-b border-white/5' : 'border-b border-slate-100'}`}
                  >
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                        style={{ background: `${diffColor}18` }}>
                        <TypeIcon className="w-5 h-5" style={{ color: diffColor }} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-display font-extrabold text-base truncate">{item.title}</h3>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          {/* Type badge */}
                          <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-lg
                            bg-brand-purple/10 text-brand-purple border border-brand-purple/20">
                            {item.interviewType}
                          </span>
                          {/* Difficulty badge */}
                          <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-lg border"
                            style={{ color: diffColor, background: `${diffColor}12`, borderColor: `${diffColor}30` }}>
                            {item.difficulty}
                          </span>
                          {/* Date */}
                          <span className="flex items-center gap-1 text-[10px] font-semibold text-slate-400">
                            <Calendar className="w-3 h-3" />
                            {formatDate(item.startedAt)}
                          </span>
                          {/* Duration */}
                          <span className="flex items-center gap-1 text-[10px] font-semibold text-slate-400">
                            <Clock className="w-3 h-3" />
                            {formatDuration(item.durationSeconds)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status pill */}
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border flex-shrink-0"
                      style={{ background: statusCfg.bg, borderColor: `${statusCfg.color}30` }}>
                      <StatusIcon className="w-3.5 h-3.5" style={{ color: statusCfg.color }} />
                      <span className="text-[10px] font-extrabold uppercase" style={{ color: statusCfg.color }}>
                        {statusCfg.label}
                      </span>
                    </div>
                  </div>

                  {/* ── Scores row ──────────────────────────────────────── */}
                  <div className={`px-6 py-4 ${darkMode ? 'bg-white/1' : 'bg-slate-50/50'}`}>
                    <div className="grid grid-cols-5 gap-4">
                      <ScorePill label="Resume"    value={item.resumeScore}    icon={User} />
                      <ScorePill label="HR"         value={item.hrScore}        icon={MessageSquare} />
                      <ScorePill label="Technical"  value={item.technicalScore} icon={Brain} />
                      <ScorePill label="Coding"     value={item.codingScore}    icon={Code2} />
                      {/* Overall — larger */}
                      <div className="flex flex-col items-center gap-1">
                        <div className="relative w-10 h-10">
                          <svg className="-rotate-90 w-10 h-10" viewBox="0 0 40 40">
                            <circle cx="20" cy="20" r="15" fill="transparent"
                              stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
                            <circle cx="20" cy="20" r="15" fill="transparent"
                              stroke={scoreColor(item.overallScore)} strokeWidth="4"
                              strokeDasharray={2 * Math.PI * 15}
                              strokeDashoffset={
                                item.overallScore !== null
                                  ? 2 * Math.PI * 15 * (1 - item.overallScore / 10)
                                  : 2 * Math.PI * 15
                              }
                              strokeLinecap="round"
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-[10px] font-black"
                              style={{ color: scoreColor(item.overallScore) }}>
                              {item.overallScore ?? '—'}
                            </span>
                          </div>
                        </div>
                        <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Overall</span>
                      </div>
                    </div>
                  </div>

                  {/* ── Actions row ─────────────────────────────────────── */}
                  <div className={`px-6 py-3 flex items-center gap-2
                    ${darkMode ? 'border-t border-white/5' : 'border-t border-slate-100'}`}
                  >
                    {/* View Report */}
                    <button
                      onClick={() => {
                        if (!isCompleted) { showToast('Report is only available for completed sessions.', 'info'); return; }
                        setViewReportId(item.sessionId);
                      }}
                      disabled={!isCompleted}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-extrabold
                        border cursor-pointer transition-all
                        ${isCompleted
                          ? 'border-brand-purple/20 bg-brand-purple/8 text-brand-purple hover:bg-brand-purple/15'
                          : 'border-white/5 bg-white/3 text-slate-500 cursor-not-allowed opacity-50'
                        }`}
                    >
                      <Eye className="w-3.5 h-3.5" /> View Report
                    </button>

                    {/* Download Report */}
                    <button
                      onClick={() => handleDownload(item)}
                      disabled={!isCompleted || downloadingId === item.sessionId}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-extrabold
                        border cursor-pointer transition-all
                        ${isCompleted
                          ? 'border-emerald-500/20 bg-emerald-500/8 text-emerald-400 hover:bg-emerald-500/15'
                          : 'border-white/5 bg-white/3 text-slate-500 cursor-not-allowed opacity-50'
                        }`}
                    >
                      {downloadingId === item.sessionId
                        ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Exporting...</>
                        : <><Download className="w-3.5 h-3.5" /> Download PDF</>
                      }
                    </button>

                    {/* Retake */}
                    <button
                      onClick={() => setRetakeItem(item)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-extrabold
                        border border-amber-500/20 bg-amber-500/8 text-amber-400 hover:bg-amber-500/15
                        cursor-pointer transition-all ml-auto"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Retake
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* ── Pagination ──────────────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => fetchHistory(page - 1)}
            disabled={page === 0 || loading}
            className="flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-bold
              border border-white/8 text-slate-400 hover:bg-white/5 disabled:opacity-40
              cursor-pointer transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Prev
          </button>
          <div className="flex items-center gap-1.5">
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              const p = i;
              return (
                <button key={p}
                  onClick={() => fetchHistory(p)}
                  className={`w-8 h-8 rounded-lg text-xs font-extrabold cursor-pointer transition-all
                    ${page === p
                      ? 'bg-brand-purple text-white shadow-md'
                      : 'text-slate-400 hover:bg-white/8 border border-white/5'
                    }`}
                >
                  {p + 1}
                </button>
              );
            })}
          </div>
          <button
            onClick={() => fetchHistory(page + 1)}
            disabled={page >= totalPages - 1 || loading}
            className="flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-bold
              border border-white/8 text-slate-400 hover:bg-white/5 disabled:opacity-40
              cursor-pointer transition-colors"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Retake confirmation modal ────────────────────────────────────── */}
      <AnimatePresence>
        {retakeItem && (
          <RetakeModal
            item={retakeItem}
            darkMode={darkMode}
            onConfirm={handleRetakeConfirm}
            onCancel={() => setRetakeItem(null)}
          />
        )}
      </AnimatePresence>

      {/* Loading overlay for retake */}
      <AnimatePresence>
        {retaking && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}
          >
            <div className={`p-8 rounded-3xl border text-center
              ${darkMode ? 'bg-dark-card border-white/10' : 'bg-white border-slate-200'}`}>
              <Loader2 className="w-10 h-10 animate-spin text-brand-purple mx-auto mb-3" />
              <p className="font-bold text-sm">Setting up new session...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
