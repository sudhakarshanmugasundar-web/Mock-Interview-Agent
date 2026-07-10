import { create } from 'zustand';
import { axiosClient } from '../api/axiosClient';
import type { UserProfileRequest, UserProfileResponse } from '../types/profile';
import type {
  InterviewSessionResponse,
  InterviewStatisticsResponse,
  QuestionResponse,
  FeedbackResponse,
  SessionResultResponse
} from '../types/interview';

interface InterviewState {
  profile: UserProfileResponse | null;
  activeSession: InterviewSessionResponse | null;
  currentQuestion: QuestionResponse | null;
  statistics: InterviewStatisticsResponse | null;
  history: InterviewSessionResponse[];
  feedback: FeedbackResponse[];
  result: SessionResultResponse | null;
  isLoading: boolean;
  error: string | null;

  fetchProfile: () => Promise<void>;
  updateProfile: (request: UserProfileRequest) => Promise<void>;
  uploadResume: (file: File) => Promise<void>;
  uploadAudio: (file: Blob) => Promise<string>;
  fetchStatistics: () => Promise<void>;
  fetchHistory: (page?: number, size?: number) => Promise<void>;
  createSession: (title: string, type: string, difficulty: string) => Promise<InterviewSessionResponse>;
  startSession: (id: number) => Promise<void>;
  pauseSession: (id: number) => Promise<void>;
  resumeSession: (id: number) => Promise<void>;
  completeSession: (id: number) => Promise<void>;
  cancelSession: (id: number) => Promise<void>;
  fetchCurrentSession: () => Promise<void>;
  fetchNextQuestion: (sessionId: number) => Promise<void>;
  submitAnswer: (sessionId: number, answerText: string, mode?: string, time?: number, audioPath?: string) => Promise<FeedbackResponse>;
  fetchFeedback: (sessionId: number) => Promise<void>;
  fetchResult: (sessionId: number) => Promise<void>;
  saveSelfIntroductionDraft: (sessionId: number, answerText: string) => Promise<void>;
  submitSelfIntroduction: (sessionId: number, answerText: string) => Promise<void>;
  clearActiveSession: () => void;
}

