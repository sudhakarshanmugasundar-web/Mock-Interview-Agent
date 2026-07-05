import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Terminal, Sparkles, Award, ArrowLeft } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { z } from 'zod';

import { useTheme } from '../context/ThemeContext';
import { useToast } from '../components/Toast';
import { useAuthStore } from '../store/authStore';
import { FormInput } from '../components/FormInput';
import { GradientButton } from '../components/GradientButton';
import { CanvasParticles } from '../components/CanvasParticles';
import { ThemeToggle } from '../components/ThemeToggle';

// 1. Zod Registration Schema with Password Complexity Rules
const registerSchema = z
  .object({
    username: z
      .string()
      .min(3, { message: 'Username must be at least 3 characters.' })
      .max(20, { message: 'Username cannot exceed 20 characters.' })
      .regex(/^[a-zA-Z0-9_]+$/, { message: 'Usernames can only contain letters, numbers, and underscores.' }),
    email: z
      .string()
      .min(1, { message: 'Email address is required.' })
      .email({ message: 'Please enter a valid email address.' }),
    password: z
      .string()
      .min(1, { message: 'Password is required.' })
      .min(8, { message: 'Password must be at least 8 characters.' })
      .regex(/[A-Z]/, { message: 'Must contain at least one uppercase letter.' })
      .regex(/[a-z]/, { message: 'Must contain at least one lowercase letter.' })
      .regex(/[0-9]/, { message: 'Must contain at least one digit.' })
      .regex(/[^A-Za-z0-9]/, { message: 'Must contain at least one special character.' }),
    confirmPassword: z.string().min(1, { message: 'Confirm password is required.' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export const RegisterPage: React.FC = () => {
  const { darkMode } = useTheme();
  const { showToast } = useToast();
  const navigate = useNavigate();
  
  const { registerUser, isLoading, error, clearError, isAuthenticated } = useAuthStore();

  // 2. React Hook Form Setup
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: 'onChange',
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const usernameVal = watch('username');
  const emailVal = watch('email');
  const passwordVal = watch('password');
  const confirmPasswordVal = watch('confirmPassword');

  // 3. Clear errors on load
  useEffect(() => {
    clearError();
  }, [clearError]);

  // Redirect if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  // 4. Form Submit Action
  const onSubmit = async (data: RegisterFormValues) => {
    try {
      await registerUser(data.username, data.email, data.password);
      showToast('Account created successfully! Please sign in.', 'success');
      navigate('/login');
    } catch (err: any) {
      showToast(err.message || 'Registration failed. Please try again.', 'error');
    }
  };

  return (
    <div className={`min-h-screen flex flex-col md:flex-row relative transition-colors duration-300
      ${darkMode ? 'bg-dark-bg bg-gradient-mesh text-slate-100' : 'bg-light-bg bg-gradient-mesh-light text-slate-900'}`}
    >
      {/* Floating Theme Toggle */}
      <div className="absolute top-6 right-6 z-30">
        <ThemeToggle />
      </div>

      {/* LEFT PANEL (Branding Highlights) */}
      <div className="hidden lg:flex lg:w-3/5 p-12 relative flex-col justify-between overflow-hidden border-r border-slate-200/10 select-none">
        <CanvasParticles darkMode={darkMode} />

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-purple to-brand-indigo flex items-center justify-center text-white shadow-md shadow-brand-purple/20">
            <Terminal className="w-5 h-5" />
          </div>
          <span className="font-display font-extrabold text-xl tracking-tight bg-gradient-to-r from-brand-purple to-brand-indigo bg-clip-text text-transparent">
            Mock Interview Agent
          </span>
        </div>

        <div className="relative z-10 my-auto max-w-xl text-left">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide uppercase bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 mb-6">
              <Sparkles className="w-3.5 h-3.5" /> Start Your Preparation Journey
            </span>
            <h1 className="font-display font-extrabold text-5xl leading-tight tracking-tight mb-6 bg-gradient-to-r from-slate-950 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              Empower Your <br />
              <span className="bg-gradient-to-r from-brand-purple via-brand-indigo to-brand-pink bg-clip-text text-transparent">
                Career Transition.
              </span>
            </h1>
            <p className="text-base text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-8">
              Join thousands of job seekers preparing for top tech companies. Access dynamic interview simulators, automated feedback reports, and specialized roadmap tracks.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded-2xl bg-white/5 dark:bg-white/3 border border-slate-200/10 dark:border-white/5 backdrop-blur-md">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-500 flex items-center justify-center mb-3">
                <Terminal className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm mb-1.5 text-slate-800 dark:text-slate-100">Coding Simulator</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">Solve real problems with live compilation insights.</p>
            </div>
            <div className="p-5 rounded-2xl bg-white/5 dark:bg-white/3 border border-slate-200/10 dark:border-white/5 backdrop-blur-md">
              <div className="w-8 h-8 rounded-lg bg-brand-purple/10 dark:bg-brand-purple/20 text-brand-purple flex items-center justify-center mb-3">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm mb-1.5 text-slate-800 dark:text-slate-100">AI Voice Agent</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">Interactive voice chats mirroring corporate managers.</p>
            </div>
            <div className="p-5 rounded-2xl bg-white/5 dark:bg-white/3 border border-slate-200/10 dark:border-white/5 backdrop-blur-md">
              <div className="w-8 h-8 rounded-lg bg-pink-500/10 dark:bg-pink-500/20 text-pink-500 flex items-center justify-center mb-3">
                <Award className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm mb-1.5 text-slate-800 dark:text-slate-100">Performance Matrix</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">Detailed feedback reports on grammar, logic, and structure.</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 p-5 rounded-2xl glass-panel dark:bg-white/3 text-left max-w-lg mt-8">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 italic mb-3">
            "Mock Interview Agent gave me the feedback loop I needed. By the time I faced my actual interviewers, I had already practiced the exact scenarios."
          </p>
          <h4 className="font-bold text-xs text-slate-800 dark:text-slate-100">Sarah Jenkins, Frontend Lead @ Google</h4>
        </div>
      </div>

      {/* RIGHT PANEL (Register Form Card) */}
      <div className="w-full lg:w-2/5 flex flex-col justify-center px-6 py-12 md:p-12 relative z-20">
        <div className="lg:hidden flex flex-col items-center mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-purple to-brand-indigo flex items-center justify-center text-white mb-3 shadow-md shadow-brand-purple/20">
            <Terminal className="w-5 h-5" />
          </div>
          <span className="font-display font-extrabold text-lg tracking-tight bg-gradient-to-r from-brand-purple to-brand-indigo bg-clip-text text-transparent mb-1">
            Mock Interview Agent
          </span>
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">"Master Every Interview with AI."</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={`w-full max-w-md mx-auto p-8 rounded-3xl border backdrop-blur-2xl shadow-2xl text-left
            ${darkMode 
              ? 'bg-dark-card border-white/8 glass-panel' 
              : 'bg-light-card border-slate-200/50 glass-panel-light'}`}
        >
          <div className="mb-6 flex items-center gap-3">
            <Link
              to="/login"
              className="p-2 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-slate-200/50 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors focus-ring"
              aria-label="Back to login"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h2 className="font-display font-extrabold text-2xl tracking-tight text-slate-900 dark:text-white">
                Create Account
              </h2>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Username Field */}
            <FormInput
              {...register('username')}
              label="Username"
              type="text"
              id="username"
              icon={User}
              error={errors.username?.message}
              value={usernameVal}
              disabled={isLoading}
              autoComplete="username"
            />

            {/* Email Field */}
            <FormInput
              {...register('email')}
              label="Email Address"
              type="email"
              id="email"
              icon={Mail}
              error={errors.email?.message}
              value={emailVal}
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
              value={passwordVal}
              disabled={isLoading}
              autoComplete="new-password"
            />

            {/* Confirm Password Field */}
            <FormInput
              {...register('confirmPassword')}
              label="Confirm Password"
              type="password"
              id="confirmPassword"
              icon={Lock}
              error={errors.confirmPassword?.message}
              value={confirmPasswordVal}
              disabled={isLoading}
              autoComplete="new-password"
            />

            {error && (
              <div className="p-3.5 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-500 font-semibold text-xs text-center leading-relaxed animate-pulse">
                {error}
              </div>
            )}

            <GradientButton
              type="submit"
              isLoading={isLoading}
              disabled={!isValid}
              className="mt-6"
            >
              Create Account
            </GradientButton>
          </form>

          <div className="mt-8 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-brand-purple hover:text-brand-purple/85 focus:outline-none focus:underline"
            >
              Sign In
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
