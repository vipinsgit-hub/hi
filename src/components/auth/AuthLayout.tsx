import React from 'react';
import { Shield } from 'lucide-react';

interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ title, subtitle, children }) => {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-8 bg-bg-main selection:bg-accent/30 selection:text-white">
      {/* Background ambient subtle vignette */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.06),rgba(255,255,255,0))]" />

      <div className="w-full max-w-sm sm:max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-bg-panel border border-border-subtle shadow-subtle mb-4">
            <span className="text-2xl font-bold tracking-tight text-text-primary">
              HI<span className="text-accent text-3xl leading-none">.</span>
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">{title}</h1>
          {subtitle && <p className="text-sm text-text-secondary mt-1.5">{subtitle}</p>}
        </div>

        {/* Auth Card */}
        <div className="bg-bg-secondary border border-border-subtle rounded-2xl p-6 sm:p-8 shadow-panel backdrop-blur-sm">
          {children}
        </div>

        {/* Security / Privacy Assurance footer */}
        <div className="flex items-center justify-center gap-1.5 mt-8 text-xs text-text-muted">
          <Shield className="w-3.5 h-3.5 text-text-muted" />
          <span>Private two-person authenticated communication</span>
        </div>
      </div>
    </div>
  );
};

