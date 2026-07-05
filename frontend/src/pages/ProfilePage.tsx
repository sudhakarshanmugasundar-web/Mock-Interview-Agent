import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, FileText, Save, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

import { useTheme } from '../context/ThemeContext';
import { useToast } from '../components/Toast';
import { useInterviewStore } from '../store/interviewStore';

export const ProfilePage: React.FC = () => {
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { profile, fetchProfile, updateProfile, uploadResume, isLoading } = useInterviewStore();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [bio, setBio] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (profile) {
      setFirstName(profile.firstName || '');
      setLastName(profile.lastName || '');
      setBio(profile.bio || '');
    }
  }, [profile]);

  const getFileNameFromUrl = (url: string) => {
    if (!url) return '';
    try {
      if (url.includes('filename=')) {
        const parts = url.split('filename=');
        return decodeURIComponent(parts[1]);
      }
      const parsed = new URL(url, window.location.origin);
      const filename = parsed.searchParams.get('filename');
      return filename ? decodeURIComponent(filename) : 'resume.pdf';
    } catch {
      return 'resume.pdf';
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('File size must be under 5MB.', 'error');
      return;
    }

    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (ext !== '.pdf' && ext !== '.docx') {
      showToast('Only PDF and DOCX files are allowed.', 'error');
      return;
    }

    setIsUploading(true);
    try {
      await uploadResume(file);
      showToast('Resume uploaded successfully!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to upload resume', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateProfile({
        firstName,
        lastName,
        bio,
        resumeUrl: profile?.resumeUrl || ''
      });
      showToast('Profile updated successfully!', 'success');
      navigate('/dashboard');
    } catch (err: any) {
      showToast(err.message || 'Failed to update profile', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto text-left">

        {/* Form Container */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-8 md:p-10 rounded-3xl border shadow-xl backdrop-blur-2xl
            ${darkMode ? 'bg-dark-card border-white/8 glass-panel' : 'bg-light-card border-slate-200/50 glass-panel-light'}`}
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-brand-purple/15 text-brand-purple flex items-center justify-center">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-display font-extrabold text-2xl">Candidate Profile</h1>
              <p className="text-sm text-slate-400 dark:text-slate-500">Provide resume and bio details for targeted AI mock questions.</p>
            </div>
          </div>

          {isLoading && !profile ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-brand-purple mb-4" />
              <p className="text-sm text-slate-400">Loading profile data...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">First Name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    maxLength={100}
                    placeholder="Jane"
                    className={`w-full px-4 py-3 rounded-xl border font-semibold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-brand-purple/35
                      ${darkMode ? 'bg-white/5 border-white/8 text-white focus:bg-white/8' : 'bg-slate-50 border-slate-200/50 text-slate-800 focus:bg-white'}`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    maxLength={100}
                    placeholder="Doe"
                    className={`w-full px-4 py-3 rounded-xl border font-semibold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-brand-purple/35
                      ${darkMode ? 'bg-white/5 border-white/8 text-white focus:bg-white/8' : 'bg-slate-50 border-slate-200/50 text-slate-800 focus:bg-white'}`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">Resume (PDF or DOCX, max 5MB)</label>
                
                {profile?.resumeUrl ? (
                  <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border font-semibold text-sm
                    ${darkMode ? 'bg-white/5 border-white/8 text-white' : 'bg-slate-50 border-slate-200/50 text-slate-800'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-brand-purple/15 text-brand-purple flex items-center justify-center">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">Uploaded File</div>
                        <div className="text-sm font-bold truncate max-w-xs sm:max-w-md">
                          {getFileNameFromUrl(profile.resumeUrl)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <a
                        href={profile.resumeUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 sm:flex-none text-center px-4 py-2 rounded-xl text-xs font-bold bg-brand-purple/10 hover:bg-brand-purple/20 text-brand-purple border border-brand-purple/20 transition-all cursor-pointer focus-ring"
                      >
                        View Resume
                      </a>
                      <button
                        type="button"
                        onClick={() => document.getElementById('replace-resume-input')?.click()}
                        className="flex-1 sm:flex-none text-center px-4 py-2 rounded-xl text-xs font-bold bg-slate-200 hover:bg-slate-300 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-slate-300 transition-all cursor-pointer focus-ring"
                      >
                        Replace Resume
                      </button>
                      <input
                        id="replace-resume-input"
                        type="file"
                        accept=".pdf,.docx"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 transition-all
                      ${darkMode ? 'border-white/15 bg-white/2' : 'border-slate-300 bg-slate-50'}`}
                    >
                      <div className="flex flex-col items-center justify-center text-center">
                        <FileText className="w-8 h-8 text-slate-400 dark:text-slate-500 mb-2" />
                        <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Click to upload your resume</span>
                        <span className="text-xs text-slate-400 dark:text-slate-500 mt-1">PDF or DOCX only (Max 5MB)</span>
                      </div>
                      <input
                        type="file"
                        accept=".pdf,.docx"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
                {isUploading && (
                  <div className="flex items-center gap-2 mt-2 text-xs text-brand-purple font-bold">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Uploading file...</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">Bio / Core Skills Summary</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={1000}
                  rows={5}
                  placeholder="Senior Java Engineer with 5+ years experience building microservices using Spring Boot, JPA, MySQL, and Kubernetes..."
                  className={`w-full px-4 py-3 rounded-xl border font-semibold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-brand-purple/35 resize-none
                    ${darkMode ? 'bg-white/5 border-white/8 text-white focus:bg-white/8' : 'bg-slate-50 border-slate-200/50 text-slate-800 focus:bg-white'}`}
                />
                <div className="flex justify-between mt-1 text-[10px] text-slate-400 font-bold">
                  <span>Describe your skills clearly to receive highly relevant questions.</span>
                  <span>{bio.length}/1000 chars</span>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={isSaving || isUploading}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm tracking-wide text-white bg-gradient-to-r from-brand-purple to-brand-indigo hover:brightness-110 shadow-lg shadow-brand-purple/20 transition-all cursor-pointer focus-ring disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Profile...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
  );
};
