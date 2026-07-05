import React, { useState, useEffect } from 'react';
import { 
  UploadCloud, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  RefreshCw, 
  Download,
  Award,
  BookOpen,
  HelpCircle,
  ShieldCheck,
  Cpu,
  ChevronDown,
  ChevronUp,
  Wand2,
  Check,
  ClipboardList,
  Eye,
  Columns
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { useTheme } from '../context/ThemeContext';
import { useToast } from '../components/Toast';
import { useResumeStore } from '../store/resumeStore';
import { axiosClient } from '../api/axiosClient';

const LOADING_STEPS = [
  "Extracting raw document text paragraphs...",
  "Formatting structure and cleaning metadata...",
  "Analyzing spelling, typos, and syntax errors...",
  "Scanning target keyword density against ATS indexes...",
  "Evaluating stylistic tone and action verb index...",
  "Compiling audit suggestions and scores..."
];

interface DiffWord {
  value: string;
  added?: boolean;
  removed?: boolean;
}

interface HighlightTextProps {
  text: string;
  replacements: Record<string, string>;
  mode: 'original' | 'improved';
}

const HighlightedResume: React.FC<HighlightTextProps> = ({ text, replacements, mode }) => {
  if (!text) return null;
  
  const originalTargets = Object.keys(replacements);
  const correctedTargets = Object.values(replacements);
  
  const targets = mode === 'original' ? originalTargets : correctedTargets;
  const validTargets = targets.filter(t => t && t.trim().length > 0);

  if (validTargets.length === 0) {
    return <div className="whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed">{text}</div>;
  }

  // Escape regex specials
  const escaped = validTargets.map(t => t.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));
  const pattern = new RegExp(`(${escaped.join('|')})`, 'g');
  const parts = text.split(pattern);

  // Word-level LCS Diff Algorithm
  const diffWords = (original: string, corrected: string): DiffWord[] => {
    if (!original) return [{ value: corrected, added: true }];
    if (!corrected) return [{ value: original, removed: true }];

    const origWords = original.split(/(\s+)/);
    const corrWords = corrected.split(/(\s+)/);

    const dp: number[][] = Array(origWords.length + 1)
      .fill(null)
      .map(() => Array(corrWords.length + 1).fill(0));

    for (let i = 1; i <= origWords.length; i++) {
      for (let j = 1; j <= corrWords.length; j++) {
        if (origWords[i - 1] === corrWords[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }

    const result: DiffWord[] = [];
    let i = origWords.length;
    let j = corrWords.length;

    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && origWords[i - 1] === corrWords[j - 1]) {
        result.unshift({ value: origWords[i - 1] });
        i--;
        j--;
      } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
        result.unshift({ value: corrWords[j - 1], added: true });
        j--;
      } else {
        result.unshift({ value: origWords[i - 1], removed: true });
        i--;
      }
    }
    return result;
  };

  return (
    <div className="whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed">
      {parts.map((part, index) => {
        const isMatched = validTargets.some(t => t === part);
        if (isMatched) {
          if (mode === 'original') {
            const correctedVal = replacements[part];
            if (!correctedVal) return <span key={index}>{part}</span>;
            return (
              <span key={index} className="bg-rose-500/5 dark:bg-rose-950/20 px-0.5 rounded border border-rose-500/10">
                {diffWords(part, correctedVal).map((word, wIdx) => {
                  if (word.removed) {
                    return (
                      <span key={wIdx} className="bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-350 line-through decoration-rose-500/40 px-0.5 rounded font-extrabold">
                        {word.value}
                      </span>
                    );
                  }
                  if (word.added) return null;
                  return <span key={wIdx}>{word.value}</span>;
                })}
              </span>
            );
          } else {
            const originalKey = Object.keys(replacements).find(key => replacements[key] === part);
            if (!originalKey) return <span key={index}>{part}</span>;
            return (
              <span key={index} className="bg-emerald-500/5 dark:bg-emerald-950/20 px-0.5 rounded border border-emerald-500/10">
                {diffWords(originalKey, part).map((word, wIdx) => {
                  if (word.added) {
                    return (
                      <span key={wIdx} className="bg-emerald-150 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-0.5 rounded font-extrabold">
                        {word.value}
                      </span>
                    );
                  }
                  if (word.removed) return null;
                  return <span key={wIdx}>{word.value}</span>;
                })}
              </span>
            );
          }
        }
        return <span key={index}>{part}</span>;
      })}
    </div>
  );
};

