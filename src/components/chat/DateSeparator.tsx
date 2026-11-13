import React from 'react';

interface DateSeparatorProps {
  label: string;
}

export const DateSeparator: React.FC<DateSeparatorProps> = ({ label }) => {
  return (
    <div className="flex items-center justify-center my-6 select-none">
      <div className="flex-grow h-px bg-border-subtle/50" />
      <span className="px-3 py-1 mx-4 text-[11px] font-medium tracking-wide uppercase text-text-muted bg-bg-panel/80 border border-border-subtle rounded-full backdrop-blur-sm">
        {label}
      </span>
      <div className="flex-grow h-px bg-border-subtle/50" />
    </div>
  );
};

