import React from 'react';
import { cn } from '@/utils/cn';
import { StatusDot } from './StatusDot';

interface AvatarProps {
  name: string;
  avatarUrl?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isOnline?: boolean;
  showStatus?: boolean;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  avatarUrl,
  size = 'md',
  isOnline,
  showStatus = false,
  className,
}) => {
  const getInitials = (str: string) => {
    if (!str) return 'HI';
    const parts = str.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm font-medium',
    lg: 'w-12 h-12 text-base font-semibold',
    xl: 'w-16 h-16 text-lg font-semibold',
  };

  return (
    <div className={cn('relative inline-block flex-shrink-0 select-none', className)}>
      <div
        className={cn(
          'flex items-center justify-center rounded-full overflow-hidden border border-border-subtle bg-bg-panel text-text-primary transition-all',
          sizeClasses[size]
        )}
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
        ) : (
          <span className="tracking-tight text-text-primary/90">{getInitials(name)}</span>
        )}
      </div>

      {showStatus && isOnline !== undefined && (
        <div className="absolute -bottom-0.5 -right-0.5 rounded-full bg-bg-main p-0.5">
          <StatusDot isOnline={isOnline} size={size === 'sm' ? 'sm' : 'md'} />
        </div>
      )}
    </div>
  );
};

