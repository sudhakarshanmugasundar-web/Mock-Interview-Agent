import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { Mail, Lock, Sparkles, Terminal, Award } from 'lucide-react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { z } from 'zod';

import { useTheme } from '../context/ThemeContext';
import { useToast } from '../components/Toast';
import { useAuthStore } from '../store/authStore';
import { FormInput } from '../components/FormInput';
import { CustomCheckbox } from '../components/CustomCheckbox';
import { GradientButton } from '../components/GradientButton';
import { CanvasParticles } from '../components/CanvasParticles';
import { ThemeToggle } from '../components/ThemeToggle';

// 1. Zod Validation Schema
const loginSchema = z.object({
  email: z
    .string()
    .min(1, { message: 'Email address is required.' })
    .email({ message: 'Please enter a valid email address.' }),
  password: z
    .string()
    .min(1, { message: 'Password is required.' })
    .min(8, { message: 'Password must be at least 8 characters long.' }),
  rememberMe: z.boolean(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const { darkMode } = useTheme();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const { login, loginSocial, isLoading, error, clearError, isAuthenticated } = useAuthStore();

  // 2. React Hook Form Setup
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange', // Validate on keystroke/change
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  // Watch fields to trigger re-renders for floating labels
  const emailValue = watch('email');
  const passwordValue = watch('password');

  // 3. Clear errors on mount
  useEffect(() => {
    clearError();
  }, [clearError]);

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  // Show session expired notification if redirected
  useEffect(() => {
    if (searchParams.get('expired') === 'true') {
      showToast('Your session has expired. Please sign in again.', 'info');
    }
  }, [searchParams, showToast]);

  // 4. Form Submit Handler
  const onSubmit = async (data: LoginFormValues) => {
    try {
      await login(data.email, data.password, data.rememberMe);
      showToast('Signed in successfully! Welcome back.', 'success');
      navigate('/dashboard');
    } catch (err: any) {
      showToast(err.message || 'Authentication failed. Please verify credentials.', 'error');
    }
  };

  // 5. Social Auth Handler (Mocked)
  const handleSocialAuth = async (provider: 'google' | 'github') => {
    try {
      // Simulate OAuth redirect or popup resolving to an OAuth token
      const mockOAuthToken = 'mock_oauth_token_xyz_123';
      await loginSocial(provider, mockOAuthToken);
      showToast(`Successfully authenticated with ${provider === 'google' ? 'Google' : 'GitHub'}!`, 'success');
      navigate('/dashboard');
    } catch (err: any) {
      showToast(`Failed to log in with ${provider}.`, 'error');
    }
  };

  return (
    <div className={`min-h-screen flex flex-col md:flex-row relative transition-colors duration-300
      ${darkMode ? 'bg-dark-bg bg-gradient-mesh text-slate-100' : 'bg-light-bg bg-gradient-mesh-light text-slate-900'}`}
    >
      {/* Floating Theme Toggle (Top Right) */}
      <div className="absolute top-6 right-6 z-30">
        <ThemeToggle />
      </div>

      {/* LEFT PANEL: Branding & Highlights (Hidden on Mobile/Tablet stack) */}
      <div className="hidden lg:flex lg:w-3/5 p-12 relative flex-col justify-between overflow-hidden border-r border-slate-200/10 select-none">
        {/* Canvas Particle Field */}
        <CanvasParticles darkMode={darkMode} />

        {/* Top Section: Brand Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-purple to-brand-indigo flex items-center justify-center text-white shadow-md shadow-brand-purple/20">
            <Terminal className="w-5 h-5" />
          </div>
          <span className="font-display font-extrabold text-xl tracking-tight bg-gradient-to-r from-brand-purple to-brand-indigo bg-clip-text text-transparent">
            Mock Interview Agent
          </span>
        </div>

        {/* Middle Section: Hero Text & Highlights */}
        <div className="relative z-10 my-auto max-w-xl text-left">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide uppercase bg-brand-purple/10 text-brand-purple border border-brand-purple/20 mb-6">
              <Sparkles className="w-3.5 h-3.5" /> Next-Gen Interview Preparation
            </span>
            <h1 className="font-display font-extrabold text-5xl leading-tight tracking-tight mb-6 bg-gradient-to-r from-slate-950 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              Master Every <br />
              <span className="bg-gradient-to-r from-brand-purple via-brand-indigo to-brand-pink bg-clip-text text-transparent">
                Interview with AI.
              </span>
            </h1>
            <p className="text-base text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-8">
              Practice HR and core technical interviews under simulated workspace environments. Receive real-time insights, metrics and path recommendations to land your dream placement.
            </p>
          </motion.div>

          {/* Highlights grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="p-5 rounded-2xl bg-white/5 dark:bg-white/3 border border-slate-200/10 dark:border-white/5 backdrop-blur-md"
            >
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-500 flex items-center justify-center mb-3">
                <Terminal className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm mb-1.5 text-slate-800 dark:text-slate-100">Coding Simulator</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">Solve real problems with live compilation insights.</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="p-5 rounded-2xl bg-white/5 dark:bg-white/3 border border-slate-200/10 dark:border-white/5 backdrop-blur-md"
            >
              <div className="w-8 h-8 rounded-lg bg-brand-purple/10 dark:bg-brand-purple/20 text-brand-purple flex items-center justify-center mb-3">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm mb-1.5 text-slate-800 dark:text-slate-100">AI Voice Agent</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">Interactive voice chats mirroring corporate managers.</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="p-5 rounded-2xl bg-white/5 dark:bg-white/3 border border-slate-200/10 dark:border-white/5 backdrop-blur-md"
            >
              <div className="w-8 h-8 rounded-lg bg-pink-500/10 dark:bg-pink-500/20 text-pink-500 flex items-center justify-center mb-3">
                <Award className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm mb-1.5 text-slate-800 dark:text-slate-100">Performance Matrix</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">Detailed feedback reports on grammar, logic, and structure.</p>
            </motion.div>
          </div>
        </div>

        {/* Bottom Section: Premium Testimonial Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="relative z-10 p-5 rounded-2xl glass-panel dark:bg-white/3 text-left max-w-lg mt-8"
        >
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 italic mb-3">
            "The AI agent asked deep structural follow-ups that felt identical to a engineering director round. It polished my phrasing and helped me secure an offer at Google."
          </p>
          <div className="flex items-center gap-3">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop&crop=faces"
              alt="Candidate Portrait"
              className="w-8 h-8 rounded-full border border-brand-purple/30 object-cover"
            />
            <div>
              <h4 className="font-bold text-xs text-slate-800 dark:text-slate-100">Sarah Jenkins</h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">Frontend Lead at Google</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* RIGHT PANEL: Auth Card Form */}
      <div className="w-full lg:w-2/5 flex flex-col justify-center px-6 py-12 md:p-12 relative z-20">
        {/* Mobile Brand Title Header (Hidden on large displays) */}
        <div className="lg:hidden flex flex-col items-center mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-purple to-brand-indigo flex items-center justify-center text-white mb-3 shadow-md shadow-brand-purple/20">
            <Terminal className="w-5 h-5" />
          </div>
          <span className="font-display font-extrabold text-lg tracking-tight bg-gradient-to-r from-brand-purple to-brand-indigo bg-clip-text text-transparent mb-1">
            Mock Interview Agent
          </span>
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">"Master Every Interview with AI."</p>
        </div>

        {/* Centered Auth Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={`w-full max-w-md mx-auto p-8 rounded-3xl border backdrop-blur-2xl shadow-2xl text-left
            ${darkMode 
              ? 'bg-dark-card border-white/8 glass-panel' 
              : 'bg-light-card border-slate-200/50 glass-panel-light'}`}
        >
          {/* Card Headers */}
          <div className="mb-8">
            <h2 className="font-display font-extrabold text-2xl tracking-tight text-slate-900 dark:text-white mb-2">
              Welcome back
            </h2>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Sign in to resume your placement preparations.
            </p>
          </div>

          {/* Core Login Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email Field */}
            <FormInput
              {...register('email')}
              label="Email Address"
              type="email"
              id="email"
              icon={Mail}
              error={errors.email?.message}
              value={emailValue}
              disabled={isLoading}
              autoComplete="email"
            />

            {/* Password Field */}
            <FormInput
              {...register('password')}
              label="Password"
              type="password"
              id="password"
              icon={Lock}
              error={errors.password?.message}
              value={passwordValue}
              disabled={isLoading}
              autoComplete="current-password"
            />

            {/* Remember Me & Forgot Password Row */}
            <div className="flex items-center justify-between text-xs font-semibold select-none pt-1">
              <CustomCheckbox
                {...register('rememberMe')}
                label="Remember Me"
                id="rememberMe"
                disabled={isLoading}
              />
              <a
                href="#forgot-password"
                onClick={(e) => {
                  e.preventDefault();
                  showToast('Password reset mail sent to your registered email (Simulated).', 'info');
                }}
                className="text-brand-purple hover:text-brand-purple/85 focus:outline-none focus:underline"
              >
                Forgot Password?
              </a>
            </div>

            {/* Login Error Notification Banner */}
            {error && (
              <div className="p-3.5 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-500 font-semibold text-xs text-center leading-relaxed">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <GradientButton
              type="submit"
              isLoading={isLoading}
              disabled={!isValid}
              className="mt-6"
            >
              Sign In
            </GradientButton>
          </form>

          {/* Social Sign-In Divider */}
          <div className="relative my-6 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200/50 dark:border-white/10" />
            </div>
            <span className="relative px-4 text-[10px] font-bold tracking-wider uppercase text-slate-400 dark:text-slate-500 bg-transparent">
              Or continue with
            </span>
          </div>

          {/* Social Authentication Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Google Login */}
            <GradientButton
              variant="glass"
              type="button"
              disabled={isLoading}
              onClick={() => handleSocialAuth('google')}
              className="!py-3"
            >
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  fill="#EA4335"
                />
              </svg>
              Google
            </GradientButton>

            {/* GitHub Login */}
            <GradientButton
              variant="glass"
              type="button"
              disabled={isLoading}
              onClick={() => handleSocialAuth('github')}
              className="!py-3"
            >
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
              </svg>
              GitHub
            </GradientButton>
          </div>

          {/* Link to Register Form */}
          <div className="mt-8 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="text-brand-purple hover:text-brand-purple/85 focus:outline-none focus:underline"
            >
              Create Account
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
