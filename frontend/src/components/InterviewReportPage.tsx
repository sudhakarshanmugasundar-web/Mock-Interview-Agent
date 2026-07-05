import React, { useEffect, useRef, useState } from 'react';
import {
  Award,
  Download,
  CheckCircle,
  AlertTriangle,
  XCircle,
  TrendingUp,
  TrendingDown,
  BookOpen,
  Star,
  User,
  Calendar,
  BarChart3,
  MessageSquare,
  Code2,
  Loader2,
  ChevronDown,
  ChevronUp,
  ThumbsUp,
  ThumbsDown,
  Lightbulb,
  Target,
  Brain
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import type { InterviewReportResponse } from '../types/interview';

// ─────────────────────────────────────────────────────────────────────────────
// Score ring (animated SVG)
// ─────────────────────────────────────────────────────────────────────────────
const ScoreRing: React.FC<{
  score: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  color: string;
  label?: string;
}> = ({ score, max = 10, size = 96, strokeWidth = 7, color, label }) => {
  const r = (size - strokeWidth * 2) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(score / max, 1);
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="transparent"
            stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth} />
          <motion.circle
            cx={size / 2} cy={size / 2} r={r} fill="transparent"
            stroke={color} strokeWidth={strokeWidth}
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: circ * (1 - pct) }}
            transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-black text-lg leading-none"
            style={{ color }}>{score}</span>
          <span className="text-[9px] font-bold text-slate-400">/{max}</span>
        </div>
      </div>
      {label && <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider text-center">{label}</p>}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Horizontal score bar
// ─────────────────────────────────────────────────────────────────────────────
const ScoreBar: React.FC<{
  label: string;
  value: number;
  max?: number;
  color: string;
  delay?: number;
}> = ({ label, value, max = 10, color, delay = 0 }) => {
  const pct = Math.min((value / max) * 100, 100);
  const textColor = value >= 8 ? '#10B981' : value >= 6 ? '#F59E0B' : '#EF4444';
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">{label}</span>
        <span className="text-sm font-black" style={{ color: textColor }}>{value}/{max}</span>
      </div>
      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.9, ease: 'easeOut', delay }}
          className="h-full rounded-full"
          style={{ background: color }}
        />
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Recommendation badge
// ─────────────────────────────────────────────────────────────────────────────
const REC_CONFIG = {
  STRONG_HIRE: { label: 'Strong Hire',  color: '#10B981', icon: CheckCircle,    bg: '#10B98115', border: '#10B98130' },
  HIRE:        { label: 'Hire',         color: '#6366F1', icon: ThumbsUp,       bg: '#6366F115', border: '#6366F130' },
  CONSIDER:    { label: 'Consider',     color: '#F59E0B', icon: AlertTriangle,   bg: '#F59E0B15', border: '#F59E0B30' },
  NO_HIRE:     { label: 'No Hire',      color: '#EF4444', icon: XCircle,        bg: '#EF444415', border: '#EF444430' },
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  sessionId: number;
  onDone: () => void;
}

