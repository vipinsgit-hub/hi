import React from 'react';
import { cn } from '@/utils/cn';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'accent' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled,
      leftIcon,
      rightIcon,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98] rounded-xl';

    const variants = {
      primary:
        'bg-[#F5F5F5] text-[#090909] hover:bg-[#E5E5E5] active:bg-[#D4D4D4] font-semibold shadow-sm',
      accent:
        'bg-accent text-white hover:bg-accent-hover shadow-sm',
      secondary:
        'bg-bg-panel hover:bg-bg-elevated text-text-primary border border-border-subtle hover:border-border-highlight',
      ghost:
        'bg-transparent hover:bg-bg-panel text-text-secondary hover:text-text-primary',
      danger:
        'bg-danger-subtle text-danger border border-danger/20 hover:bg-danger/20 hover:border-danger/40',
    };

    const sizes = {
      sm: 'h-8 px-3 text-xs gap-1.5',
      md: 'h-10 px-4 text-sm gap-2',
      lg: 'h-12 px-5 text-base gap-2.5',
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current" />
        ) : (
          leftIcon
        )}
        {children}
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';

