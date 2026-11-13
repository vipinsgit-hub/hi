import React from 'react';
import { cn } from '@/utils/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', label, error, helperText, leftIcon, rightIcon, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-medium text-text-secondary select-none">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 text-text-muted pointer-events-none flex items-center">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            type={type}
            ref={ref}
            className={cn(
              'w-full h-11 sm:h-10 rounded-xl bg-bg-panel border text-base sm:text-sm text-text-primary placeholder:text-text-muted/60 transition-colors',
              'focus:outline-none focus:ring-1 focus:ring-accent/40 focus:border-border-highlight',
              leftIcon ? 'pl-10' : 'pl-3.5',
              rightIcon ? 'pr-10' : 'pr-3.5',
              error ? 'border-danger/60 focus:border-danger focus:ring-danger/30' : 'border-border-subtle',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-2.5 flex items-center text-text-muted">
              {rightIcon}
            </div>
          )}
        </div>
        {error ? (
          <p className="text-xs text-danger animate-fade-in">{error}</p>
        ) : helperText ? (
          <p className="text-[11px] sm:text-xs text-text-muted">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
