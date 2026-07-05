import React, { forwardRef, useState } from 'react';
import { type LucideIcon, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: LucideIcon;
  error?: string;
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, icon: Icon, error, type, className = '', id, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const hasValue = props.value !== undefined && props.value !== '';

    const isPassword = type === 'password';
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

    return (
      <div className="relative w-full mb-5 text-left">
        {/* Label */}
        <label
          htmlFor={id}
          className={`absolute left-10 transition-all duration-200 pointer-events-none z-10
            ${isFocused || hasValue || props.defaultValue
              ? 'top-2 text-xs font-semibold text-brand-purple dark:text-brand-purple'
              : 'top-1/2 -translate-y-1/2 text-sm text-slate-400 dark:text-slate-500'
            }`}
        >
          {label}
        </label>

        {/* Input Wrapper */}
        <div className="relative flex items-center">
          {/* Prefix Icon */}
          {Icon && (
            <div className="absolute left-3.5 text-slate-400 dark:text-slate-500">
              <Icon className="w-5 h-5" />
            </div>
          )}

          {/* Core Input Field */}
          <input
            {...props}
            id={id}
            type={inputType}
            ref={ref}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            className={`w-full py-4.5 pl-11 pr-11 bg-slate-50/60 dark:bg-white/3 border transition-all duration-200 rounded-xl font-medium text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:bg-white dark:focus:bg-black/30 placeholder-transparent
              ${error
                ? 'border-rose-500/80 dark:border-rose-500/50 focus:ring-2 focus:ring-rose-500/20'
                : 'border-slate-200/80 dark:border-white/10 focus:border-brand-purple dark:focus:border-brand-purple focus:ring-4 focus:ring-brand-purple/10'
              }
              ${className}`}
            placeholder={label}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? `${id}-error` : undefined}
          />

          {/* Suffix Action Icon (Password Eye or custom actions) */}
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 flex items-center justify-center p-1 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-purple/20 cursor-pointer"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          )}
        </div>

        {/* Error Validation Message */}
        <AnimatePresence>
          {error && (
            <motion.p
              id={`${id}-error`}
              role="alert"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              className="mt-1.5 ml-1 text-xs font-semibold text-rose-500 flex items-center gap-1"
            >
              <span>●</span> {error}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

FormInput.displayName = 'FormInput';
