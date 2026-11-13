import React from 'react';
import { ToastContainer } from '@/components/common/Toast';
import { DevBanner } from './DevBanner';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col h-[100dvh] w-full bg-bg-main text-text-primary overflow-hidden pl-safe pr-safe">
      <DevBanner />
      <ToastContainer />
      <main className="flex-1 flex flex-col w-full h-full max-w-3xl mx-auto overflow-hidden sm:border-x sm:border-border-subtle/50">
        {children}
      </main>
    </div>
  );
};
