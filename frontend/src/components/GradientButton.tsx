import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';

interface GradientButtonProps extends HTMLMotionProps<'button'> {
  isLoading?: boolean;
  variant?: 'primary' | 'secondary' | 'glass';
  fullWidth?: boolean;
}

export const GradientButton: React.FC<GradientButtonProps> = ({
  children,
  isLoading = false,
  variant = 'primary',
  fullWidth = true,
  className = '',
  disabled,
  ...props
}) => {
  const isButtonDisabled = disabled || isLoading;

  const baseStyles = 'relative flex items-center justify-center py-4 px-6 rounded-xl font-bold text-sm tracking-wide transition-all duration-200 focus:outline-none focus-ring cursor-pointer select-none';
  
  const widthStyles = fullWidth ? 'w-full' : '';

  const variantStyles = {
    primary: 'bg-gradient-to-r from-brand-purple to-brand-indigo hover:from-brand-purple/95 hover:to-brand-indigo/95 text-white shadow-lg shadow-brand-purple/20 dark:shadow-brand-purple/10 border-0',
    secondary: 'bg-slate-800 dark:bg-slate-200 hover:bg-slate-900 dark:hover:bg-white text-white dark:text-slate-950 border-0',
    glass: 'bg-white/5 dark:bg-black/10 border border-slate-200/50 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-100/50 dark:hover:bg-white/5',
  };

  return (
    <motion.button
      {...props}
      disabled={isButtonDisabled}
      whileHover={isButtonDisabled ? {} : { scale: 1.01, y: -0.5 }}
      whileTap={isButtonDisabled ? {} : { scale: 0.99, y: 0.5 }}
      className={`
        ${baseStyles}
        ${widthStyles}
        ${variantStyles[variant]}
        ${isButtonDisabled ? 'opacity-60 cursor-not-allowed' : ''}
        ${className}
      `}
    >
      {/* Loading state overlay */}
      {isLoading ? (
        <div className="flex items-center justify-center gap-2">
          <svg
            className="animate-spin -ml-1 mr-3 h-5 w-5 text-current"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>Processing...</span>
        </div>
      ) : (
        children
      )}
    </motion.button>
  );
};
