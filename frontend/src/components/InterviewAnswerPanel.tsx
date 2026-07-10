import React, { useState, useEffect, useRef } from 'react';
import { Mic, Loader2 } from 'lucide-react';

interface AnswerPanelProps {
  questionString: string;
  isProcessing: boolean;
  onFinishAnswer: (audioBlob: Blob | null, outputString: string) => void;
  isInterviewerSpeaking: boolean;
}

export const InterviewAnswerPanel: React.FC<AnswerPanelProps> = ({
  questionString,
  isProcessing,
  onFinishAnswer,
  isInterviewerSpeaking
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcriptString, setTranscriptString] = useState('');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [errorText, setErrorText] = useState('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);
  const isRecordingRef = useRef(false);
  const silenceTimeoutRef = useRef<any>(null);

  const transcriptRef = useRef('');
  useEffect(() => {
    transcriptRef.current = transcriptString;
  }, [transcriptString]);

  useEffect(() => {
    return () => {
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';

    rec.onresult = (event: any) => {
      if (isInterviewerSpeaking) return;

      // Handle silence auto-detection trigger on word activity
      resetSilenceTimeout(2500);

      let finalStr = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalStr += event.results[i][0].transcript;
        }
      }
      if (finalStr) {
        setTranscriptString(prev => prev + (prev ? ' ' : '') + finalStr);
      }
    };

    rec.onerror = (err: any) => {
      console.warn('Speech recognition error:', err.error);
      if (isRecordingRef.current && ['aborted', 'network'].includes(err.error)) {
        try {
          rec.stop();
          setTimeout(() => {
            if (isRecordingRef.current) rec.start();
          }, 400);
        } catch {}
      }
    };

    rec.onend = () => {
      if (isRecordingRef.current) {
        try {
          rec.start();
        } catch {}
      }
    };

    recognitionRef.current = rec;
  }, [isInterviewerSpeaking]);

  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const streamClean = (stream: MediaStream) => {
    stream.getTracks().forEach(t => t.stop());
  };

  const handleFinishAuto = () => {
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }

    if (mediaRecorderRef.current && isRecordingRef.current) {
      setIsRecording(false);
      isRecordingRef.current = false;
      try {
        recognitionRef.current?.stop();
      } catch {}

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        streamClean(mediaRecorderRef.current!.stream);
        
        const finalAns = transcriptRef.current.trim();
        if (!finalAns) {
          setErrorText('No answer detected. Please try again.');
        } else {
          setErrorText('');
          onFinishAnswer(blob, finalAns);
        }
      };
      mediaRecorderRef.current.stop();
    } else {
      const finalAns = transcriptRef.current.trim();
      if (!finalAns) {
        setErrorText('No answer detected. Please try again.');
      } else {
        setErrorText('');
        onFinishAnswer(audioBlob, finalAns);
      }
    }
  };

  const resetSilenceTimeout = (delay = 2500) => {
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
    }
    silenceTimeoutRef.current = setTimeout(() => {
      handleFinishAuto();
    }, delay);
  };

  const startRecording = async () => {
    if (isInterviewerSpeaking || isProcessing) return;
    setErrorText('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      let mr: MediaRecorder;
      try {
        mr = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      } catch {
        mr = new MediaRecorder(stream);
      }

      mr.ondataavailable = e => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

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
      setTranscriptString('');

      try {
        recognitionRef.current?.start();
      } catch {}

      // Start initial silence timeout
      resetSilenceTimeout(4500);
    } catch (e) {
      console.error(e);
    }
  };

  const handleFinish = () => {
    handleFinishAuto();
  };

  return (
    <div className="flex flex-col gap-6 p-6 rounded-3xl border border-slate-200 bg-white shadow-lg">
      {/* Question */}
      <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b', lineHeight: 1.625 }}>
        {questionString}
      </h2>

      {/* Status Indicators */}
      <div className="flex flex-col gap-2 items-start">
        <div className="flex items-center gap-3">
          {isRecording ? (
            <span
              className="flex items-center gap-2 px-3 py-1.5 rounded-full animate-pulse"
              style={{ fontSize: '0.75rem', fontWeight: 700, color: '#ef4444', backgroundColor: '#fef2f2', border: '1px solid #fecaca' }}
            >
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              Listening
            </span>
          ) : (
            <span
              className="flex items-center gap-2 px-3 py-1.5 rounded-full"
              style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f59e0b', backgroundColor: '#fffbeb', border: '1px solid #fef3c7' }}
            >
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Waiting
            </span>
          )}
        </div>
        {errorText && (
          <div
            style={{ fontSize: '0.75rem', fontWeight: 750, color: '#ef4444', marginTop: '0.25rem' }}
            className="animate-pulse"
          >
            {errorText}
          </div>
        )}
      </div>

      {/* Live Microphone Controls */}
      <div className="flex flex-col items-center justify-center py-6 gap-4 border-t border-slate-100">
        {isProcessing ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-12 h-12 animate-spin" style={{ color: '#2563eb' }} />
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700 }}>Uploading and evaluating...</span>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            {!isRecording ? (
              <button
                type="button"
                onClick={startRecording}
                disabled={isInterviewerSpeaking}
                className="w-16 h-16 rounded-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 shadow-lg transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer"
                style={{ color: '#ffffff' }}
                title="Start Microphone"
              >
                <Mic className="w-7 h-7" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                className="px-6 py-3 rounded-full flex items-center gap-2 bg-red-600 hover:bg-red-700 font-bold shadow-md transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                style={{ fontSize: '0.875rem', color: '#ffffff' }}
              >
                <div className="w-3.5 h-3.5 rounded-sm bg-white animate-pulse" />
                Stop Microphone
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
