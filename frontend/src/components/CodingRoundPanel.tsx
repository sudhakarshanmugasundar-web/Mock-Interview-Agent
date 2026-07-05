import React, { useEffect, useState, useRef } from 'react';
import Editor from '@monaco-editor/react';
import {
  Play,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  ChevronDown,
  ChevronRight,
  EyeOff,
  Terminal,
  Code2,
  Zap,
  BarChart3,
  Star,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Cpu
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../components/Toast';
import { useInterviewStore } from '../store/interviewStore';
import ReactMarkdown from 'react-markdown';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface TestCaseResult {
  name: string;
  input: string;
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
  executionTimeMs: number;
  hidden: boolean;
}

interface CodeEvaluationResponse {
  testCaseResults: TestCaseResult[];
  testsPassed: number;
  testsTotal: number;
  compilationSuccess: boolean;
  compilationError: string;
  codeQualityScore: number;
  namingConventionScore: number;
  optimizationScore: number;
  correctnessScore: number;
  overallScore: number;
  timeComplexity: string;
  spaceComplexity: string;
  aiFeedback: string;
  strengths: string;
  improvements: string;
  optimizedApproach: string;
}

interface CodingProblemResponse {
  title: string;
  description: string;
  difficulty: string;
  starterCode: string;
  totalTestCases: number;
  visibleTestCases: number;
}

interface CodingRoundPanelProps {
  sessionId: number;
  difficulty: string;
  onComplete: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Score bar component
// ─────────────────────────────────────────────────────────────────────────────

const ScoreBar: React.FC<{ label: string; value: number; color: string; max?: number }> = ({
  label, value, color, max = 10
}) => {
  const pct = Math.min((value / max) * 100, 100);
  const textColor = value >= 8 ? '#10B981' : value >= 6 ? '#F59E0B' : '#EF4444';
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
        <span className="text-sm font-black" style={{ color: textColor }}>{value}/{max}</span>
      </div>
      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
          className="h-full rounded-full"
          style={{ background: color }}
        />
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export const CodingRoundPanel: React.FC<CodingRoundPanelProps> = ({
  sessionId, difficulty, onComplete
}) => {
  const { darkMode } = useTheme();
  const { showToast } = useToast();
  const { submitAnswer } = useInterviewStore();

  // ── Problem loading ──────────────────────────────────────────────────────
  const [problem, setProblem] = useState<CodingProblemResponse | null>(null);
  const [problemLoading, setProblemLoading] = useState(true);

  // ── Editor ───────────────────────────────────────────────────────────────
  const [code, setCode] = useState('');

  // ── Run output ───────────────────────────────────────────────────────────
  const [runOutput, setRunOutput] = useState('');
  const [runError, setRunError] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [runTime, setRunTime] = useState<number | null>(null);

  // ── Evaluation ───────────────────────────────────────────────────────────
  const [evaluation, setEvaluation] = useState<CodeEvaluationResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evalTab, setEvalTab] = useState<'scores' | 'feedback' | 'approach'>('scores');
  const [showAllTests, setShowAllTests] = useState(false);

  // ── Complete round ────────────────────────────────────────────────────────
  const [isCompleting, setIsCompleting] = useState(false);

  const evalRef = useRef<HTMLDivElement>(null);

  // ── Fetch problem from backend ────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    setProblemLoading(true);
    fetch(`/api/coding/problem?difficulty=${difficulty}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then((p: CodingProblemResponse) => {
        setProblem(p);
        setCode(p.starterCode || '');
      })
      .catch(() => showToast('Failed to load coding problem.', 'error'))
      .finally(() => setProblemLoading(false));
  }, [difficulty, showToast]);

  // ── Run code (free-form) ──────────────────────────────────────────────────
  const handleRun = async () => {
    if (!code.trim()) { showToast('Editor is empty.', 'error'); return; }
    setIsRunning(true);
    setRunOutput('');
    setRunError('');
    setRunTime(null);
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch('/api/coding/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ code })
      });
      const data = await res.json();
      setRunOutput(data.output || '');
      setRunError(data.error || '');
      setRunTime(data.executionTimeMs);
      if (data.compilationError) showToast('Compilation failed — check the Output panel.', 'error');
      else if (data.error) showToast('Runtime error occurred.', 'info');
      else showToast('Code ran successfully!', 'success');
    } catch {
      showToast('Failed to connect to execution service.', 'error');
    } finally {
      setIsRunning(false);
    }
  };

  // ── Submit code (test cases + AI evaluation) ──────────────────────────────
  const handleSubmit = async () => {
    if (!code.trim()) { showToast('Editor is empty.', 'error'); return; }
    setIsSubmitting(true);
    setEvaluation(null);
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch('/api/coding/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          sessionId,
          questionText: problem?.title || 'Coding Problem',
          code,
          difficulty
        })
      });
      const data: CodeEvaluationResponse = await res.json();
      setEvaluation(data);
      setEvalTab('scores');
      setTimeout(() => evalRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
      if (!data.compilationSuccess) {
        showToast('Compilation failed — fix errors and resubmit.', 'error');
      } else {
        showToast(
          `${data.testsPassed}/${data.testsTotal} tests passed! AI evaluation ready.`,
          data.testsPassed === data.testsTotal ? 'success' : 'info'
        );
      }
    } catch {
      showToast('Submission failed. Please retry.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Complete round → records answer in session ────────────────────────────
  const handleCompleteRound = async () => {
    if (!evaluation) return;
    setIsCompleting(true);
    try {
      const summary = `JAVA SOLUTION SUBMITTED\n\nTest Results: ${evaluation.testsPassed}/${evaluation.testsTotal} passed\nOverall Score: ${evaluation.overallScore}/10\nTime Complexity: ${evaluation.timeComplexity}\nSpace Complexity: ${evaluation.spaceComplexity}\n\nCode:\n${code}`;
      await submitAnswer(sessionId, summary, 'TEXT', 0, '');
      showToast('Coding round complete!', 'success');
      onComplete();
    } catch (e: any) {
      showToast(e.message || 'Failed to record submission.', 'error');
    } finally {
      setIsCompleting(false);
    }
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const difficultyColor = {
    EASY: '#10B981', MEDIUM: '#F59E0B', HARD: '#EF4444'
  }[difficulty?.toUpperCase()] ?? '#8B5CF6';

  const passRate = evaluation
    ? Math.round((evaluation.testsPassed / evaluation.testsTotal) * 100)
    : 0;

  // ─────────────────────────────────────────────────────────────────────────
  // Loading
  // ─────────────────────────────────────────────────────────────────────────
  if (problemLoading) {
    return (
      <div className={`flex items-center justify-center p-20 rounded-3xl border
        ${darkMode ? 'bg-dark-card border-white/8' : 'bg-light-card border-slate-200/50'}`}
      >
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-brand-purple" />
          <p className="text-sm text-slate-400 font-semibold">Loading coding problem...</p>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* ── Problem Description ───────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-3xl border shadow-xl backdrop-blur-2xl overflow-hidden
          ${darkMode ? 'bg-dark-card border-white/8 glass-panel' : 'bg-light-card border-slate-200/50'}`}
      >
        {/* Problem header */}
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: `${difficultyColor}18` }}>
              <Code2 className="w-5 h-5" style={{ color: difficultyColor }} />
            </div>
            <div>
              <h2 className="font-display font-extrabold text-base leading-tight">
                {problem?.title}
              </h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                Coding Round · Java Only
              </p>
            </div>
          </div>
          <span
            className="text-[10px] font-extrabold uppercase px-3 py-1.5 rounded-xl border"
            style={{
              color: difficultyColor,
              borderColor: `${difficultyColor}30`,
              background: `${difficultyColor}12`
            }}
          >
            {difficulty}
          </span>
        </div>

        {/* Problem markdown body */}
        <div className={`px-6 py-5 prose prose-sm max-w-none
          ${darkMode ? 'prose-invert text-slate-300' : 'text-slate-700'}`}
          style={{ fontSize: 13 }}
        >
          {problem?.description ? (
            <ReactMarkdown>{problem.description}</ReactMarkdown>
          ) : (
            <p className="text-slate-400">No description available.</p>
          )}
        </div>

        {/* Test case meta */}
        <div className={`px-6 py-3 border-t border-white/5 flex items-center gap-4
          ${darkMode ? 'bg-white/1' : 'bg-slate-50/50'}`}
        >
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
            Test Cases:
          </span>
          <span className="text-[10px] font-bold text-emerald-400">
            {problem?.visibleTestCases} visible
          </span>
          <span className="text-[10px] font-bold text-amber-400">
            +{(problem?.totalTestCases ?? 0) - (problem?.visibleTestCases ?? 0)} hidden
          </span>
        </div>
      </motion.div>

      {/* ── Monaco Editor + Controls ─────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`rounded-3xl border shadow-xl overflow-hidden
          ${darkMode ? 'bg-dark-card border-white/8 glass-panel' : 'bg-light-card border-slate-200/50'}`}
      >
        {/* Editor toolbar */}
        <div className={`px-5 py-3 border-b flex items-center justify-between
          ${darkMode ? 'border-white/8 bg-white/1' : 'border-slate-200/50 bg-slate-50/50'}`}
        >
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500/70" />
              <span className="w-3 h-3 rounded-full bg-amber-400/70" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/70" />
            </div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest ml-2">
              Solution.java
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* Run */}
            <button
              onClick={handleRun}
              disabled={isRunning || isSubmitting}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold
                bg-emerald-500/10 border border-emerald-500/20 text-emerald-400
                hover:bg-emerald-500/20 disabled:opacity-50 cursor-pointer transition-all"
            >
              {isRunning
                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /><span>Running...</span></>
                : <><Play className="w-3.5 h-3.5" /><span>Run Code</span></>
              }
            </button>
            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || isRunning}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold
                text-white bg-gradient-to-r from-brand-purple to-brand-indigo
                hover:brightness-110 disabled:opacity-50 cursor-pointer shadow-sm transition-all"
            >
              {isSubmitting
                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /><span>Evaluating...</span></>
                : <><Send className="w-3.5 h-3.5" /><span>Submit & Evaluate</span></>
              }
            </button>
          </div>
        </div>

        {/* Monaco Editor */}
        <div style={{ height: 420 }}>
          <Editor
            height="100%"
            language="java"
            theme={darkMode ? 'vs-dark' : 'light'}
            value={code}
            onChange={v => setCode(v ?? '')}
            options={{
              fontSize: 13,
              fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
              fontLigatures: true,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              lineNumbers: 'on',
              wordWrap: 'on',
              automaticLayout: true,
              tabSize: 4,
              renderLineHighlight: 'gutter',
              cursorBlinking: 'smooth',
              cursorSmoothCaretAnimation: 'on',
              smoothScrolling: true,
              padding: { top: 12, bottom: 12 },
            }}
          />
        </div>
      </motion.div>

      {/* ── Output / Test Case Panel ─────────────────────────────────────── */}
      <AnimatePresence>
        {(runOutput || runError || runTime !== null) && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={`rounded-3xl border overflow-hidden
              ${darkMode ? 'bg-dark-card border-white/8 glass-panel' : 'bg-light-card border-slate-200/50'}`}
          >
            <div className={`flex items-center gap-3 px-5 py-3 border-b
              ${darkMode ? 'border-white/8 bg-white/1' : 'border-slate-200/50 bg-slate-50/50'}`}
            >
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-extrabold text-slate-300 uppercase tracking-wider">Output</span>
              {runTime !== null && (
                <span className="ml-auto flex items-center gap-1 text-[10px] font-bold text-slate-400">
                  <Clock className="w-3 h-3" /> {runTime}ms
                </span>
              )}
            </div>
            <pre className={`px-5 py-4 text-xs font-mono whitespace-pre-wrap leading-relaxed
              ${runError ? 'text-rose-400' : 'text-emerald-300'}`}
            >
              {runError || runOutput || '(no output)'}
            </pre>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Evaluation Results ────────────────────────────────────────────── */}
      <AnimatePresence>
        {evaluation && (
          <motion.div
            ref={evalRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5"
          >
            {/* Compilation error */}
            {!evaluation.compilationSuccess && (
              <div className="p-5 rounded-2xl border border-rose-500/20 bg-rose-500/5">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 text-rose-500" />
                  <span className="text-xs font-extrabold text-rose-400 uppercase tracking-wide">
                    Compilation Error
                  </span>
                </div>
                <pre className="text-xs text-rose-300 font-mono whitespace-pre-wrap leading-relaxed">
                  {evaluation.compilationError}
                </pre>
              </div>
            )}

            {/* Test Cases */}
            {evaluation.compilationSuccess && (
              <div className={`rounded-3xl border overflow-hidden
                ${darkMode ? 'bg-dark-card border-white/8 glass-panel' : 'bg-light-card border-slate-200/50'}`}
              >
                {/* Header */}
                <div className={`px-5 py-4 border-b flex items-center justify-between
                  ${darkMode ? 'border-white/8 bg-white/1' : 'border-slate-200/50 bg-slate-50/50'}`}
                >
                  <div className="flex items-center gap-3">
                    <BarChart3 className="w-4 h-4 text-brand-purple" />
                    <span className="text-xs font-extrabold uppercase tracking-wider">
                      Test Results
                    </span>
                  </div>
                  {/* Pass rate ring */}
                  <div className="flex items-center gap-3">
                    <div className="relative w-12 h-12">
                      <svg className="-rotate-90 w-12 h-12" viewBox="0 0 48 48">
                        <circle cx="24" cy="24" r="18" fill="transparent"
                          stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
                        <motion.circle cx="24" cy="24" r="18" fill="transparent"
                          stroke={passRate === 100 ? '#10B981' : passRate >= 60 ? '#F59E0B' : '#EF4444'}
                          strokeWidth="5"
                          strokeDasharray={2 * Math.PI * 18}
                          initial={{ strokeDashoffset: 2 * Math.PI * 18 }}
                          animate={{ strokeDashoffset: 2 * Math.PI * 18 * (1 - passRate / 100) }}
                          transition={{ duration: 1, ease: 'easeOut' }}
                          strokeLinecap="round"
                        />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black">
                        {evaluation.testsPassed}/{evaluation.testsTotal}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs font-black"
                        style={{ color: passRate === 100 ? '#10B981' : passRate >= 60 ? '#F59E0B' : '#EF4444' }}
                      >
                        {passRate}% Pass Rate
                      </p>
                      <p className="text-[10px] text-slate-400 font-semibold">
                        {evaluation.testsPassed} of {evaluation.testsTotal} passed
                      </p>
                    </div>
                  </div>
                </div>

                {/* Test case list */}
                <div className="divide-y divide-white/5">
                  {(showAllTests
                    ? evaluation.testCaseResults
                    : evaluation.testCaseResults.slice(0, 5)
                  ).map((tc, i) => (
                    <div key={i} className={`px-5 py-3 flex items-start gap-3
                      ${tc.passed ? '' : 'bg-rose-500/3'}`}
                    >
                      {tc.passed
                        ? <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                        : <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                      }
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold">{tc.name}</span>
                          {tc.hidden && (
                            <span className="flex items-center gap-1 text-[9px] font-extrabold text-amber-400 uppercase">
                              <EyeOff className="w-2.5 h-2.5" /> Hidden
                            </span>
                          )}
                        </div>
                        {!tc.passed && !tc.hidden && (
                          <div className="mt-1.5 grid grid-cols-2 gap-3">
                            <div>
                              <p className="text-[9px] font-extrabold text-slate-400 uppercase mb-0.5">Expected</p>
                              <code className="text-[10px] text-emerald-300 font-mono">{tc.expectedOutput}</code>
                            </div>
                            <div>
                              <p className="text-[9px] font-extrabold text-slate-400 uppercase mb-0.5">Got</p>
                              <code className="text-[10px] text-rose-300 font-mono">{tc.actualOutput}</code>
                            </div>
                          </div>
                        )}
                      </div>
                      <span className="text-[9px] text-slate-500 font-mono flex-shrink-0">
                        {tc.executionTimeMs}ms
                      </span>
                    </div>
                  ))}
                </div>

                {evaluation.testCaseResults.length > 5 && (
                  <button
                    onClick={() => setShowAllTests(p => !p)}
                    className="w-full py-3 text-[10px] font-extrabold text-brand-purple hover:text-brand-indigo
                      uppercase tracking-wider flex items-center justify-center gap-1.5 border-t border-white/5
                      cursor-pointer transition-colors"
                  >
                    {showAllTests
                      ? <><ChevronDown className="w-3.5 h-3.5 rotate-180" /> Show Less</>
                      : <><ChevronRight className="w-3.5 h-3.5" /> Show All {evaluation.testCaseResults.length} Tests</>
                    }
                  </button>
                )}
              </div>
            )}

            {/* AI Evaluation card */}
            {evaluation.compilationSuccess && (
              <div className={`rounded-3xl border overflow-hidden
                ${darkMode ? 'bg-dark-card border-white/8 glass-panel' : 'bg-light-card border-slate-200/50'}`}
              >
                {/* Header with overall score */}
                <div className={`px-5 py-4 border-b flex items-center justify-between
                  ${darkMode ? 'border-white/8 bg-white/1' : 'border-slate-200/50 bg-slate-50/50'}`}
                >
                  <div className="flex items-center gap-3">
                    <Star className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-extrabold uppercase tracking-wider">
                      AI Code Evaluation
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Complexity badges */}
                    <div className="flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-[10px] font-bold text-slate-400">
                        Time: <span className="text-brand-purple">{evaluation.timeComplexity}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-[10px] font-bold text-slate-400">
                        Space: <span className="text-brand-purple">{evaluation.spaceComplexity}</span>
                      </span>
                    </div>
                    {/* Overall score */}
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-base"
                      style={{
                        background: evaluation.overallScore >= 8 ? '#10B98118' : evaluation.overallScore >= 6 ? '#F59E0B18' : '#EF444418',
                        color: evaluation.overallScore >= 8 ? '#10B981' : evaluation.overallScore >= 6 ? '#F59E0B' : '#EF4444',
                      }}
                    >
                      {evaluation.overallScore}
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                <div className={`flex gap-1 p-3 border-b
                  ${darkMode ? 'border-white/8 bg-white/1' : 'border-slate-200/50 bg-slate-50/50'}`}
                >
                  {([
                    { key: 'scores',   label: '4 Scores',  icon: BarChart3  },
                    { key: 'feedback', label: 'AI Feedback', icon: Lightbulb },
                    { key: 'approach', label: 'Best Approach', icon: TrendingUp },
                  ] as const).map(tab => (
                    <button key={tab.key}
                      onClick={() => setEvalTab(tab.key)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wide transition-all cursor-pointer
                        ${evalTab === tab.key
                          ? 'bg-brand-purple text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-300 hover:bg-white/5'
                        }`}
                    >
                      <tab.icon className="w-3 h-3" />
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Tab content */}
                <div className="p-5">
                  <AnimatePresence mode="wait">
                    {evalTab === 'scores' && (
                      <motion.div key="scores"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="space-y-4"
                      >
                        <ScoreBar label="Correctness"       value={evaluation.correctnessScore}      color="#10B981" />
                        <ScoreBar label="Code Quality"      value={evaluation.codeQualityScore}       color="#8B5CF6" />
                        <ScoreBar label="Optimization"      value={evaluation.optimizationScore}      color="#F59E0B" />
                        <ScoreBar label="Naming Convention" value={evaluation.namingConventionScore}   color="#0EA5E9" />
                      </motion.div>
                    )}

                    {evalTab === 'feedback' && (
                      <motion.div key="feedback"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="space-y-4"
                      >
                        <div className={`p-4 rounded-2xl border
                          ${darkMode ? 'bg-white/3 border-white/8' : 'bg-slate-50 border-slate-200/50'}`}
                        >
                          <p className="text-xs text-slate-300 leading-relaxed font-semibold">
                            {evaluation.aiFeedback}
                          </p>
                        </div>
                        {evaluation.strengths && (
                          <div>
                            <p className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider mb-2">
                              ✓ Strengths
                            </p>
                            <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed">
                              {evaluation.strengths}
                            </p>
                          </div>
                        )}
                        {evaluation.improvements && (
                          <div>
                            <p className="text-[10px] font-extrabold text-amber-400 uppercase tracking-wider mb-2">
                              ↑ Improvements
                            </p>
                            <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed">
                              {evaluation.improvements}
                            </p>
                          </div>
                        )}
                      </motion.div>
                    )}

                    {evalTab === 'approach' && (
                      <motion.div key="approach"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      >
                        <div className={`p-4 rounded-2xl border
                          ${darkMode ? 'bg-brand-purple/5 border-brand-purple/15' : 'bg-violet-50 border-violet-200/60'}`}
                        >
                          <div className="flex items-center gap-2 mb-3">
                            <TrendingUp className="w-4 h-4 text-brand-purple" />
                            <span className="text-[10px] font-extrabold text-brand-purple uppercase tracking-wider">
                              Optimal Approach
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed font-semibold italic">
                            {evaluation.optimizedApproach || 'Explore more efficient algorithms and data structures for this problem type.'}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Complete round button */}
                <div className="px-5 pb-5 flex justify-end border-t border-white/5 pt-4">
                  <button
                    onClick={handleCompleteRound}
                    disabled={isCompleting}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white
                      bg-gradient-to-r from-brand-purple to-brand-indigo hover:brightness-110
                      shadow-lg shadow-brand-purple/25 transition-all cursor-pointer
                      disabled:opacity-60 focus-ring"
                  >
                    {isCompleting
                      ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Finishing...</span></>
                      : <><CheckCircle className="w-4 h-4" /><span>Complete Coding Round</span></>
                    }
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
