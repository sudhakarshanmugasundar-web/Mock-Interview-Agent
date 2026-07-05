import { create } from 'zustand';
import { axiosClient } from '../api/axiosClient';
import type { ResumeAnalysis } from '../types/resume';

interface ResumeState {
  analysis: ResumeAnalysis | null;
  isLoading: boolean;
  error: string | null;

  fetchLatestAnalysis: () => Promise<void>;
  analyzeResume: (file: File) => Promise<ResumeAnalysis>;
  generateNewResume: (corrections: Record<string, string>) => Promise<{ pdfUrl: string; docxUrl: string }>;
  clearAnalysis: () => void;
}

export const useResumeStore = create<ResumeState>((set) => ({
  analysis: null,
  isLoading: false,
  error: null,

  fetchLatestAnalysis: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosClient.get<ResumeAnalysis>('/resumes/latest');
      if (response.status === 204) {
        set({ analysis: null, isLoading: false });
      } else {
        set({ analysis: response.data, isLoading: false });
      }
    } catch (err: any) {
      set({ isLoading: false, error: err.response?.data?.message || err.message });
    }
  },

  analyzeResume: async (file: File) => {
    set({ isLoading: true, error: null });
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await axiosClient.post<ResumeAnalysis>('/resumes/analyze', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      set({ analysis: response.data, isLoading: false });
      return response.data;
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message;
      set({ isLoading: false, error: errMsg });
      throw new Error(errMsg);
    }
  },

  generateNewResume: async (corrections: Record<string, string>) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosClient.post<{ pdfUrl: string; docxUrl: string }>('/resumes/generate', corrections);
      set({ isLoading: false });
      return response.data;
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message;
      set({ isLoading: false, error: errMsg });
      throw new Error(errMsg);
    }
  },

  clearAnalysis: () => set({ analysis: null, error: null }),
}));