export const InterviewReportPage: React.FC<Props> = ({ sessionId, onDone }) => {
  const { darkMode } = useTheme();
  const reportRef = useRef<HTMLDivElement>(null);
  const [report, setReport] = useState<InterviewReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [expandBreakdown, setExpandBreakdown] = useState(false);

  // ── Fetch report from backend ───────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    setLoading(true);
    fetch(`/api/interviews/${sessionId}/report`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => {
        if (!r.ok) throw new Error(`Status ${r.status}`);
        return r.json();
      })
      .then((data: InterviewReportResponse) => setReport(data))
      .catch(e => setError('Failed to load report: ' + e.message))
      .finally(() => setLoading(false));
  }, [sessionId]);

  // ── PDF download ────────────────────────────────────────────────────────
  const handleDownloadPDF = async () => {
    if (!reportRef.current || !report) return;
    setDownloading(true);
    try {
      const { default: html2canvas } = await import('html2canvas');
      const { jsPDF } = await import('jspdf');

      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
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

      pdf.save(`interview_report_${report.candidateName.replace(/\s/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setDownloading(false);
    }
  };

  // ── Loading ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className={`min-h-[60vh] flex flex-col items-center justify-center gap-6 p-12 rounded-3xl border
        ${darkMode ? 'bg-dark-card border-white/8 glass-panel' : 'bg-light-card border-slate-200/50'}`}
      >
        <div className="relative w-20 h-20 flex items-center justify-center">
          <Loader2 className="absolute w-16 h-16 animate-spin text-brand-purple" />
          <Award className="w-8 h-8 animate-pulse text-brand-purple" />
        </div>
        <div className="text-center">
          <h3 className="font-display font-extrabold text-xl mb-1">Generating Your Report</h3>
          <p className="text-sm text-brand-purple font-bold animate-pulse">
            AI is analysing all rounds and compiling insights...
          </p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="p-8 rounded-3xl border border-rose-500/20 bg-rose-500/5 text-center">
        <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
        <p className="text-sm font-bold text-rose-400">{error || 'Report unavailable.'}</p>
        <button onClick={onDone}
          className="mt-4 px-5 py-2 rounded-xl text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 cursor-pointer hover:bg-rose-500/20">
          Back to Dashboard
        </button>
      </div>
    );
  }

  const rec = REC_CONFIG[report.recommendation] ?? REC_CONFIG.CONSIDER;
  const RecIcon = rec.icon;

  const roundScores = [
    { label: 'Resume',    value: report.resumeScore,    color: '#8B5CF6', icon: User },
    { label: 'HR',        value: report.hrScore,        color: '#EC4899', icon: MessageSquare },
    { label: 'Technical', value: report.technicalScore, color: '#0EA5E9', icon: Brain },
    { label: 'Coding',    value: report.codingScore,    color: '#10B981', icon: Code2 },
  ];

  const softSkills = [
    { label: 'Communication',  value: report.communicationAvg,   color: '#8B5CF6', delay: 0     },
    { label: 'Grammar',        value: report.grammarAvg,          color: '#6366F1', delay: 0.05  },
    { label: 'Confidence',     value: report.confidenceAvg,       color: '#F59E0B', delay: 0.10  },
    { label: 'Fluency',        value: report.fluencyAvg,          color: '#EC4899', delay: 0.15  },
    { label: 'Problem Solving',value: report.problemSolvingAvg,   color: '#0EA5E9', delay: 0.20  },
    { label: 'Completeness',   value: report.completenessAvg,     color: '#10B981', delay: 0.25  },
    { label: 'Professionalism',value: report.professionalismaAvg, color: '#EF4444', delay: 0.30  },
  ];

  const cardCls = `rounded-3xl border shadow-xl backdrop-blur-2xl
    ${darkMode ? 'bg-dark-card border-white/8 glass-panel' : 'bg-light-card border-slate-200/50'}`;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Action bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-extrabold text-2xl">Interview Report</h2>
          <p className="text-xs text-slate-400 font-semibold mt-0.5">
            Session #{report.sessionId} · {report.interviewType} · {report.difficulty}
          </p>
        </div>
        <button
          onClick={handleDownloadPDF}
          disabled={downloading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white
            bg-gradient-to-r from-brand-purple to-brand-indigo hover:brightness-110
            shadow-lg shadow-brand-purple/25 transition-all cursor-pointer disabled:opacity-60"
        >
          {downloading
            ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Exporting...</span></>
            : <><Download className="w-4 h-4" /><span>Download PDF</span></>
          }
        </button>
      </div>

      {/* ─── Printable report content ─── */}
      <div ref={reportRef} className="space-y-5">

        {/* ── Header banner ──────────────────────────────────────────────── */}
        <div className={`${cardCls} p-7 overflow-hidden relative`}>
          {/* Decorative gradient blob */}
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full blur-3xl pointer-events-none"
            style={{ background: `${rec.color}18` }} />
          <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
            {/* Candidate info */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl text-white"
                style={{ background: `linear-gradient(135deg, #8B5CF6, #6366F1)` }}>
                {report.candidateName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="font-display font-extrabold text-xl">{report.candidateName}</h3>
                <p className="text-xs text-slate-400 font-semibold">{report.candidateEmail}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-lg
                    bg-brand-purple/10 text-brand-purple border border-brand-purple/20">
                    {report.interviewType}
                  </span>
                  <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-lg
                    bg-white/5 text-slate-400 border border-white/8">
                    {report.difficulty}
                  </span>
                  <span className="flex items-center gap-1 text-[9px] font-bold text-slate-400">
                    <Calendar className="w-3 h-3" />
                    {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>

            {/* Recommendation badge */}
            <div className="flex flex-col items-center gap-2 px-6 py-4 rounded-2xl border"
              style={{ background: rec.bg, borderColor: rec.border }}>
              <RecIcon className="w-6 h-6" style={{ color: rec.color }} />
              <span className="text-xs font-black uppercase tracking-wider" style={{ color: rec.color }}>
                {rec.label}
              </span>
              <span className="text-[9px] font-bold text-slate-400">Hiring Verdict</span>
            </div>
          </div>

          {/* Recommendation detail */}
          <p className={`mt-5 pt-5 border-t text-xs font-semibold leading-relaxed
            ${darkMode ? 'border-white/5 text-slate-300' : 'border-slate-200/50 text-slate-600'}`}>
            {report.recommendationDetail}
          </p>
        </div>

        {/* ── Overall + Round Scores ──────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
          {/* Overall ring — larger */}
          <div className={`${cardCls} p-6 flex flex-col items-center justify-center text-center md:col-span-1`}>
            <ScoreRing
              score={report.overallScore}
              size={110}
              strokeWidth={8}
              color={report.overallScore >= 8 ? '#10B981' : report.overallScore >= 6 ? '#F59E0B' : '#EF4444'}
            />
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mt-3">Overall</p>
            <div className="flex items-center gap-1 mt-1">
              <Star className="w-3 h-3 text-amber-400" />
              <span className="text-[10px] font-bold text-amber-400">
                {report.overallScore >= 8 ? 'Excellent' : report.overallScore >= 6 ? 'Good' : report.overallScore >= 4 ? 'Average' : 'Needs Work'}
              </span>
            </div>
          </div>

          {/* Round score rings */}
          <div className={`${cardCls} p-6 md:col-span-4`}>
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-5">Round Scores</p>
            <div className="grid grid-cols-4 gap-4">
              {roundScores.map(rs => {
                const RsIcon = rs.icon;
                return (
                  <div key={rs.label} className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                      style={{ background: `${rs.color}18` }}>
                      <RsIcon className="w-4 h-4" style={{ color: rs.color }} />
                    </div>
                    {rs.value !== null && rs.value !== undefined ? (
                      <ScoreRing score={rs.value} size={72} strokeWidth={6} color={rs.color} />
                    ) : (
                      <div className="w-18 h-18 flex items-center justify-center">
                        <span className="text-xs font-bold text-slate-500">N/A</span>
                      </div>
                    )}
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                      {rs.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Soft Skills ────────────────────────────────────────────────── */}
        <div className={`${cardCls} p-6`}>
          <div className="flex items-center gap-2 mb-5">
            <BarChart3 className="w-4 h-4 text-brand-purple" />
            <h4 className="font-display font-extrabold text-sm uppercase tracking-wide">
              Soft Skill Breakdown
            </h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            {softSkills.map(ss => (
              <ScoreBar key={ss.label} label={ss.label} value={ss.value}
                color={ss.color} delay={ss.delay} />
            ))}
          </div>
        </div>

        {/* ── Strong Areas + Weak Areas ───────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }} className={`${cardCls} p-6`}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="text-xs font-extrabold text-emerald-400 uppercase tracking-wider">
                Strong Areas
              </span>
            </div>
            <p className={`text-xs leading-relaxed whitespace-pre-line font-semibold
              ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              {report.strongAreas}
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }} className={`${cardCls} p-6`}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-rose-500/10 flex items-center justify-center">
                <TrendingDown className="w-4 h-4 text-rose-400" />
              </div>
              <span className="text-xs font-extrabold text-rose-400 uppercase tracking-wider">
                Weak Areas
              </span>
            </div>
            <p className={`text-xs leading-relaxed whitespace-pre-line font-semibold
              ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              {report.weakAreas}
            </p>
          </motion.div>
        </div>

        {/* ── Suggested Learning Path ─────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }} className={`${cardCls} p-6`}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-amber-400" />
            </div>
            <h4 className="font-display font-extrabold text-sm uppercase tracking-wide">
              Suggested Learning Path
            </h4>
          </div>
          <div className={`p-4 rounded-2xl border
            ${darkMode ? 'bg-amber-500/5 border-amber-500/15' : 'bg-amber-50 border-amber-200/60'}`}>
            {/* Parse bullet points into timeline-style list */}
            {report.suggestedLearningPath
              .split('\n')
              .filter(l => l.trim())
              .map((line, i) => (
                <div key={i} className="flex items-start gap-3 mb-3 last:mb-0">
                  <div className="w-5 h-5 rounded-full border-2 border-amber-400 flex-shrink-0 mt-0.5
                    flex items-center justify-center">
                    <span className="text-[8px] font-black text-amber-400">{i + 1}</span>
                  </div>
                  <p className={`text-xs leading-relaxed font-semibold flex-1
                    ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    {line.replace(/^[•\-\*]\s*/, '')}
                  </p>
                </div>
              ))}
          </div>
        </motion.div>

        {/* ── Per-Question Breakdown (collapsible) ────────────────────────── */}
        <div className={`${cardCls} overflow-hidden`}>
          <button
            onClick={() => setExpandBreakdown(p => !p)}
            className="w-full px-6 py-4 flex items-center justify-between cursor-pointer
              hover:bg-white/3 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-brand-purple" />
              <span className="font-display font-extrabold text-sm uppercase tracking-wide">
                Per-Question Breakdown
              </span>
              <span className="text-[10px] font-bold text-slate-400">
                ({report.questionBreakdown.length} questions)
              </span>
            </div>
            {expandBreakdown
              ? <ChevronUp className="w-4 h-4 text-slate-400" />
              : <ChevronDown className="w-4 h-4 text-slate-400" />
            }
          </button>

          <AnimatePresence>
            {expandBreakdown && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="divide-y divide-white/5">
                  {report.questionBreakdown.map((q, idx) => {
                    const roundLabel =
                      q.questionSequence <= 2 ? 'HR' :
                      q.questionSequence <= 4 ? 'Technical' : 'Coding';
                    const roundColor =
                      q.questionSequence <= 2 ? '#EC4899' :
                      q.questionSequence <= 4 ? '#0EA5E9' : '#10B981';
                    return (
                      <div key={idx} className="px-6 py-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md"
                              style={{ color: roundColor, background: `${roundColor}18` }}>
                              {roundLabel} Q{idx + 1}
                            </span>
                          </div>
                          {q.overallScore != null && (
                            <span className="text-xs font-black"
                              style={{ color: q.overallScore >= 8 ? '#10B981' : q.overallScore >= 6 ? '#F59E0B' : '#EF4444' }}>
                              {q.overallScore}/10
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-bold">{q.questionText}</p>
                        {q.feedbackText && (
                          <p className={`text-[11px] font-semibold leading-relaxed
                            ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            {q.feedbackText}
                          </p>
                        )}
                        {(q.strengths || q.weaknesses) && (
                          <div className="grid grid-cols-2 gap-3 mt-1">
                            {q.strengths && (
                              <div className="flex items-start gap-1.5">
                                <ThumbsUp className="w-3 h-3 text-emerald-400 flex-shrink-0 mt-0.5" />
                                <p className="text-[10px] text-emerald-300 font-semibold leading-relaxed">
                                  {q.strengths}
                                </p>
                              </div>
                            )}
                            {q.weaknesses && (
                              <div className="flex items-start gap-1.5">
                                <ThumbsDown className="w-3 h-3 text-rose-400 flex-shrink-0 mt-0.5" />
                                <p className="text-[10px] text-rose-300 font-semibold leading-relaxed">
                                  {q.weaknesses}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Footer watermark ────────────────────────────────────────────── */}
        <div className="text-center py-3">
          <p className="text-[10px] font-bold text-slate-500">
            Generated by Mock Interview AI · Session #{report.sessionId} ·{' '}
            {new Date().toLocaleString('en-IN')}
          </p>
        </div>

      </div>

      {/* CTA */}
      <div className="flex justify-center pt-2">
        <button
          onClick={onDone}
          className="flex items-center gap-2 px-7 py-3 rounded-xl font-bold text-sm text-white
            bg-gradient-to-r from-brand-purple to-brand-indigo hover:brightness-110
            shadow-lg shadow-brand-purple/20 cursor-pointer transition-all"
        >
          <Lightbulb className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>
      </div>
    </div>
  );
};