export const useInterviewStore = create<InterviewState>((set, get) => ({
  profile: null,
  activeSession: null,
  currentQuestion: null,
  statistics: null,
  history: [],
  feedback: [],
  result: null,
  isLoading: false,
  error: null,

  fetchProfile: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosClient.get<UserProfileResponse>('/users/profile');
      set({ profile: response.data, isLoading: false });
    } catch (err: any) {
      set({ isLoading: false, error: err.response?.data?.message || err.message });
    }
  },

  updateProfile: async (request) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosClient.put<UserProfileResponse>('/users/profile', request);
      set({ profile: response.data, isLoading: false });
    } catch (err: any) {
      set({ isLoading: false, error: err.response?.data?.message || err.message });
      throw err;
    }
  },

  uploadResume: async (file: File) => {
    set({ isLoading: true, error: null });
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await axiosClient.post<UserProfileResponse>('/users/profile/resume', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      set({ profile: response.data, isLoading: false });
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message;
      set({ isLoading: false, error: errMsg });
      throw new Error(errMsg);
    }
  },

  uploadAudio: async (file: Blob) => {
    set({ isLoading: true, error: null });
    try {
      const formData = new FormData();
      formData.append('file', file, 'recording.mp3');
      const response = await axiosClient.post<{ audioPath: string }>('/interviews/audio', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      set({ isLoading: false });
      return response.data.audioPath;
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message;
      set({ isLoading: false, error: errMsg });
      throw new Error(errMsg);
    }
  },

  fetchStatistics: async () => {
    try {
      const response = await axiosClient.get<InterviewStatisticsResponse>('/interviews/statistics');
      set({ statistics: response.data });
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message });
    }
  },

  fetchHistory: async (page = 0, size = 10) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosClient.get('/interviews/history', { params: { page, size } });
      set({ history: response.data.sessions, isLoading: false });
    } catch (err: any) {
      set({ isLoading: false, error: err.response?.data?.message || err.message });
    }
  },

  createSession: async (title, type, difficulty) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosClient.post<InterviewSessionResponse>('/interviews/create', {
        title,
        interviewType: type,
        difficulty
      });
      set({ activeSession: response.data, currentQuestion: null, feedback: [], result: null, isLoading: false });
      return response.data;
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message;
      set({ isLoading: false, error: errMsg });
      throw new Error(errMsg);
    }
  },

  startSession: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosClient.post<InterviewSessionResponse>(`/interviews/start/${id}`);
      set({ activeSession: response.data, isLoading: false });
    } catch (err: any) {
      set({ isLoading: false, error: err.response?.data?.message || err.message });
      throw err;
    }
  },

  pauseSession: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosClient.post<InterviewSessionResponse>(`/interviews/pause/${id}`);
      set({ activeSession: response.data, isLoading: false });
    } catch (err: any) {
      set({ isLoading: false, error: err.response?.data?.message || err.message });
      throw err;
    }
  },

  resumeSession: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosClient.post<InterviewSessionResponse>(`/interviews/resume/${id}`);
      set({ activeSession: response.data, isLoading: false });
    } catch (err: any) {
      set({ isLoading: false, error: err.response?.data?.message || err.message });
      throw err;
    }
  },

  completeSession: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosClient.post<InterviewSessionResponse>(`/interviews/complete/${id}`);
      set({ activeSession: response.data, isLoading: false });
    } catch (err: any) {
      set({ isLoading: false, error: err.response?.data?.message || err.message });
      throw err;
    }
  },

  cancelSession: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosClient.post<InterviewSessionResponse>(`/interviews/cancel/${id}`);
      set({ activeSession: response.data, isLoading: false });
    } catch (err: any) {
      set({ isLoading: false, error: err.response?.data?.message || err.message });
      throw err;
    }
  },

  fetchCurrentSession: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosClient.get<InterviewSessionResponse>('/interviews/current');
      set({ activeSession: response.data, isLoading: false });
    } catch (err: any) {
      set({ activeSession: null, isLoading: false });
    }
  },

  fetchNextQuestion: async (sessionId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosClient.get<QuestionResponse>(`/interviews/${sessionId}/next-question`);
      set({ currentQuestion: response.data, isLoading: false });
    } catch (err: any) {
      set({ isLoading: false, error: err.response?.data?.message || err.message });
      throw err;
    }
  },

  submitAnswer: async (sessionId, answerText, mode = 'TEXT', time = 0, audioPath = '') => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosClient.post<FeedbackResponse>(`/interviews/${sessionId}/answer`, {
        answerText,
        answerMode: mode,
        responseTime: time,
        audioPath: audioPath
      });
      get().fetchFeedback(sessionId);
      set({ currentQuestion: null, isLoading: false });
      return response.data;
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message;
      set({ isLoading: false, error: errMsg });
      throw new Error(errMsg);
    }
  },

  fetchFeedback: async (sessionId) => {
    try {
      const response = await axiosClient.get<FeedbackResponse[]>(`/interviews/${sessionId}/feedback`);
      set({ feedback: response.data });
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message });
    }
  },

  fetchResult: async (sessionId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosClient.get<SessionResultResponse>(`/interviews/${sessionId}/result`);
      set({ result: response.data, isLoading: false });
    } catch (err: any) {
      set({ isLoading: false, error: err.response?.data?.message || err.message });
    }
  },

  clearActiveSession: () => set({ activeSession: null, currentQuestion: null, feedback: [], result: null }),

  saveSelfIntroductionDraft: async (sessionId, answerText) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosClient.put<InterviewSessionResponse>(`/interviews/${sessionId}/self-introduction/draft`, answerText, {
        headers: { 'Content-Type': 'text/plain' }
      });
      set({ activeSession: response.data, isLoading: false });
    } catch (err: any) {
      set({ isLoading: false, error: err.response?.data?.message || err.message });
      throw err;
    }
  },

  submitSelfIntroduction: async (sessionId, answerText) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosClient.post<InterviewSessionResponse>(`/interviews/${sessionId}/self-introduction/submit`, answerText, {
        headers: { 'Content-Type': 'text/plain' }
      });
      set({ activeSession: response.data, isLoading: false });
    } catch (err: any) {
      set({ isLoading: false, error: err.response?.data?.message || err.message });
      throw err;
    }
  },
}));
