import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mic,
  Keyboard,
  Send,
  Pause,
  Play,
  CheckCircle,
  Loader2,
  Clock,
  ArrowRight,
  Check,
  Award,
  AlertCircle,
  FileText,
  ThumbsUp,
  ThumbsDown,
  Volume2,
  VolumeX,
  Lightbulb,
  MessageSquare,
  Star,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { useTheme } from '../context/ThemeContext';
import { useToast } from '../components/Toast';
import { useInterviewStore } from '../store/interviewStore';
import { ThemeToggle } from '../components/ThemeToggle';
import { CodingRoundPanel } from '../components/CodingRoundPanel';
import { InterviewReportPage } from '../components/InterviewReportPage';

const STAGES = [
  { label: 'Resume Verification', index: 0 },
  { label: 'HR Round', index: 1 },
  { label: 'Technical Round', index: 2 },
  { label: 'Coding Round', index: 3 },
  { label: 'Final Evaluation', index: 4 },
  { label: 'Report', index: 5 }
];

// Score metric config for the 7 criteria
const EVAL_METRICS = [
  { key: 'communication',      label: 'Communication',     color: '#8B5CF6', description: 'Clarity & expression' },
  { key: 'grammar',            label: 'Grammar',           color: '#6366F1', description: 'Grammatical correctness' },
  { key: 'fluency',            label: 'Fluency',           color: '#EC4899', description: 'Natural language flow' },
  { key: 'confidence',         label: 'Confidence',        color: '#F59E0B', description: 'Assertiveness & conviction' },
  { key: 'relevance',          label: 'Relevance',         color: '#10B981', description: 'On-topic accuracy' },
  { key: 'professionalism',    label: 'Professionalism',   color: '#0EA5E9', description: 'Tone & vocabulary' },
  { key: 'completeness',       label: 'Completeness',      color: '#EF4444', description: 'Thoroughness of answer' },
];

// Mini radial progress for each metric
const ScoreRing: React.FC<{ value: number; color: string; size?: number }> = ({ value, color, size = 56 }) => {
  const r = (size - 8) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (circumference * Math.min(value, 10)) / 10;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="transparent" stroke="rgba(255,255,255,0.08)" strokeWidth={4} />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="transparent" stroke={color} strokeWidth={4}
        strokeDasharray={circumference} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.8s ease' }}
      />
    </svg>
  );
};

