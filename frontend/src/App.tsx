import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './components/Toast';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProfilePage } from './pages/ProfilePage';
import { InterviewPage } from './pages/InterviewPage';
import { ResultPage } from './pages/ResultPage';
import { SelfIntroductionPage } from './pages/SelfIntroductionPage';
import { SystemCheckPage } from './pages/SystemCheckPage';
import { SidebarLayout } from './components/SidebarLayout';
import { ComingSoonPage } from './pages/ComingSoonPage';
import { ResumeAnalyzerPage } from './pages/ResumeAnalyzerPage';
import { HistoryPage } from './pages/HistoryPage';
import { MockInterviewPage } from './pages/MockInterviewPage';
import { useAuthStore } from './store/authStore';

function App() {
  const { loadStoredAuth } = useAuthStore();

  useEffect(() => {
    // Attempt to hydrate credentials from cache on initial boot
    loadStoredAuth();
  }, [loadStoredAuth]);

  return (
    <ThemeProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            <Route element={<SidebarLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/resume-analyzer" element={<ResumeAnalyzerPage />} />
              <Route path="/mock-interviews" element={<MockInterviewPage />} />
              <Route path="/hr-interview" element={<Navigate to="/mock-interviews" replace />} />
              <Route path="/technical-interview" element={<Navigate to="/mock-interviews" replace />} />
              <Route path="/coding-interview" element={<Navigate to="/mock-interviews" replace />} />
              <Route path="/interview-history" element={<HistoryPage />} />
              <Route path="/ai-feedback" element={<ComingSoonPage title="AI Feedback" />} />
              <Route path="/reports" element={<ComingSoonPage title="Reports" />} />
              <Route path="/progress-analytics" element={<ComingSoonPage title="Progress Analytics" />} />
              <Route path="/achievements" element={<ComingSoonPage title="Achievements" />} />
              <Route path="/practice-center" element={<ComingSoonPage title="Practice Center" />} />
              <Route path="/settings" element={<ComingSoonPage title="Settings" />} />
            </Route>
            
            <Route path="/system-check" element={<SystemCheckPage />} />
            <Route path="/self-introduction" element={<SelfIntroductionPage />} />
            <Route path="/interview" element={<InterviewPage />} />
            <Route path="/result/:sessionId" element={<ResultPage />} />
            
            {/* Catch-all redirect to login */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
