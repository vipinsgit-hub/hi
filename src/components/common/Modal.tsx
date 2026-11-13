import React, { useEffect } from 'react';
import { cn } from '@/utils/cn';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  className,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 pb-safe">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal Dialog Content */}
      <div
        className={cn(
          'relative w-full max-w-md rounded-2xl bg-bg-panel border border-border-subtle p-4 sm:p-6 shadow-panel animate-slide-up z-10 max-h-[88dvh] flex flex-col',
          className
        )}
      >
        <div className="flex items-start justify-between mb-3 sm:mb-4 flex-shrink-0">
          <div>
            {title && <h3 className="text-base sm:text-lg font-semibold text-text-primary tracking-tight">{title}</h3>}
            {description && <p className="text-xs text-text-secondary mt-0.5">{description}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary active:bg-bg-elevated transition-colors touch-manipulation min-w-[32px] min-h-[32px] flex items-center justify-center -mr-1 -mt-1"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};
