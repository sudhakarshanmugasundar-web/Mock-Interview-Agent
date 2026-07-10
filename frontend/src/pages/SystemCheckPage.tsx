import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Globe,
  Wifi,
  Video,
  Mic,
  Volume2,
  ArrowRight,
  HelpCircle,
  ShieldCheck,
  CheckCircle,
  XCircle,
  Volume1,
  Check,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { motion } from 'framer-motion';

import { useTheme } from '../context/ThemeContext';
import { ThemeToggle } from '../components/ThemeToggle';
import { useInterviewStore } from '../store/interviewStore';

export const SystemCheckPage: React.FC = () => {
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const { activeSession } = useInterviewStore();

  // Automatic Checks State
  const [browserStatus, setBrowserStatus] = React.useState<'Pending' | 'Passed' | 'Failed'>('Pending');
  const [browserError, setBrowserError] = React.useState<string | null>(null);

  const [internetStatus, setInternetStatus] = React.useState<'Pending' | 'Passed' | 'Failed'>('Pending');
  const [internetLabel, setInternetLabel] = React.useState<'Pending' | 'Excellent' | 'Good' | 'Poor' | 'Offline'>('Pending');
  const [internetError, setInternetError] = React.useState<string | null>(null);

  // Camera State
  const [cameraStatus, setCameraStatus] = React.useState<'Pending' | 'Passed' | 'Failed'>('Pending');
  const [cameraError, setCameraError] = React.useState<string | null>(null);
  const [cameraStream, setCameraStream] = React.useState<MediaStream | null>(null);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);

  // Microphone State
  const [micStatus, setMicStatus] = React.useState<'Pending' | 'Passed' | 'Failed'>('Pending');
  const [micError, setMicError] = React.useState<string | null>(null);
  const [micStream, setMicStream] = React.useState<MediaStream | null>(null);
  const [micLevel, setMicLevel] = React.useState<number>(0);
  const [speakingTime, setSpeakingTime] = React.useState<number>(0);
  const [timeLeft, setTimeLeft] = React.useState<number>(10);
  const [isMicTesting, setIsMicTesting] = React.useState<boolean>(false);

  // Speaker State
  const [speakerStatus, setSpeakerStatus] = React.useState<'Pending' | 'Passed'>('Pending');
  const [isSpeakerTesting, setIsSpeakerTesting] = React.useState<boolean>(false);
  const [showSpeakerQuestion, setShowSpeakerQuestion] = React.useState<boolean>(false);
  const [speakerError, setSpeakerError] = React.useState<string | null>(null);

  // Audio refs for Web Audio API loops
  const audioCtxRef = React.useRef<AudioContext | null>(null);
  const analyserRef = React.useRef<AnalyserNode | null>(null);
  const animationFrameRef = React.useRef<number | null>(null);
  const micTimerRef = React.useRef<any>(null);

  // Run Browser and Internet checks automatically on mount
  React.useEffect(() => {
    checkBrowser();
    checkInternet();

    const handleOnlineStatusChange = () => {
      checkInternet();
    };

    window.addEventListener('online', handleOnlineStatusChange);
    window.addEventListener('offline', handleOnlineStatusChange);

    return () => {
      window.removeEventListener('online', handleOnlineStatusChange);
      window.removeEventListener('offline', handleOnlineStatusChange);
    };
  }, []);

  // Browser Checker
  const checkBrowser = () => {
    const userAgent = navigator.userAgent;
    const isChrome = /Chrome|CriOS/.test(userAgent) && !/Edg/.test(userAgent);
    const isEdge = /Edg/.test(userAgent);
    const isSafari = /Safari/.test(userAgent) && !/Chrome|CriOS|Edg/.test(userAgent);

    if (isChrome || isEdge || isSafari) {
      setBrowserStatus('Passed');
      setBrowserError(null);
    } else {
      setBrowserStatus('Failed');
      setBrowserError('Unsupported browser. Please use Google Chrome, Microsoft Edge, or Apple Safari.');
    }
  };

  // Internet Checker & Latency Test
  const checkInternet = async () => {
    if (!navigator.onLine) {
      setInternetStatus('Failed');
      setInternetLabel('Offline');
      setInternetError('You are offline. Please connect to a stable internet connection.');
      return;
    }

    setInternetStatus('Pending');
    setInternetLabel('Pending');

    try {
      const startTime = performance.now();
      // Fetch dynamic API endpoint to measure latency
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      await fetch('/api/interviews/current', {
        method: 'GET',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const latency = performance.now() - startTime;

      if (latency < 150) {
        setInternetStatus('Passed');
        setInternetLabel('Excellent');
        setInternetError(null);
      } else if (latency <= 500) {
        setInternetStatus('Passed');
        setInternetLabel('Good');
        setInternetError(null);
      } else {
        setInternetStatus('Passed'); // Poor latency is still passed, but we show warning
        setInternetLabel('Poor');
        setInternetError('Slow connection latency detected (>500ms). Performance might be affected.');
      }
    } catch (e) {
      if (navigator.onLine) {
        setInternetStatus('Passed');
        setInternetLabel('Good');
        setInternetError(null);
      } else {
        setInternetStatus('Failed');
        setInternetLabel('Offline');
        setInternetError('No internet connection. Please verify your ethernet or Wi-Fi settings.');
      }
    }
  };

  // Start Camera Test
  const startCameraTest = async () => {
    setCameraError(null);
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 }
      });
      setCameraStream(mediaStream);
      setCameraStatus('Passed');
    } catch (err: any) {
      setCameraStatus('Failed');
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Camera permission denied. Please click the lock/camera icon in your address bar to allow.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('No camera detected. Please plug in a webcam.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setCameraError('Camera already in use by another application.');
      } else {
        setCameraError(err.message || 'Failed to access camera.');
      }
    }
  };

  // Start Microphone Test
  const startMicTest = async () => {
    setMicError(null);
    setMicLevel(0);
    setSpeakingTime(0);
    setTimeLeft(10);
    setIsMicTesting(true);
    setMicStatus('Pending');

    if (micStream) {
      micStream.getTracks().forEach(track => track.stop());
      setMicStream(null);
    }
    stopAudioContext();

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicStream(mediaStream);

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioCtx.createMediaStreamSource(mediaStream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      audioCtxRef.current = audioCtx;
      analyserRef.current = analyser;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      let accumulatedSpeakingSeconds = 0;

      const draw = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteTimeDomainData(dataArray);

        let sumSquares = 0.0;
        for (let i = 0; i < bufferLength; i++) {
          const norm = (dataArray[i] - 128) / 128;
          sumSquares += norm * norm;
        }
        const rms = Math.sqrt(sumSquares / bufferLength);
        const currentLevel = Math.min(Math.round(rms * 300), 100);
        setMicLevel(currentLevel);

        if (currentLevel > 8) {
          accumulatedSpeakingSeconds += 1 / 60;
          setSpeakingTime(Math.min(accumulatedSpeakingSeconds, 3.0));
        }

        if (accumulatedSpeakingSeconds >= 3.0) {
          setMicStatus('Passed');
          cleanupMicStreams(mediaStream);
        } else {
          animationFrameRef.current = requestAnimationFrame(draw);
        }
      };

      animationFrameRef.current = requestAnimationFrame(draw);

      let secondsLeft = 10;
      micTimerRef.current = setInterval(() => {
        secondsLeft -= 1;
        setTimeLeft(secondsLeft);

        if (secondsLeft <= 0) {
          clearInterval(micTimerRef.current);
          if (accumulatedSpeakingSeconds < 3.0) {
            setMicStatus('Failed');
            setMicError('No voice detected. Please speak louder or choose a different recording device.');
            cleanupMicStreams(mediaStream);
          }
        }
      }, 1000);

    } catch (err: any) {
      setMicStatus('Failed');
      setIsMicTesting(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setMicError('Microphone permission denied. Please click the lock/mic icon in your address bar to allow.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setMicError('No microphone detected. Please connect recording hardware.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setMicError('Microphone is already in use by another application.');
      } else {
        setMicError(err.message || 'Failed to access microphone.');
      }
    }
  };

  // Play Speaker Test Sound
  const playSpeakerTestSound = async () => {
    setSpeakerError(null);
    setIsSpeakerTesting(true);
    setShowSpeakerQuestion(false);

    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }

      const notes = [261.63, 329.63, 392.00, 523.25];
      const duration = 2.0;

      notes.forEach((freq, index) => {
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.12, audioCtx.currentTime + 0.15);
        gainNode.gain.setValueAtTime(0.12, audioCtx.currentTime + duration - 0.35);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        osc.start(audioCtx.currentTime + index * 0.15);
        osc.stop(audioCtx.currentTime + duration);
      });

      setTimeout(() => {
        audioCtx.close();
        setIsSpeakerTesting(false);
        setShowSpeakerQuestion(true);
      }, (duration + 0.5) * 1000);

    } catch (err: any) {
      setIsSpeakerTesting(false);
      setSpeakerError('Playback blocked or failed. Please check sound settings and try again.');
    }
  };

  const cleanupMicStreams = (streamToStop: MediaStream) => {
    setIsMicTesting(false);
    if (streamToStop) {
      streamToStop.getTracks().forEach(track => track.stop());
    }
    setMicStream(null);
    stopAudioContext();
    if (micTimerRef.current) {
      clearInterval(micTimerRef.current);
      micTimerRef.current = null;
    }
  };

  const stopAudioContext = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    analyserRef.current = null;
  };

  // Video Ref Auto-play stream
  React.useEffect(() => {
    if (videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream]);

  // Clean up streams on page unmount
  React.useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
      if (micStream) {
        micStream.getTracks().forEach(track => track.stop());
      }
      if (micTimerRef.current) {
        clearInterval(micTimerRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    };
  }, [cameraStream, micStream]);

  // System validation flag
  const isEverythingPassed =
    cameraStatus === 'Passed' &&
    micStatus === 'Passed' &&
    speakerStatus === 'Passed' &&
    browserStatus === 'Passed' &&
    internetStatus === 'Passed';

  const checklistItems = [
    { 
      name: 'Browser Compatibility', 
      icon: Globe, 
      status: browserStatus, 
      error: browserError, 
      desc: 'Validates browser vendor and active standards support.' 
    },
    { 
      name: 'Internet Connection', 
      icon: Wifi, 
      status: internetStatus, 
      label: internetLabel,
      error: internetError, 
      desc: 'Ensures network connectivity is active and stable.' 
    },
    { 
      name: 'Camera Access', 
      icon: Video, 
      status: cameraStatus, 
      error: cameraError,
      desc: 'Verifies connection to camera and video stream capability.' 
    },
    { 
      name: 'Microphone Input', 
      icon: Mic, 
      status: micStatus, 
      error: micError,
      desc: 'Checks audio capturing device recognition and permissions.' 
    },
    { 
      name: 'Speaker Output', 
      icon: Volume2, 
      status: speakerStatus, 
      error: speakerError,
      desc: 'Validates browser audio playback system availability.' 
    },
  ];

  const cardCls = `rounded-3xl border shadow-xl backdrop-blur-2xl p-8
    ${darkMode ? 'bg-dark-card border-white/8 glass-panel' : 'bg-light-card border-slate-200/50'}`;

  return (
    <div className={`min-h-screen p-6 md:p-12 transition-colors duration-300 flex items-center justify-center
      ${darkMode ? 'bg-dark-bg bg-gradient-mesh text-slate-100' : 'bg-light-bg bg-gradient-mesh-light text-slate-900'}`}
    >
      <div className="max-w-2xl w-full space-y-6 text-left">
        
        {/* Top Header Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs font-extrabold uppercase px-3 py-1.5 rounded-xl bg-brand-purple/10 border border-brand-purple/20 text-brand-purple">
              Pre-Interview Check
            </span>
            {activeSession && (
              <span className="text-xs text-slate-400 font-bold uppercase">
                Session #{activeSession.id}
              </span>
            )}
          </div>
          <ThemeToggle />
        </div>

        {/* Completion Success Banner */}
        {isEverythingPassed && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-5 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 text-emerald-400 flex items-center gap-4 shadow-lg shadow-emerald-500/5"
          >
            <CheckCircle className="w-8 h-8 flex-shrink-0" />
            <div>
              <h4 className="font-black text-sm uppercase tracking-wide">System Check Completed</h4>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">
                Your device is ready for the interview. You can now proceed to the next step.
              </p>
            </div>
          </motion.div>
        )}

        {/* Title Block */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className={cardCls}
        >
          <div className="flex gap-4 items-start">
            <div className="w-12 h-12 rounded-2xl bg-brand-purple/10 text-brand-purple flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-display font-black text-xl mb-1">Pre-Interview System Check</h1>
              <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                Before entering the mock interview session, we need to verify your hardware and network configurations. 
                Please grant any browser permission requests when prompted.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Checklist Block */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={cardCls}
        >
          <div className="space-y-4">
            {checklistItems.map((item, index) => {
              const Icon = item.icon;
              const isCamera = item.name === 'Camera Access';
              const isMic = item.name === 'Microphone Input';
              const isSpeaker = item.name === 'Speaker Output';
              
              const currentStatus = item.status;
              const hasFailed = currentStatus === 'Failed';

              return (
                <div 
                  key={index} 
                  className={`flex flex-col p-4 rounded-2xl border transition-all gap-3
                    ${darkMode ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-250/30'}
                    ${hasFailed ? 'border-rose-500/20 bg-rose-500/5' : ''}`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                        ${hasFailed 
                          ? 'bg-rose-500/10 text-rose-500' 
                          : 'bg-brand-purple/8 text-brand-purple'}`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className={`font-bold text-xs ${hasFailed ? 'text-rose-500' : ''}`}>{item.name}</p>
                        <p className="text-[10px] text-slate-450 dark:text-slate-500 font-semibold mt-0.5 leading-relaxed">
                          {item.desc}
                        </p>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center gap-2">
                      {item.label && item.label !== 'Pending' && (
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md
                          ${item.label === 'Excellent' 
                            ? 'bg-emerald-500/10 text-emerald-500' 
                            : item.label === 'Good' 
                            ? 'bg-indigo-500/10 text-indigo-500' 
                            : 'bg-amber-500/10 text-amber-500'}`}
                        >
                          {item.label}
                        </span>
                      )}

                      {currentStatus === 'Pending' && (
                        <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-lg bg-slate-500/10 border border-slate-500/20 text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          <HelpCircle className="w-3.5 h-3.5" />
                          Pending
                        </span>
                      )}
                      {currentStatus === 'Passed' && (
                        <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center gap-1.5">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Passed
                        </span>
                      )}
                      {currentStatus === 'Failed' && (
                        <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center gap-1.5 animate-pulse">
                          <XCircle className="w-3.5 h-3.5" />
                          Failed
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Highlight error block/instruction for failed items */}
                  {hasFailed && item.error && (
                    <div className="pl-14 w-full">
                      <div className="flex gap-2 items-start text-xs text-rose-500 font-bold bg-rose-500/5 border border-rose-500/10 px-3 py-2 rounded-xl">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>{item.error}</span>
                      </div>
                    </div>
                  )}

                  {/* Camera Test Controls */}
                  {isCamera && (
                    <div className="pl-14 w-full">
                      {cameraStatus === 'Pending' && (
                        <button
                          type="button"
                          onClick={startCameraTest}
                          className="px-4 py-2 bg-brand-purple text-white text-xs font-bold rounded-xl hover:bg-brand-purple/90 transition-all cursor-pointer shadow-md shadow-brand-purple/20"
                        >
                          Start Camera Test
                        </button>
                      )}

                      {cameraStatus === 'Failed' && (
                        <button
                          type="button"
                          onClick={startCameraTest}
                          className="px-4 py-2 bg-rose-500 text-white text-xs font-bold rounded-xl hover:bg-rose-500/90 transition-all cursor-pointer shadow-md shadow-rose-500/20"
                        >
                          Retry Camera Check
                        </button>
                      )}

                      {cameraStatus === 'Passed' && cameraStream && (
                        <div className="space-y-3">
                          <div className="relative rounded-2xl overflow-hidden border border-emerald-500/30 bg-black aspect-video max-w-sm shadow-lg">
                            <video
                              ref={videoRef}
                              autoPlay
                              playsInline
                              muted
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-emerald-500 text-white text-[9px] font-black uppercase flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-white block" />
                              Live Preview
                            </div>
                          </div>
                          <p className="text-xs text-emerald-500 font-bold">
                            Camera check successful! Feed active.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Microphone Test Controls */}
                  {isMic && (
                    <div className="pl-14 w-full">
                      {micStatus === 'Pending' && !isMicTesting && (
                        <button
                          type="button"
                          onClick={startMicTest}
                          className="px-4 py-2 bg-brand-purple text-white text-xs font-bold rounded-xl hover:bg-brand-purple/90 transition-all cursor-pointer shadow-md shadow-brand-purple/20"
                        >
                          Start Microphone Test
                        </button>
                      )}

                      {isMicTesting && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between max-w-xs text-xs font-bold">
                            <span className="text-brand-purple animate-pulse flex items-center gap-1.5">
                              <Volume1 className="w-4 h-4" /> Listening...
                            </span>
                            <span className="text-slate-400">Time remaining: {timeLeft}s</span>
                          </div>

                          <div className="h-2 max-w-sm rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                            <div 
                              className="h-full bg-brand-purple transition-all duration-75"
                              style={{ width: `${micLevel}%` }}
                            />
                          </div>

                          <div className="flex items-center justify-between max-w-xs text-[10px] text-slate-400 font-bold">
                            <span>Please speak for at least 3 seconds</span>
                            <span className="text-brand-purple">{speakingTime.toFixed(1)} / 3.0s</span>
                          </div>
                        </div>
                      )}

                      {micStatus === 'Failed' && !isMicTesting && (
                        <button
                          type="button"
                          onClick={startMicTest}
                          className="px-4 py-2 bg-rose-500 text-white text-xs font-bold rounded-xl hover:bg-rose-500/90 transition-all cursor-pointer shadow-md shadow-rose-500/20"
                        >
                          Retry Microphone Check
                        </button>
                      )}

                      {micStatus === 'Passed' && (
                        <p className="text-xs text-emerald-500 font-bold">
                          Microphone check successful! Input levels verified.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Speaker Test Controls */}
                  {isSpeaker && (
                    <div className="pl-14 w-full">
                      {speakerStatus === 'Pending' && !isSpeakerTesting && !showSpeakerQuestion && (
                        <button
                          type="button"
                          onClick={playSpeakerTestSound}
                          className="px-4 py-2 bg-brand-purple text-white text-xs font-bold rounded-xl hover:bg-brand-purple/90 transition-all cursor-pointer shadow-md shadow-brand-purple/20"
                        >
                          Play Test Sound
                        </button>
                      )}

                      {isSpeakerTesting && (
                        <div className="flex items-center gap-2 text-xs font-bold text-brand-purple animate-pulse">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Playing chime audio... Please listen closely.</span>
                        </div>
                      )}

                      {showSpeakerQuestion && !isSpeakerTesting && (
                        <div className="space-y-3">
                          <p className="text-xs font-bold">Did you hear the test sound?</p>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setSpeakerStatus('Passed');
                                setShowSpeakerQuestion(false);
                              }}
                              className="flex items-center gap-1 px-4 py-2 bg-emerald-500 text-white text-xs font-bold rounded-xl hover:bg-emerald-500/90 transition-all cursor-pointer shadow-md shadow-emerald-500/20"
                            >
                              <Check className="w-3.5 h-3.5" />
                              Yes, I Heard It
                            </button>
                            <button
                              type="button"
                              onClick={playSpeakerTestSound}
                              className="px-4 py-2 bg-slate-200 dark:bg-white/5 text-slate-700 dark:text-slate-350 text-xs font-bold rounded-xl hover:bg-slate-300 dark:hover:bg-white/10 transition-all cursor-pointer border border-slate-300 dark:border-white/10"
                            >
                              Play Again
                            </button>
                          </div>
                        </div>
                      )}

                      {speakerStatus === 'Passed' && (
                        <p className="text-xs text-emerald-500 font-bold">
                          Speaker check successful! Output verified.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Navigation Controls */}
          <div className="flex justify-end items-center pt-6 mt-6 border-t border-slate-200/40 dark:border-white/5">
            <button
              type="button"
              disabled={!isEverythingPassed}
              onClick={() => navigate('/self-introduction')}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-brand-purple to-brand-indigo hover:brightness-110 shadow-lg shadow-brand-purple/20 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue to Interview
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
        
      </div>
    </div>
  );
};
