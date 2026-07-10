import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle
} from 'lucide-react';
import { motion } from 'framer-motion';

import { useTheme } from '../context/ThemeContext';
import { useToast } from '../components/Toast';
import { useInterviewStore } from '../store/interviewStore';
import { ThemeToggle } from '../components/ThemeToggle';
import { InterviewAnswerPanel } from '../components/InterviewAnswerPanel';

export const SelfIntroductionPage: React.FC = () => {
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const {
    activeSession,
    fetchCurrentSession,
    submitSelfIntroduction
  } = useInterviewStore();

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmittingFinal, setIsSubmittingFinal] = useState(false);

  useEffect(() => {
    fetchCurrentSession().then(() => {
      const session = useInterviewStore.getState().activeSession;
      if (session && session.selfIntroduction) {
        setIsSubmitted(true);
      }
    });
  }, [fetchCurrentSession]);

  const handleDoneIntroduction = async (_audioBlob: Blob | null, outputString: string) => {
    if (!activeSession) {
      showToast('No active session found.', 'error');
      return;
    }
    if (!outputString.trim()) {
      showToast('Self-introduction transcript is empty. Please speak clearly.', 'error');
      return;
    }
    setIsSubmittingFinal(true);
    try {
      await submitSelfIntroduction(activeSession.id, outputString.trim());
      setIsSubmitted(true);
      showToast('Self introduction submitted successfully. Moving to next round...', 'success');
      setTimeout(() => {
        handleNext();
      }, 2500);
    } catch (e: any) {
      showToast(e.message || 'Submission failed.', 'error');
    } finally {
      setIsSubmittingFinal(false);
    }
  };

  const handleNext = () => {
    navigate('/interview');
  };

  return (
    <div className={`min-h-screen p-6 md:p-12 transition-colors duration-300 flex items-center justify-center
      ${darkMode ? 'bg-dark-bg bg-gradient-mesh text-slate-100' : 'bg-light-bg bg-gradient-mesh-light text-slate-900'}`}
    >
      <div className="max-w-3xl w-full space-y-6 text-left">
        
        {/* Top Header / Progress Indicator */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-black uppercase px-3 py-1.5 rounded-xl bg-brand-purple/10 border border-brand-purple/20 text-brand-purple">
                Step 1 of 5 · Self Introduction
              </span>
              {activeSession && (
                <span className="text-xs text-slate-400 font-bold uppercase">
                  Session #{activeSession.id}
                </span>
              )}
            </div>
            {activeSession && (
              <h1 className="font-display font-black text-2xl mt-2 bg-gradient-to-r from-brand-purple to-brand-indigo bg-clip-text text-transparent">
                {activeSession.title}
              </h1>
            )}
          </div>
          <ThemeToggle />
        </div>

        {/* Success Banner */}
        {isSubmitted ? (
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-5 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 text-emerald-400 flex items-center gap-4"
            >
              <CheckCircle className="w-8 h-8 flex-shrink-0" />
              <div>
                <h4 className="font-black text-sm uppercase tracking-wide">Self Introduction Completed</h4>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">
                  Your self-introduction was saved successfully. You can now proceed to the HR interview round.
                </p>
              </div>
            </motion.div>
            
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-brand-purple to-brand-indigo hover:brightness-110 shadow-lg shadow-brand-purple/20 cursor-pointer"
              >
                Next
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <InterviewAnswerPanel
            questionString="Please introduce yourself. Focus on your key strengths, domain experience, and projects."
            isProcessing={isSubmittingFinal}
            onFinishAnswer={handleDoneIntroduction}
            isInterviewerSpeaking={false}
          />
        )}

      </div>
    </div>
  );
};
