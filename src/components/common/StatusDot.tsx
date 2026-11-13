import React from 'react';
import { cn } from '@/utils/cn';

interface StatusDotProps {
  isOnline: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusDot: React.FC<StatusDotProps> = ({ isOnline, className, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
  };

  return (
    <span className={cn('relative inline-flex flex-shrink-0 items-center justify-center', className)}>
      {isOnline && (
        <span
          className={cn(
            'absolute inline-flex rounded-full bg-emerald-500 opacity-75 animate-ping',
            sizeClasses[size]
          )}
        />
      )}
      <span
        className={cn(
          'relative inline-flex rounded-full transition-colors duration-300',
          sizeClasses[size],
          isOnline ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-text-muted/60'
        )}
      />
    </span>
  );
};