export const InterviewPage: React.FC = () => {
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const {
    profile,
    fetchProfile,
    activeSession,
    currentQuestion,
    feedback,
    fetchFeedback,
    fetchResult,
    isLoading,
    fetchCurrentSession,
    fetchNextQuestion,
    submitAnswer,
    uploadAudio,
    pauseSession,
    resumeSession,
    completeSession,
    cancelSession,
    startSession,
    clearActiveSession
  } = useInterviewStore();

  const [stage, setStage] = useState<number>(() => {
    const saved = localStorage.getItem('active_interview_stage');
    return saved ? Number(saved) : 0;
  });

  const [isTtsEnabled, setIsTtsEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('active_interview_tts');
    return saved ? JSON.parse(saved) : true;
  });

  const [answerText, setAnswerText] = useState('');
  const [answerMode, setAnswerMode] = useState<'TEXT' | 'VOICE'>('TEXT');
  const [isRecording, setIsRecording] = useState(false);
  const [responseTime, setResponseTime] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [answerSubmitted, setAnswerSubmitted] = useState(false);
  const [evaluationFeedback, setEvaluationFeedback] = useState<any>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [evalTab, setEvalTab] = useState<'scores' | 'strengths' | 'suggestions' | 'sample'>('scores');

  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);
  const isRecordingRef = useRef(false);
  const evalPanelRef = useRef<HTMLDivElement | null>(null);

  // ── localStorage sync ──────────────────────────────────────────────────────
  useEffect(() => {
    localStorage.setItem('active_interview_stage', stage.toString());
  }, [stage]);

  useEffect(() => {
    localStorage.setItem('active_interview_tts', JSON.stringify(isTtsEnabled));
    if (!isTtsEnabled && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, [isTtsEnabled]);

  // ── Bootstrap ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!profile) fetchProfile().catch(() => {});
  }, [profile, fetchProfile]);

  useEffect(() => {
    fetchCurrentSession().catch(() => {});
  }, [fetchCurrentSession]);

  useEffect(() => {
    if (activeSession) {
      localStorage.setItem('active_interview_session_id', activeSession.id.toString());
      if (activeSession.status === 'NOT_STARTED') {
        setStage(0);
      } else if (activeSession.status === 'COMPLETED') {
        setStage(5);
        fetchResult(activeSession.id).catch(() => {});
      } else {
        fetchFeedback(activeSession.id).catch(() => {});
      }
    }
  }, [activeSession, fetchFeedback, fetchResult]);

  // Stage derivation from answer count
  useEffect(() => {
    if (activeSession && activeSession.status === 'IN_PROGRESS' && feedback) {
      const count = feedback.length;
      if (count <= 1) setStage(1);
      else if (count <= 3) setStage(2);
      else if (count === 4) setStage(3);
      else setStage(4);
    }
  }, [feedback, activeSession]);

  useEffect(() => {
    if (activeSession && activeSession.status === 'IN_PROGRESS' && stage >= 1 && stage <= 3 && !currentQuestion && !isLoading) {
      fetchNextQuestion(activeSession.id).catch(() => {});
    }
  }, [activeSession, stage, currentQuestion, fetchNextQuestion, isLoading]);

  useEffect(() => {
    if (stage === 4 && activeSession) {
      (async () => {
        try {
          await completeSession(activeSession.id);
          await fetchResult(activeSession.id);
        } catch {
          try { await fetchResult(activeSession.id); } catch { showToast('Unable to load evaluations.', 'error'); }
        }
        setStage(5);
      })();
    }
  }, [stage, activeSession, completeSession, fetchResult, showToast]);

  // ── TTS ────────────────────────────────────────────────────────────────────
  const speakQuestion = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 1.0; u.pitch = 1.0; u.lang = 'en-US';
      window.speechSynthesis.speak(u);
    }
  };

  useEffect(() => {
    if (currentQuestion && isTtsEnabled && stage >= 1 && stage <= 3) {
      speakQuestion(currentQuestion.questionText);
    }
    return () => { if ('speechSynthesis' in window) window.speechSynthesis.cancel(); };
  }, [currentQuestion, isTtsEnabled, stage]);

  // ── Speech Recognition ─────────────────────────────────────────────────────
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const rec = new SpeechRecognition();
    rec.continuous = true; rec.interimResults = true; rec.lang = 'en-US';

    rec.onresult = (event: any) => {
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) final += event.results[i][0].transcript;
      }
      if (final) setAnswerText(prev => prev + (prev ? ' ' : '') + final);
    };
    rec.onerror = (err: any) => {
      console.warn('Speech recognition error:', err.error);
      if (err.error === 'no-speech') {
        // Show a brief tip instead of breaking the record flow
        showToast("I'm listening! Speak when you're ready, or type your answer.", 'info');
      }
      if (isRecordingRef.current && ['no-speech', 'aborted', 'network'].includes(err.error)) {
        try {
          rec.stop();
          setTimeout(() => { if (isRecordingRef.current) rec.start(); }, 400);
        } catch {}
      }
    };
    rec.onend = () => {
      if (isRecordingRef.current) {
        try { rec.start(); } catch {}
      }
    };
    recognitionRef.current = rec;
  }, [showToast]);

  useEffect(() => () => { if (audioUrl) URL.revokeObjectURL(audioUrl); }, [audioUrl]);

  // ── Timer ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isTimerRunning || activeSession?.status !== 'IN_PROGRESS' || answerSubmitted || stage < 1 || stage > 3) return;
    const interval = setInterval(() => setResponseTime(p => p + 1), 1000);
    return () => clearInterval(interval);
  }, [isTimerRunning, activeSession, answerSubmitted, stage]);

  // Route guard
  useEffect(() => {
    if (!isLoading && !activeSession) {
      showToast('No active interview session found.', 'error');
      navigate('/dashboard');
    }
  }, [activeSession, isLoading, navigate, showToast]);

  // ── Recording helpers ──────────────────────────────────────────────────────
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      let mr: MediaRecorder;
      try { mr = new MediaRecorder(stream, { mimeType: 'audio/webm' }); }
      catch { mr = new MediaRecorder(stream); }
      mr.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(t => t.stop());
      };
      mediaRecorderRef.current = mr;
      mr.start();
      setIsRecording(true);
      isRecordingRef.current = true;
      setAnswerMode('VOICE');
      try { recognitionRef.current?.start(); } catch {}
      showToast('Recording started — speak clearly...', 'success');
    } catch {
      showToast('Microphone permission denied.', 'error');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      isRecordingRef.current = false;
      try { recognitionRef.current?.stop(); } catch {}
      showToast('Recording stopped.', 'success');
    }
  };

  const handleReRecord = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null); setAudioBlob(null);
    startRecording();
  };

  // ── Session controls ───────────────────────────────────────────────────────
  const handlePause = async () => {
    if (!activeSession) return;
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    try {
      await pauseSession(activeSession.id);
      setIsTimerRunning(false);
      if (isRecording) stopRecording();
      showToast('Session paused.', 'success');
    } catch (e: any) { showToast(e.message || 'Failed to pause', 'error'); }
  };

  const handleResume = async () => {
    if (!activeSession) return;
    try {
      await resumeSession(activeSession.id);
      setIsTimerRunning(true);
      showToast('Session resumed.', 'success');
      if (isTtsEnabled && currentQuestion) speakQuestion(currentQuestion.questionText);
    } catch (e: any) { showToast(e.message || 'Failed to resume', 'error'); }
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSession) return;
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    if (answerMode === 'VOICE' && !audioBlob) {
      showToast('Record your answer before submitting.', 'error'); return;
    }
    if (!answerText.trim()) {
      showToast('Answer cannot be empty.', 'error'); return;
    }

    setIsSubmitting(true);
    if (isRecording) stopRecording();

    try {
      let audioPath = '';
      if (answerMode === 'VOICE' && audioBlob) audioPath = await uploadAudio(audioBlob);
      const fb = await submitAnswer(activeSession.id, answerText, answerMode, responseTime, audioPath);
      setEvaluationFeedback(fb);
      setAnswerSubmitted(true);
      setEvalTab('scores');
      // Scroll eval panel into view
      setTimeout(() => evalPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
      showToast('Answer submitted and AI-scored!', 'success');
    } catch (e: any) {
      showToast(e.message || 'Failed to submit', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Next question ──────────────────────────────────────────────────────────
  const handleNext = async () => {
    if (!activeSession || !currentQuestion) return;
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    if (currentQuestion.isLastQuestion) {
      setStage(4);
    } else {
      try {
        setAnswerText(''); setResponseTime(0);
        setAnswerSubmitted(false); setEvaluationFeedback(null);
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        setAudioUrl(null); setAudioBlob(null);
        await fetchNextQuestion(activeSession.id);
      } catch (e: any) { showToast(e.message || 'Failed to fetch next question', 'error'); }
    }
  };

  const handleCancel = async () => {
    if (!activeSession) return;
    if (!window.confirm('Cancel the interview? Your progress will be lost.')) return;
    try {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      await cancelSession(activeSession.id);
      localStorage.removeItem('active_interview_session_id');
      localStorage.removeItem('active_interview_stage');
      clearActiveSession();
      showToast('Session cancelled.', 'info');
      navigate('/dashboard');
    } catch (e: any) { showToast(e.message || 'Failed to cancel', 'error'); }
  };


  if (!activeSession) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-dark-bg text-white' : 'bg-light-bg text-slate-900'}`}>
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-brand-purple" />
          <p className="text-sm text-slate-400">Loading interview session...</p>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  //  EVALUATION PANEL — shown immediately after answer submission
  // ════════════════════════════════════════════════════════════════════════════
  const EvaluationPanel = () => {
    if (!evaluationFeedback) return null;
    const ef = evaluationFeedback;

    const scoreColor = (v: number) =>
      v >= 8 ? '#10B981' : v >= 6 ? '#F59E0B' : '#EF4444';

    const tabs = [
      { key: 'scores',      icon: Star,           label: '7 Scores'   },
      { key: 'strengths',   icon: ThumbsUp,        label: 'Strengths'  },
      { key: 'suggestions', icon: Lightbulb,       label: 'Improve'    },
      { key: 'sample',      icon: MessageSquare,   label: 'Sample'     },
    ] as const;

    return (
      <motion.div
        ref={evalPanelRef}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={`mt-6 rounded-3xl border shadow-2xl overflow-hidden
          ${darkMode ? 'bg-dark-card border-white/10' : 'bg-light-card border-slate-200/60'}`}
      >
        {/* Header with overall score */}
        <div className="px-6 pt-6 pb-4 border-b border-white/5 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-purple/15 flex items-center justify-center">
              <Award className="w-5 h-5 text-brand-purple" />
            </div>
            <div>
              <h3 className="font-display font-extrabold text-base">AI Evaluation Result</h3>
              <p className="text-[10px] text-slate-400 font-semibold">Instant scoring across 7 HR criteria</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="px-4 py-2 rounded-2xl font-black text-2xl"
              style={{ color: scoreColor(ef.overallScore ?? 0) }}
            >
              {ef.overallScore ?? '—'}<span className="text-xs text-slate-400 font-bold">/10</span>
            </div>
            <div className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider
              ${(ef.overallScore ?? 0) >= 8 ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
              : (ef.overallScore ?? 0) >= 6 ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
              : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'}`}
            >
              {(ef.overallScore ?? 0) >= 8 ? 'Excellent' : (ef.overallScore ?? 0) >= 6 ? 'Good' : 'Needs Work'}
            </div>
          </div>
        </div>

        {/* Overall feedback text */}
        {ef.feedbackText && (
          <div className="px-6 py-4 border-b border-white/5">
            <p className={`text-xs font-semibold leading-relaxed italic ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              "{ef.feedbackText}"
            </p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-4 overflow-x-auto">
          {tabs.map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => setEvalTab(key as any)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[10px] font-extrabold uppercase tracking-wide whitespace-nowrap transition-all cursor-pointer border
                ${evalTab === key
                  ? 'bg-brand-purple text-white border-brand-purple shadow-lg shadow-brand-purple/20'
                  : 'text-slate-400 border-transparent hover:bg-white/5'}`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="px-6 pb-6 pt-4">
          <AnimatePresence mode="wait">
            {/* ── 7 Scores ── */}
            {evalTab === 'scores' && (
              <motion.div key="scores" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {EVAL_METRICS.map(({ key, label, color, description }) => {
                    const val = ef[key] ?? 0;
                    return (
                      <motion.div
                        key={key}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: EVAL_METRICS.findIndex(m => m.key === key) * 0.06 }}
                        className={`flex flex-col items-center gap-2 p-4 rounded-2xl border text-center
                          ${darkMode ? 'bg-white/3 border-white/6' : 'bg-slate-50 border-slate-200/50'}`}
                      >
                        <div className="relative w-14 h-14 flex items-center justify-center">
                          <ScoreRing value={val} color={color} size={56} />
                          <span className="absolute text-sm font-black" style={{ color }}>{val}</span>
                        </div>
                        <div>
                          <p className="text-[10px] font-extrabold text-slate-700 dark:text-slate-200">{label}</p>
                          <p className="text-[9px] text-slate-400 font-semibold">{description}</p>
                        </div>
                        {/* Mini bar */}
                        <div className="w-full h-1 rounded-full bg-white/10 overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${val * 10}%`, backgroundColor: color }} />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* ── Strengths & Weaknesses ── */}
            {evalTab === 'strengths' && (
              <motion.div key="strengths" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-emerald-500/5 border-emerald-500/15' : 'bg-emerald-50 border-emerald-200/60'}`}>
                  <div className="flex items-center gap-2 text-emerald-500 font-extrabold text-xs mb-2.5">
                    <ThumbsUp className="w-4 h-4" /> Key Strengths
                  </div>
                  <p className={`text-xs leading-relaxed font-semibold whitespace-pre-line ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                    {ef.strengths || 'Answer was generally acceptable.'}
                  </p>
                </div>
                <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-rose-500/5 border-rose-500/15' : 'bg-rose-50 border-rose-200/60'}`}>
                  <div className="flex items-center gap-2 text-rose-500 font-extrabold text-xs mb-2.5">
                    <ThumbsDown className="w-4 h-4" /> Areas to Improve
                  </div>
                  <p className={`text-xs leading-relaxed font-semibold whitespace-pre-line ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                    {ef.weaknesses || 'Focus on adding more specific details.'}
                  </p>
                </div>
              </motion.div>
            )}

            {/* ── AI Suggestions ── */}
            {evalTab === 'suggestions' && (
              <motion.div key="suggestions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-blue-500/5 border-blue-500/15' : 'bg-blue-50 border-blue-200/60'}`}>
                  <div className="flex items-center gap-2 text-blue-400 font-extrabold text-xs mb-3">
                    <Lightbulb className="w-4 h-4" /> AI Improvement Suggestions
                  </div>
                  <p className={`text-xs leading-relaxed font-semibold whitespace-pre-line ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                    {ef.suggestions || 'Structure your answer with context, action, and result.'}
                  </p>
                </div>
              </motion.div>
            )}

            {/* ── Sample Answer ── */}
            {evalTab === 'sample' && (
              <motion.div key="sample" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-brand-purple/5 border-brand-purple/15' : 'bg-violet-50 border-violet-200/60'}`}>
                  <div className="flex items-center gap-2 text-brand-purple font-extrabold text-xs mb-3">
                    <MessageSquare className="w-4 h-4" /> Model Sample Answer
                  </div>
                  <p className={`text-sm leading-relaxed font-semibold italic ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                    "{ef.sampleAnswer || 'A strong answer would clearly demonstrate your experience with specific examples, concrete outcomes, and professional vocabulary.'}"
                  </p>
                  <p className="mt-3 text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                    Use this as a reference — not a script
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Next button */}
        <div className="px-6 pb-6 flex justify-end border-t border-white/5 pt-4">
          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-brand-purple to-brand-indigo hover:brightness-110 shadow-lg shadow-brand-purple/25 transition-all cursor-pointer focus-ring"
          >
            <span>{currentQuestion?.isLastQuestion ? 'Finish Interview' : 'Next Question'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    );
  };

  // ════════════════════════════════════════════════════════════════════════════
  //  RENDER
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div className={`min-h-screen p-6 md:p-12 transition-colors duration-300
      ${darkMode ? 'bg-dark-bg bg-gradient-mesh text-slate-100' : 'bg-light-bg bg-gradient-mesh-light text-slate-900'}`}
    >
      <div className="max-w-4xl mx-auto text-left">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <span className="text-xs font-extrabold uppercase px-3 py-1.5 rounded-xl bg-brand-purple/10 border border-brand-purple/20 text-brand-purple">
              Session #{activeSession.id}
            </span>
            <span className={`text-xs font-extrabold uppercase px-3 py-1.5 rounded-xl border
              ${activeSession.status === 'IN_PROGRESS'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                : 'bg-amber-500/10 border-amber-500/20 text-amber-500'}`}
            >
              {activeSession.status}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {stage < 4 && (
              <button
                onClick={handleCancel}
                className="text-xs font-extrabold text-rose-500 bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/20 px-3.5 py-2 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
            )}
          </div>
        </header>

        {/* Progress Stepper */}
        <div className={`w-full flex flex-wrap items-center gap-3 p-5 rounded-3xl border mb-8
          ${darkMode ? 'bg-white/1 border-white/5' : 'bg-slate-50/50 border-slate-200/40'}`}
        >
          {STAGES.map((s, idx) => {
            const done = stage > s.index;
            const active = stage === s.index;
            return (
              <React.Fragment key={s.index}>
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black transition-all
                    ${done ? 'bg-emerald-500 text-white' : active ? 'bg-brand-purple text-white ring-4 ring-brand-purple/20' : 'bg-slate-200 dark:bg-white/10 text-slate-400'}`}
                  >
                    {done ? <Check className="w-3 h-3" /> : s.index + 1}
                  </div>
                  <span className={`text-[10px] font-bold tracking-wide uppercase hidden sm:inline
                    ${active ? 'text-brand-purple font-black' : done ? 'text-emerald-500' : 'text-slate-400'}`}
                  >
                    {s.label}
                  </span>
                </div>
                {idx < STAGES.length - 1 && (
                  <div className={`hidden md:block flex-1 h-0.5 min-w-[12px] ${done ? 'bg-emerald-500/50' : 'bg-slate-200 dark:bg-white/5'}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Paused banner */}
        {activeSession.status === 'PAUSED' && stage < 4 && (
          <div className="p-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 flex items-center justify-between gap-4 mb-8">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
              <div>
                <h4 className="font-bold text-xs">Interview Paused</h4>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Click Resume to continue answering.</p>
              </div>
            </div>
            <button onClick={handleResume} className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-500 hover:brightness-110 cursor-pointer">Resume</button>
          </div>
        )}

        {/* ── Stage Content ── */}
        <AnimatePresence mode="wait">
          {/* STAGE 0 — Resume Verification */}
          {stage === 0 && (
            <motion.div key="s0" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }}
              className={`p-8 rounded-3xl border shadow-xl backdrop-blur-2xl space-y-6
                ${darkMode ? 'bg-dark-card border-white/8 glass-panel' : 'bg-light-card border-slate-200/50'}`}
            >
              <div className="flex items-center gap-3 pb-4 border-b border-slate-200/40 dark:border-white/5">
                <div className="w-12 h-12 rounded-2xl bg-brand-purple/10 text-brand-purple flex items-center justify-center">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-display font-extrabold text-xl">Resume Verification</h3>
                  <p className="text-xs text-slate-400 font-semibold">Confirm your details before starting the interview rounds.</p>
                </div>
              </div>
              {profile ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="block text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mb-1">Name</span>
                      <span className="font-bold">{profile.firstName ? `${profile.firstName} ${profile.lastName}` : 'Candidate'}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mb-1">Email</span>
                      <span className="font-bold">{profile.email}</span>
                    </div>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mb-1">Bio / Skills</span>
                    <p className="p-4 rounded-xl border border-slate-200/50 dark:border-white/5 bg-slate-50/50 dark:bg-white/2 text-xs font-semibold text-slate-600 dark:text-slate-355 leading-relaxed">
                      {profile.bio || 'No bio entered. Questions will be based on your resume.'}
                    </p>
                  </div>
                  {profile.resumeUrl
                    ? <div className="flex items-center gap-2 p-3 rounded-xl border border-green-500/10 bg-green-500/5 text-green-500 text-xs font-bold"><CheckCircle className="w-4 h-4" /><span>Resume uploaded — AI questions will be resume-aware.</span></div>
                    : <div className="flex items-center gap-2 p-3 rounded-xl border border-amber-500/15 bg-amber-500/5 text-amber-500 text-xs font-bold"><AlertCircle className="w-4 h-4" /><span>No resume found. Questions will use your profile bio.</span></div>
                  }
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-6 gap-2">
                  <Loader2 className="w-8 h-8 animate-spin text-brand-purple" />
                  <p className="text-xs text-slate-400">Loading profile...</p>
                </div>
              )}
              <div className="pt-4 border-t border-slate-200/40 dark:border-white/5 flex justify-end">
                <button
                  onClick={async () => {
                    setIsStarting(true);
                    try {
                      if (activeSession.status === 'NOT_STARTED') await startSession(activeSession.id);
                      setStage(1);
                    } catch (e: any) { showToast(e.message || 'Failed to start.', 'error'); }
                    finally { setIsStarting(false); }
                  }}
                  disabled={isStarting}
                  className="flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-brand-purple to-brand-indigo hover:brightness-110 shadow-lg shadow-brand-purple/20 cursor-pointer disabled:opacity-60"
                >
                  {isStarting ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Starting...</span></>
                              : <><span>Start HR Round</span><ArrowRight className="w-4 h-4" /></>}
                </button>
              </div>
            </motion.div>
          )}

          {/* STAGE 3 — Coding Round (full-width Monaco panel) */}
          {stage === 3 && activeSession && (
            <motion.div key="s3-coding" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }}>
              <CodingRoundPanel
                sessionId={activeSession.id}
                difficulty={activeSession.difficulty ?? 'MEDIUM'}
                onComplete={() => {
                  // After coding round is recorded, advance to Final Evaluation
                  setStage(4);
                }}
              />
            </motion.div>
          )}

          {/* STAGE 1–2 — HR & Technical Question rounds */}
          {stage >= 1 && stage <= 2 && (
            <motion.div key={`s${stage}`} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }}
              className="grid grid-cols-1 md:grid-cols-4 gap-8"
            >
              {/* Main panel */}
              <div className="md:col-span-3 space-y-0">
                {currentQuestion ? (
                  <>
                    {/* Question card */}
                    <div className={`p-8 rounded-3xl border shadow-xl backdrop-blur-2xl
                      ${darkMode ? 'bg-dark-card border-white/8 glass-panel' : 'bg-light-card border-slate-200/50'}`}
                    >
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => {
                              if (isTtsEnabled) { setIsTtsEnabled(false); }
                              else { setIsTtsEnabled(true); speakQuestion(currentQuestion.questionText); }
                            }}
                            className={`p-1.5 rounded-lg border transition-all cursor-pointer
                              ${isTtsEnabled ? 'border-brand-purple/20 bg-brand-purple/5 text-brand-purple' : 'border-slate-200/40 dark:border-white/5 text-slate-400'}`}
                            title={isTtsEnabled ? 'Mute read-aloud' : 'Enable read-aloud'}
                          >
                            {isTtsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                          </button>
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            Q{currentQuestion.questionSequence} of 5
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-400 font-bold text-xs">
                          <Clock className="w-4 h-4 text-brand-purple" />
                          <span>{Math.floor(responseTime / 60)}:{(responseTime % 60).toString().padStart(2, '0')}</span>
                        </div>
                      </div>

                      <h2 className="font-display font-extrabold text-xl leading-relaxed mb-6">
                        {currentQuestion.questionText}
                      </h2>

                      {/* Answer input (only shown when not yet submitted) */}
                      {!answerSubmitted && (
                        <form onSubmit={handleSubmit} className="space-y-4">
                          {/* Voice controls */}
                          {answerMode === 'VOICE' && (
                            <div className={`p-4 rounded-xl border space-y-3
                              ${darkMode ? 'bg-white/5 border-white/8' : 'bg-slate-50 border-slate-200/50'}`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-400 font-bold uppercase">Voice Controls</span>
                                {isRecording && (
                                  <span className="flex items-center gap-1.5 text-xs text-rose-500 font-extrabold animate-pulse">
                                    <span className="w-2 h-2 rounded-full bg-rose-500" /> Recording...
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-wrap gap-3">
                                {!audioUrl && !isRecording && (
                                  <button type="button" onClick={startRecording}
                                    disabled={activeSession.status !== 'IN_PROGRESS' || isSubmitting}
                                    className="px-4 py-2 rounded-xl text-xs font-bold bg-brand-purple text-white hover:brightness-110 cursor-pointer"
                                  >Start Recording</button>
                                )}
                                {isRecording && (
                                  <button type="button" onClick={stopRecording}
                                    className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-500 text-white hover:brightness-110 cursor-pointer"
                                  >Stop Recording</button>
                                )}
                                {audioUrl && (
                                  <div className="flex items-center gap-3">
                                    <audio src={audioUrl} controls className="h-9" />
                                    <button type="button" onClick={handleReRecord}
                                      className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-200 dark:bg-white/10 hover:brightness-110 cursor-pointer"
                                    ><RefreshCw className="w-3.5 h-3.5 inline mr-1" />Re-record</button>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          <textarea
                            value={answerText}
                            onChange={e => setAnswerText(e.target.value)}
                            disabled={activeSession.status !== 'IN_PROGRESS' || isSubmitting}
                            rows={4}
                            placeholder={answerMode === 'VOICE' ? 'Spoken transcript appears here. You can also type...' : 'Type your detailed answer here...'}
                            className={`w-full px-5 py-4 rounded-2xl border font-semibold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-brand-purple/35 resize-none
                              ${darkMode ? 'bg-white/5 border-white/8 text-white' : 'bg-slate-50 border-slate-200/50 text-slate-800'}`}
                          />

                          <div className="flex justify-between items-center">
                            <div className="flex gap-2">
                              <button type="button"
                                onClick={() => { setAnswerMode('VOICE'); if (!audioBlob && !isRecording) startRecording(); }}
                                disabled={activeSession.status !== 'IN_PROGRESS' || isSubmitting}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs cursor-pointer border transition-all
                                  ${answerMode === 'VOICE' ? 'bg-brand-purple border-brand-purple text-white' : 'border-slate-200/50 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300'}`}
                              ><Mic className="w-4 h-4" />Voice</button>
                              <button type="button"
                                onClick={() => { if (isRecording) stopRecording(); setAnswerMode('TEXT'); }}
                                disabled={activeSession.status !== 'IN_PROGRESS' || isSubmitting}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs cursor-pointer border transition-all
                                  ${answerMode === 'TEXT' ? 'bg-brand-purple border-brand-purple text-white' : 'border-slate-200/50 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300'}`}
                              ><Keyboard className="w-4 h-4" />Text</button>
                            </div>
                            <button type="submit"
                              disabled={!answerText.trim() || activeSession.status !== 'IN_PROGRESS' || isSubmitting}
                              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-brand-purple to-brand-indigo hover:brightness-110 shadow-lg shadow-brand-purple/20 transition-all cursor-pointer disabled:opacity-50"
                            >
                              {isSubmitting
                                ? <><Loader2 className="w-4 h-4 animate-spin" />AI Scoring...</>
                                : <><Send className="w-4 h-4" />Submit</>}
                            </button>
                          </div>
                        </form>
                      )}
                    </div>

                    {/* Rich evaluation panel */}
                    {answerSubmitted && <EvaluationPanel />}
                  </>
                ) : (
                  <div className={`p-12 rounded-3xl border shadow-xl flex flex-col items-center justify-center text-center min-h-[35vh]
                    ${darkMode ? 'bg-dark-card border-white/8 glass-panel' : 'bg-light-card border-slate-200/50'}`}
                  >
                    <Loader2 className="w-10 h-10 animate-spin text-brand-purple mb-4" />
                    <p className="text-sm font-bold text-slate-400">Loading question...</p>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-5">
                <div className={`p-5 rounded-3xl border shadow-lg backdrop-blur-2xl
                  ${darkMode ? 'bg-dark-card border-white/8 glass-panel' : 'bg-light-card border-slate-200/50'}`}
                >
                  <h3 className="font-display font-extrabold text-sm mb-4 text-slate-400 uppercase tracking-wide">Controls</h3>
                  {activeSession.status === 'IN_PROGRESS' ? (
                    <button onClick={handlePause}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs border border-amber-500/20 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 cursor-pointer"
                    ><Pause className="w-4 h-4" />Pause Session</button>
                  ) : (
                    <button onClick={handleResume}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs border border-emerald-500/20 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 cursor-pointer animate-pulse"
                    ><Play className="w-4 h-4" />Resume</button>
                  )}
                </div>
                <div className={`p-5 rounded-3xl border shadow-lg backdrop-blur-2xl
                  ${darkMode ? 'bg-dark-card border-white/8 glass-panel' : 'bg-light-card border-slate-200/50'}`}
                >
                  <h3 className="font-display font-extrabold text-sm mb-3 text-slate-400 uppercase tracking-wide">Tips</h3>
                  <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
                    • AI reads questions aloud via TTS<br />
                    • Toggle 🔊 to mute/replay<br />
                    • Voice recording auto-restarts on silence<br />
                    • 7 HR metrics scored after each answer
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* STAGE 4 — Compiling evaluation */}
          {stage === 4 && (
            <motion.div key="s4" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }}
              className={`p-12 rounded-3xl border shadow-xl flex flex-col items-center justify-center text-center min-h-[40vh]
                ${darkMode ? 'bg-dark-card border-white/8 glass-panel' : 'bg-light-card border-slate-200/50'}`}
            >
              <div className="relative w-20 h-20 mb-8 flex items-center justify-center">
                <Loader2 className="absolute w-16 h-16 animate-spin text-brand-purple" />
                <Award className="w-8 h-8 animate-pulse text-brand-purple" />
              </div>
              <h3 className="font-display font-extrabold text-xl mb-2">Compiling Final Report</h3>
              <p className="text-sm text-brand-purple font-bold animate-pulse">Consolidating all round scores...</p>
            </motion.div>
          )}

          {/* STAGE 5 — Consolidated Report */}
          {stage === 5 && activeSession && (
            <motion.div key="s5" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
              <InterviewReportPage
                sessionId={activeSession.id}
                onDone={() => {
                  clearActiveSession();
                  localStorage.removeItem('active_interview_session_id');
                  localStorage.removeItem('active_interview_stage');
                  navigate('/dashboard');
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