export const ResumeAnalyzerPage: React.FC = () => {
  const { darkMode } = useTheme();
  const { showToast } = useToast();
  const { analysis, isLoading, analyzeResume, generateNewResume } = useResumeStore();

  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);
  const [expandedIssueId, setExpandedIssueId] = useState<number | null>(null);
  
  // Staged corrections in memory: maps issue index -> corrected text
  const [appliedCorrections, setAppliedCorrections] = useState<Record<number, string>>({});

  // Generated document download URLs
  const [generatedUrls, setGeneratedUrls] = useState<{ pdfUrl: string; docxUrl: string } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Tab views state: 'audit' | 'preview'
  const [activeTab, setActiveTab] = useState<'audit' | 'preview'>('audit');
  // Preview modes state: 'original' | 'improved' | 'sidebyside'
  const [previewMode, setPreviewMode] = useState<'original' | 'improved' | 'sidebyside'>('improved');

  // Control result visibility
  const [showResults, setShowResults] = useState(false);

  // Loading steps animation loop
  useEffect(() => {
    let timer: any;
    if (isLoading) {
      timer = setInterval(() => {
        setLoadingStepIndex((prev) => (prev + 1) % LOADING_STEPS.length);
      }, 3000);
    } else {
      setLoadingStepIndex(0);
    }
    return () => clearInterval(timer);
  }, [isLoading]);

  const getFileNameFromUrl = (url: string) => {
    if (!url) return '';
    try {
      if (url.includes('filename=')) {
        const parts = url.split('filename=');
        return decodeURIComponent(parts[1]);
      }
      return 'uploaded_resume.pdf';
    } catch {
      return 'resume.pdf';
    }
  };

  const validateAndUploadFile = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      showToast('File size must be under 5MB.', 'error');
      setUploadError('File size exceeds the 5MB maximum limit.');
      return;
    }

    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (ext !== '.pdf' && ext !== '.docx') {
      showToast('Only PDF and DOCX files are allowed.', 'error');
      setUploadError('Unsupported format. Please upload a PDF or DOCX file.');
      return;
    }

    setUploadError(null);
    setAppliedCorrections({});
    setGeneratedUrls(null);
    setShowResults(false);

    try {
      await analyzeResume(file);
      showToast('Resume uploaded and audited successfully!', 'success');
      setShowResults(true);
    } catch (err: any) {
      const msg = 'Unable to upload resume. Please try again.';
      setUploadError(msg);
      showToast(msg, 'error');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      validateAndUploadFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndUploadFile(file);
    }
  };

  const toggleExpandIssue = (idx: number) => {
    setExpandedIssueId(expandedIssueId === idx ? null : idx);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500 stroke-emerald-500';
    if (score >= 60) return 'text-amber-500 stroke-amber-500';
    return 'text-rose-500 stroke-rose-500';
  };

  // Word-level LCS Diff Algorithm for Accordion Compare
  const diffWords = (original: string, corrected: string): DiffWord[] => {
    if (!original) return [{ value: corrected, added: true }];
    if (!corrected) return [{ value: original, removed: true }];

    const origWords = original.split(/(\s+)/);
    const corrWords = corrected.split(/(\s+)/);

    const dp: number[][] = Array(origWords.length + 1)
      .fill(null)
      .map(() => Array(corrWords.length + 1).fill(0));

    for (let i = 1; i <= origWords.length; i++) {
      for (let j = 1; j <= corrWords.length; j++) {
        if (origWords[i - 1] === corrWords[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }

    const result: DiffWord[] = [];
    let i = origWords.length;
    let j = corrWords.length;

    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && origWords[i - 1] === corrWords[j - 1]) {
        result.unshift({ value: origWords[i - 1] });
        i--;
        j--;
      } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
        result.unshift({ value: corrWords[j - 1], added: true });
        j--;
      } else {
        result.unshift({ value: origWords[i - 1], removed: true });
        i--;
      }
    }
    return result;
  };

  const handleApplyCorrection = (idx: number, correctedText: string) => {
    setAppliedCorrections(prev => ({
      ...prev,
      [idx]: correctedText
    }));
    showToast('Correction applied. Resume preview updated!', 'success');
  };

  const handleRemoveCorrection = (idx: number) => {
    setAppliedCorrections(prev => {
      const updated = { ...prev };
      delete updated[idx];
      return updated;
    });
    showToast('Correction unstaged. Resume preview updated.', 'info');
  };

  const handleGenerate = async () => {
    if (!analysis) return;
    setIsGenerating(true);
    try {
      const correctionsMap: Record<string, string> = {};
      Object.entries(appliedCorrections).forEach(([issueIdx, correctedText]) => {
        const issue = analysis.issues[Number(issueIdx)];
        if (issue && issue.originalText) {
          correctionsMap[issue.originalText] = correctedText;
        }
      });

      const response = await generateNewResume(correctionsMap);
      setGeneratedUrls(response);
      showToast('New resume generated successfully!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to generate new resume.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadBlob = async (relativeUrl: string, defaultFilename: string) => {
    try {
      showToast('Downloading file...', 'info');
      const cleanUrl = relativeUrl.startsWith('/api') 
        ? relativeUrl.substring(4) 
        : relativeUrl;

      const response = await axiosClient.get(cleanUrl, {
        responseType: 'blob'
      });
      const blob = new Blob([response.data]);
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', defaultFilename);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err: any) {
      if (err.response && err.response.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const parsed = JSON.parse(text);
          showToast(parsed.message || 'Failed to download file.', 'error');
        } catch {
          showToast('Failed to download file.', 'error');
        }
      } else {
        showToast(err.message || 'Failed to download file.', 'error');
      }
    }
  };

  const handleResetStaged = () => {
    setAppliedCorrections({});
    setGeneratedUrls(null);
  };

  // Compile corrections map where key is originalText and value is correctedText
  const getStagedCorrectionsMap = (): Record<string, string> => {
    if (!analysis) return {};
    const map: Record<string, string> = {};
    Object.entries(appliedCorrections).forEach(([idx, text]) => {
      const issue = analysis.issues[Number(idx)];
      if (issue && issue.originalText) {
        map[issue.originalText] = text;
      }
    });
    return map;
  };

  // Apply in-memory replacements to the rawText parameter
  const getImprovedText = (): string => {
    if (!analysis) return '';
    let text = analysis.rawText;
    Object.entries(appliedCorrections).forEach(([idx, textRepl]) => {
      const issue = analysis.issues[Number(idx)];
      if (issue && issue.originalText) {
        text = text.replace(issue.originalText, textRepl);
      }
    });
    return text;
  };

  const stagedCount = Object.keys(appliedCorrections).length;

  return (
    <div className="max-w-6xl mx-auto text-left space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="font-display font-extrabold text-3xl mb-1 bg-gradient-to-r from-brand-purple to-brand-indigo bg-clip-text text-transparent">
            AI Resume Scan & Audit
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-semibold text-xs md:text-sm">
            Scan your resume for ATS compliance, syntax rules, formatting structures, and action verbs.
          </p>
        </div>

        {analysis && showResults && (
          <button
            onClick={() => document.getElementById('new-scan-input')?.click()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs tracking-wide text-white bg-gradient-to-r from-brand-purple to-brand-indigo hover:brightness-110 shadow-lg shadow-brand-purple/20 transition-all cursor-pointer focus-ring"
          >
            <RefreshCw className="w-4.5 h-4.5" />
            <span>Scan New Resume</span>
          </button>
        )}
        <input
          id="new-scan-input"
          type="file"
          accept=".pdf,.docx"
          onChange={handleFileChange}
          className="hidden"
          title="Audit New Resume"
        />
      </div>

      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className={`p-12 rounded-3xl border flex flex-col items-center justify-center min-h-[45vh] shadow-xl backdrop-blur-2xl text-center
              ${darkMode ? 'bg-dark-card border-white/8 glass-panel' : 'bg-light-card border-slate-200/50 glass-panel-light'}`}
          >
            <div className="relative w-20 h-20 mb-8 flex items-center justify-center">
              <Loader2 className="absolute w-16 h-16 animate-spin text-brand-purple" />
              <div className="w-10 h-10 rounded-xl bg-brand-purple/10 flex items-center justify-center text-brand-purple">
                <FileText className="w-5 h-5 animate-pulse" />
              </div>
            </div>
            
            <h3 className="font-display font-extrabold text-xl mb-2 text-slate-800 dark:text-slate-100">
              AI Auditor is Scanning Document
            </h3>
            
            <AnimatePresence mode="wait">
              <motion.p
                key={loadingStepIndex}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="text-sm text-brand-purple font-bold tracking-wide"
              >
                {LOADING_STEPS[loadingStepIndex]}
              </motion.p>
            </AnimatePresence>
            
            <p className="text-xs text-slate-400 mt-2 font-semibold max-w-sm leading-relaxed">
              This process may take 10-15 seconds while we build the relational grammar graph and evaluate ATS densities.
            </p>
          </motion.div>
        ) : (analysis && showResults) ? (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* 1. Score Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
              {[
                { name: 'ATS Score', score: analysis.atsScore, icon: ShieldCheck, desc: 'ATS format compliance' },
                { name: 'Grammar Score', score: analysis.grammarScore, icon: BookOpen, desc: 'Syntax correctness' },
                { name: 'Resume Quality Score', score: analysis.resumeQualityScore, icon: HelpCircle, desc: 'Completeness rating' },
                { name: 'Technical Skills Score', score: analysis.skillsScore, icon: Cpu, desc: 'Skill keyword index' },
                { name: 'Overall Score', score: Math.round((analysis.atsScore + analysis.grammarScore + analysis.resumeQualityScore + analysis.skillsScore) / 4), icon: Award, desc: 'Aggregate rating', isSpecial: true }
              ].map((item) => {
                const Icon = item.icon;
                const strokeDash = 2 * Math.PI * 34; // Radius is 34
                const strokeOffset = strokeDash - (item.score / 100) * strokeDash;

                return (
                  <div
                    key={item.name}
                    className={`p-6 rounded-3xl border backdrop-blur-2xl shadow-lg flex items-center justify-between gap-4 transition-all duration-300
                      ${item.isSpecial
                        ? (darkMode 
                          ? 'bg-gradient-to-tr from-brand-purple/20 to-brand-indigo/15 border-brand-purple/40 ring-1 ring-brand-purple/20' 
                          : 'bg-gradient-to-tr from-brand-purple/10 to-brand-indigo/10 border-brand-purple/35')
                        : (darkMode ? 'bg-dark-card border-white/8 glass-panel' : 'bg-light-card border-slate-200/50 glass-panel-light')}`}
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                        <span className="text-xs font-extrabold uppercase text-slate-400 dark:text-slate-500 tracking-wider">
                          {item.name}
                        </span>
                      </div>
                      <p className="text-2xl font-black text-slate-800 dark:text-slate-100">{item.score}%</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-1">{item.desc}</p>
                    </div>

                    {/* Progress Circle */}
                    <div className="relative w-16 h-16 flex items-center justify-center flex-shrink-0">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle
                          cx="32"
                          cy="32"
                          r="28"
                          className="stroke-slate-200 dark:stroke-white/5 fill-none"
                          strokeWidth="5"
                        />
                        <circle
                          cx="32"
                          cy="32"
                          r="28"
                          className={`fill-none transition-all duration-1000 ${getScoreColor(item.score)}`}
                          strokeWidth="5"
                          strokeDasharray={strokeDash}
                          strokeDashoffset={strokeOffset}
                        />
                      </svg>
                      <span className="absolute text-xs font-extrabold">{item.score}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Document details box */}
            <div className={`p-4.5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4
              ${darkMode ? 'bg-white/3 border-white/5' : 'bg-white border-slate-200/55'}`}
            >
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-brand-purple flex-shrink-0" />
                <span className="text-xs font-bold truncate max-w-sm sm:max-w-md">
                  Active Document: {getFileNameFromUrl(analysis.resumeUrl)}
                </span>
              </div>
              <a
                href={analysis.resumeUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200/50 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-xs font-bold transition-all cursor-pointer focus-ring"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Original</span>
              </a>
            </div>

            {/* Navigation Tabs Header */}
            <div className="flex border-b border-slate-200 dark:border-white/10">
              <button
                onClick={() => setActiveTab('audit')}
                className={`px-6 py-3 font-bold text-sm tracking-wide border-b-2 transition-all flex items-center gap-2 cursor-pointer
                  ${activeTab === 'audit' 
                    ? 'border-brand-purple text-brand-purple dark:text-white' 
                    : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
              >
                <ClipboardList className="w-4 h-4" />
                <span>Diagnostic Audit & Live Preview</span>
              </button>
              <button
                onClick={() => setActiveTab('preview')}
                className={`px-6 py-3 font-bold text-sm tracking-wide border-b-2 transition-all flex items-center gap-2 cursor-pointer
                  ${activeTab === 'preview' 
                    ? 'border-brand-purple text-brand-purple dark:text-white' 
                    : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
              >
                <Eye className="w-4 h-4" />
                <span>Interactive Resume Preview</span>
              </button>
            </div>

            {/* TAB CONTENTS */}
            <AnimatePresence mode="wait">
              {activeTab === 'audit' ? (
                <motion.div
                  key="audit-tab"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
                >
                  {/* Left Column: Diagnostics Card Accordions */}
                  <div className="lg:col-span-7 space-y-4">
                    <h3 className="font-display font-extrabold text-xl mb-2">Detected Issues ({analysis.issues.length})</h3>
                    
                    {analysis.issues.length === 0 ? (
                      <div className={`p-10 text-center rounded-3xl border ${darkMode ? 'bg-white/3 border-white/5 text-slate-500' : 'bg-white border-slate-200/50 text-slate-400'}`}>
                        <CheckCircle className="w-10 h-10 mx-auto mb-4 text-green-500" />
                        <p className="text-sm font-semibold">Perfect Score! We found no grammar, spelling, or keyword defects in your resume.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {analysis.issues.map((issue, idx) => {
                          const isExpanded = expandedIssueId === idx;
                          const isStaged = appliedCorrections[idx] !== undefined;
                          
                          return (
                            <div
                              key={idx}
                              className={`rounded-2xl border overflow-hidden transition-all
                                ${darkMode ? 'bg-dark-card border-white/8' : 'bg-white border-slate-200/50'}
                                ${isStaged ? 'ring-1 ring-emerald-500/30 border-emerald-500/20' : ''}`}
                            >
                              {/* Summary Bar */}
                              <button
                                onClick={() => toggleExpandIssue(idx)}
                                className="w-full flex items-center justify-between p-5 text-left cursor-pointer hover:bg-slate-50 dark:hover:bg-white/2"
                              >
                                <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full">
                                  <div className="flex items-center gap-2">
                                    <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
                                    <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">{issue.problem}</h4>
                                  </div>
                                  
                                  {/* Badges */}
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-black tracking-wider uppercase border
                                      ${issue.severity === 'High' 
                                        ? 'bg-rose-500/10 text-rose-500 border-rose-500/15' 
                                        : issue.severity === 'Medium'
                                          ? 'bg-amber-500/10 text-amber-500 border-amber-500/15'
                                          : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/15'}`}
                                    >
                                      {issue.severity || 'Medium'} Severity
                                    </span>
                                    <span className="text-[9px] px-2.5 py-0.5 rounded-full font-black tracking-wider uppercase bg-brand-purple/10 text-brand-purple border border-brand-purple/15">
                                      {issue.errorType || 'Audit'}
                                    </span>
                                    {isStaged && (
                                      <span className="text-[9px] px-2.5 py-0.5 rounded-full font-black tracking-wider uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center gap-1">
                                        <Check className="w-3 h-3" /> Staged
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-3 flex-shrink-0">
                                  {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                                </div>
                              </button>

                              {/* Collapsible details pane */}
                              {isExpanded && (
                                <div className="p-6 border-t border-slate-200/40 dark:border-white/5 bg-slate-50/50 dark:bg-white/1 space-y-5 text-xs md:text-sm">
                                  
                                  {/* 1. Original Resume Text */}
                                  {issue.originalText && issue.originalText !== 'None' && (
                                    <div className="space-y-1">
                                      <span className="block text-[10px] text-rose-500 font-extrabold uppercase tracking-wider">
                                        Original Resume Text
                                      </span>
                                      <p className="font-mono text-xs text-rose-600 dark:text-rose-455 bg-rose-500/5 p-3 rounded-xl border border-rose-500/10 line-through decoration-rose-500/20 whitespace-pre-wrap leading-relaxed font-bold">
                                        "{issue.originalText}"
                                      </p>
                                    </div>
                                  )}

                                  {/* 2. Why this is incorrect */}
                                  <div className="space-y-1">
                                    <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-wider">
                                      Why this is incorrect
                                    </span>
                                    <p className="text-slate-700 dark:text-slate-300 font-semibold leading-relaxed">
                                      {issue.reason}
                                    </p>
                                  </div>

                                  {/* 3. AI Explanation */}
                                  <div className="space-y-1">
                                    <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-wider">
                                      AI Recruiter Explanation
                                    </span>
                                    <p className="text-slate-700 dark:text-slate-300 font-semibold leading-relaxed">
                                      {issue.suggestion}
                                    </p>
                                  </div>

                                  {/* 4. Suggested Improved Version */}
                                  {issue.improvedVersion && (
                                    <div className="space-y-1">
                                      <span className="block text-[10px] text-green-500 font-extrabold uppercase tracking-wider">
                                        Suggested Improved Version
                                      </span>
                                      <p className="font-mono text-xs text-green-600 dark:text-green-400 bg-green-500/5 p-3 rounded-xl border border-green-500/10 whitespace-pre-wrap leading-relaxed font-bold">
                                        "{issue.improvedVersion}"
                                      </p>
                                    </div>
                                  )}

                                  {/* 5. Highlighted Difference */}
                                  {issue.originalText && issue.originalText !== 'None' && issue.improvedVersion && (
                                    <div className="space-y-1.5 p-4 rounded-xl border border-slate-200/55 dark:border-white/5 bg-slate-100/30 dark:bg-white/1">
                                      <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-wider mb-1">
                                        Highlighted Difference
                                      </span>
                                      <div className="text-xs leading-relaxed font-mono whitespace-pre-wrap font-bold text-slate-600 dark:text-slate-400">
                                        {diffWords(issue.originalText, issue.improvedVersion).map((word, wIdx) => {
                                          if (word.removed) {
                                            return (
                                              <span key={wIdx} className="bg-rose-500/15 text-rose-600 dark:text-rose-400 line-through px-0.5 rounded">
                                                {word.value}
                                              </span>
                                            );
                                          }
                                          if (word.added) {
                                            return (
                                              <span key={wIdx} className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-450 px-0.5 rounded border border-emerald-500/10">
                                                {word.value}
                                              </span>
                                            );
                                          }
                                          return <span key={wIdx}>{word.value}</span>;
                                        })}
                                      </div>
                                    </div>
                                  )}

                                  {/* 6. Apply Correction button / Applied Status */}
                                  <div className="pt-2">
                                    {isStaged ? (
                                      <button
                                        onClick={() => handleRemoveCorrection(idx)}
                                        className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-emerald-500 text-emerald-500 bg-emerald-500/5 hover:bg-emerald-500/10 font-bold text-sm transition-all cursor-pointer focus-ring"
                                      >
                                        <Check className="w-4.5 h-4.5" />
                                        <span>Correction Applied (Click to Unstage)</span>
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => handleApplyCorrection(idx, issue.improvedVersion)}
                                        className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-white bg-gradient-to-r from-brand-purple to-brand-indigo hover:brightness-110 shadow-lg shadow-brand-purple/15 font-bold text-sm transition-all cursor-pointer focus-ring"
                                      >
                                        <Wand2 className="w-4.5 h-4.5" />
                                        <span>Apply Correction</span>
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Right Column: Sticky Live Preview (Desktop Only) */}
                  <div className="lg:col-span-5 hidden lg:block sticky top-6 space-y-3">
                    <div className="text-xs font-bold text-brand-purple uppercase tracking-wider flex items-center justify-between">
                      <span>Live Improved Resume</span>
                      <span className="text-[10px] font-black bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                        {stagedCount} Staged Edits
                      </span>
                    </div>
                    <div className="bg-white text-slate-800 border border-slate-200 shadow-xl p-8 rounded-3xl min-h-[500px] max-h-[70vh] overflow-y-auto relative select-text">
                      <HighlightedResume 
                        text={getImprovedText()} 
                        replacements={getStagedCorrectionsMap()} 
                        mode="improved" 
                      />
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="preview-tab"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="space-y-6"
                >
                  {/* Preview Selector Toggles */}
                  <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl border border-slate-200/60 dark:border-white/5 bg-slate-50/50 dark:bg-white/1">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPreviewMode('original')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer
                          ${previewMode === 'original' 
                            ? 'bg-slate-200 dark:bg-white/10 text-slate-800 dark:text-white' 
                            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                      >
                        Original Resume
                      </button>
                      <button
                        onClick={() => setPreviewMode('improved')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer
                          ${previewMode === 'improved' 
                            ? 'bg-slate-200 dark:bg-white/10 text-slate-800 dark:text-white' 
                            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                      >
                        Improved Resume
                      </button>
                      <button
                        onClick={() => setPreviewMode('sidebyside')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5
                          ${previewMode === 'sidebyside' 
                            ? 'bg-slate-200 dark:bg-white/10 text-slate-800 dark:text-white' 
                            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                      >
                        <Columns className="w-3.5 h-3.5" />
                        <span>Side-by-Side</span>
                      </button>
                    </div>

                    <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                      {stagedCount} corrections staged in memory
                    </div>
                  </div>

                  {/* Rendering Sheets */}
                  {previewMode === 'sidebyside' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Left Column: Original */}
                      <div className="space-y-2">
                        <div className="text-xs font-bold text-rose-500 uppercase tracking-wider">Original Document</div>
                        <div className="bg-white text-slate-800 border border-slate-200 shadow-xl p-8 rounded-3xl min-h-[550px] overflow-hidden relative">
                          <HighlightedResume 
                            text={analysis.rawText} 
                            replacements={getStagedCorrectionsMap()} 
                            mode="original" 
                          />
                        </div>
                      </div>

                      {/* Right Column: Improved */}
                      <div className="space-y-2">
                        <div className="text-xs font-bold text-emerald-500 uppercase tracking-wider">Improved Document</div>
                        <div className="bg-white text-slate-800 border border-slate-200 shadow-xl p-8 rounded-3xl min-h-[550px] overflow-hidden relative">
                          <HighlightedResume 
                            text={getImprovedText()} 
                            replacements={getStagedCorrectionsMap()} 
                            mode="improved" 
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="max-w-2xl mx-auto space-y-3">
                      <div className="text-xs font-bold text-brand-purple uppercase tracking-wider text-center">
                        {previewMode === 'original' ? 'Original Document Layout' : 'Staged Improved Document Layout'}
                      </div>
                      <div className="bg-white text-slate-800 border border-slate-200 shadow-xl p-8 md:p-12 rounded-3xl min-h-[600px] overflow-hidden relative">
                        {previewMode === 'original' ? (
                          <HighlightedResume 
                            text={analysis.rawText} 
                            replacements={getStagedCorrectionsMap()} 
                            mode="original" 
                          />
                        ) : (
                          <HighlightedResume 
                            text={getImprovedText()} 
                            replacements={getStagedCorrectionsMap()} 
                            mode="improved" 
                          />
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* 3. Staged Changes & Resume Optimization Center */}
            {stagedCount > 0 && (() => {
              const originalOverallScore = Math.round((analysis.atsScore + analysis.grammarScore + analysis.resumeQualityScore + analysis.skillsScore) / 4);
              const improvedAtsScore = Math.min(100, analysis.atsScore + (stagedCount * 4));
              const atsIncrease = improvedAtsScore - analysis.atsScore;
              const improvedOverallScore = Math.min(100, originalOverallScore + (stagedCount * 3));
              const overallIncrease = improvedOverallScore - originalOverallScore;

              return (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-6 rounded-3xl border shadow-xl flex flex-col gap-6 backdrop-blur-2xl
                    ${darkMode ? 'bg-dark-card border-white/8 glass-panel' : 'bg-light-card border-slate-200/50 glass-panel-light'}`}
                >
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/40 dark:border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-brand-purple/10 text-brand-purple flex items-center justify-center">
                        <ClipboardList className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-display font-extrabold text-base text-slate-800 dark:text-slate-100">
                          Resume Optimization & Download Center
                        </h3>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold">
                          Review optimizations and download your high-converting resume document.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={handleResetStaged}
                        className="px-3.5 py-1.5 rounded-xl border border-slate-250 dark:border-white/10 text-slate-400 dark:text-slate-500 hover:text-rose-500 hover:border-rose-500/20 text-xs font-bold transition-all cursor-pointer"
                      >
                        Clear Staged Edits
                      </button>
                    </div>
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Applied Corrections */}
                    <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-white/2 border-white/5' : 'bg-slate-50 border-slate-200/40'}`}>
                      <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-wider mb-1">
                        Total Corrections Applied
                      </span>
                      <span className="text-xl font-black text-slate-800 dark:text-slate-100">{stagedCount}</span>
                    </div>

                    {/* ATS Increase */}
                    <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-white/2 border-white/5' : 'bg-slate-50 border-slate-200/40'}`}>
                      <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-wider mb-1">
                        ATS Score Increase
                      </span>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-xl font-black text-emerald-500">+{atsIncrease}%</span>
                        <span className="text-[10px] text-slate-400 font-semibold">({analysis.atsScore}% → {improvedAtsScore}%)</span>
                      </div>
                    </div>

                    {/* Improvement Score */}
                    <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-white/2 border-white/5' : 'bg-slate-50 border-slate-200/40'}`}>
                      <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-wider mb-1">
                        Improvement Score
                      </span>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-xl font-black text-emerald-500">{improvedOverallScore}%</span>
                        <span className="text-[10px] text-slate-400 font-semibold">(+{overallIncrease}% growth)</span>
                      </div>
                    </div>
                  </div>

                  {/* Updated Resume Preview */}
                  <div className="space-y-2">
                    <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-wider">
                      Updated Resume Preview (Before Download)
                    </span>
                    <div className={`border rounded-2xl p-4 max-h-[150px] overflow-y-auto select-text shadow-inner
                      ${darkMode ? 'bg-black/30 border-white/5' : 'bg-white border-slate-200/60'}`}
                    >
                      <HighlightedResume 
                        text={getImprovedText()} 
                        replacements={getStagedCorrectionsMap()} 
                        mode="improved" 
                      />
                    </div>
                  </div>

                  {/* Actions & Downloads */}
                  <div className="pt-4 border-t border-slate-200/40 dark:border-white/5 flex flex-col gap-4">
                    {isGenerating ? (
                      <div className="flex flex-col items-center justify-center p-6 text-center gap-3">
                        <Loader2 className="w-8 h-8 text-brand-purple animate-spin" />
                        <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                          Generating optimized resume files. Please wait...
                        </p>
                      </div>
                    ) : generatedUrls ? (
                      <div className="space-y-3">
                        <div className="flex flex-col sm:flex-row gap-3">
                          <button
                            onClick={() => handleDownloadBlob(generatedUrls.pdfUrl, 'improved_resume.pdf')}
                            className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-white bg-rose-500 hover:bg-rose-600 font-bold text-sm transition-all cursor-pointer shadow-lg shadow-rose-500/10 focus-ring"
                          >
                            <Download className="w-4.5 h-4.5" />
                            <span>Download Updated PDF</span>
                          </button>
                          <button
                            onClick={() => handleDownloadBlob(generatedUrls.docxUrl, 'improved_resume.docx')}
                            className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-white bg-blue-500 hover:bg-blue-600 font-bold text-sm transition-all cursor-pointer shadow-lg shadow-blue-500/10 focus-ring"
                          >
                            <Download className="w-4.5 h-4.5" />
                            <span>Download Updated DOCX</span>
                          </button>
                        </div>
                        
                        <div className="flex justify-center pt-2">
                          <button
                            onClick={() => handleDownloadBlob(analysis.resumeUrl, 'original_resume.pdf')}
                            className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-600 cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download Original Resume</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Generation Request Button */}
                        <button
                          onClick={handleGenerate}
                          className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-110 shadow-lg shadow-emerald-500/15 font-bold text-sm transition-all cursor-pointer focus-ring"
                        >
                          <Wand2 className="w-4.5 h-4.5" />
                          <span>Generate Optimized Resume</span>
                        </button>

                        {/* Disabled Placeholders to show download is locked until generation is complete */}
                        <div className="flex flex-col sm:flex-row gap-3 opacity-50">
                          <button
                            disabled
                            className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-slate-400 bg-slate-100 dark:bg-white/5 font-bold text-sm cursor-not-allowed"
                          >
                            <Download className="w-4.5 h-4.5" />
                            <span>Download Updated PDF (Locked)</span>
                          </button>
                          <button
                            disabled
                            className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-slate-400 bg-slate-100 dark:bg-white/5 font-bold text-sm cursor-not-allowed"
                          >
                            <Download className="w-4.5 h-4.5" />
                            <span>Download Updated DOCX (Locked)</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                </motion.div>
              );
            })()}
          </motion.div>
        ) : (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="w-full max-w-xl mx-auto"
          >
            {/* Drag Drop Area */}
            <label
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-3xl cursor-pointer transition-all text-center group
                ${isDragging 
                  ? 'border-brand-purple bg-brand-purple/10 scale-[1.01]' 
                  : 'border-slate-300 hover:border-slate-400 dark:border-white/15 dark:hover:border-white/25 bg-slate-50/50 dark:bg-white/2 hover:bg-slate-50 dark:hover:bg-white/5'}`}
            >
              <div className="flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-2xl bg-brand-purple/10 text-brand-purple flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                  Upload resume for AI स्कैनing
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 font-semibold">
                  Supports PDF and DOCX formats (Max 5MB)
                </p>
                
                <span className="mt-8 px-5 py-3 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-brand-purple to-brand-indigo hover:brightness-110 shadow-md shadow-brand-purple/15 transition-all">
                  Choose Document
                </span>
              </div>
              <input
                type="file"
                accept=".pdf,.docx"
                onChange={handleFileChange}
                className="hidden"
                title="Select Resume Document"
              />
            </label>

            {/* Error Notice */}
            {uploadError && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 mt-4 text-xs font-bold text-rose-500 dark:text-rose-400 text-left p-3 rounded-xl border border-rose-500/15 bg-rose-500/5 shadow-sm"
              >
                <AlertCircle className="w-4.5 h-4.5 flex-shrink-0" />
                <span>{uploadError}</span>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
