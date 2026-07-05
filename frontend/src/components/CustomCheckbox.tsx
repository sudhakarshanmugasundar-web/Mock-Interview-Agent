import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';

interface CustomCheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const CustomCheckbox = forwardRef<HTMLInputElement, CustomCheckboxProps>(
  ({ label, id, className = '', ...props }, ref) => {
    return (
      <label className="flex items-center gap-2.5 cursor-pointer select-none text-sm font-medium text-slate-600 dark:text-slate-400 group">
        <div className="relative">
          <input
            {...props}
            type="checkbox"
            id={id}
            ref={ref}
            className="sr-only peer"
          />
          {/* Box backdrop */}
          <div className="w-5 h-5 rounded-lg border border-slate-300 dark:border-white/10 bg-slate-100/50 dark:bg-white/5 transition-all duration-200 peer-checked:border-brand-purple peer-checked:bg-brand-purple/10 peer-focus-visible:ring-2 peer-focus-visible:ring-brand-purple/30 group-hover:border-slate-400 dark:group-hover:border-slate-500" />
          
          {/* Checkmark icon using Framer Motion */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-brand-purple dark:text-brand-purple">
            <svg
              className="w-3.5 h-3.5"
              viewBox="0 0 12 10"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <motion.path
                initial={{ pathLength: 0 }}
                animate={{ pathLength: props.checked || (props as any).defaultChecked ? 1 : 0 }}
                transition={{ duration: 0.2 }}
                d="M1 5l3.5 3.5L11 1"
              />
            </svg>
          </div>
        </div>
        <span>{label}</span>
      </label>
    );
  }
);

CustomCheckbox.displayName = 'CustomCheckbox';
