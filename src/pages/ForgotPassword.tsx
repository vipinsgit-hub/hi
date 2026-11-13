import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { useAuth } from '@/hooks/useAuth';
import { isValidEmail } from '@/utils/validation';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

export const ForgotPassword: React.FC = () => {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');
    setFormError('');

    if (!email.trim()) {
      setEmailError('Email address is required');
      return;
    }
    if (!isValidEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await resetPassword({ email: email.trim() });
      if (res.error) {
        setFormError(res.error);
      } else {
        setIsSuccess(true);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send reset link';
      setFormError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Reset Password"
      subtitle="Enter your email to receive recovery instructions"
    >
      {isSuccess ? (
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <p className="text-sm text-text-primary font-medium">Reset Link Dispatched</p>
          <p className="text-xs text-text-secondary">
            If an authorized account is linked to <strong className="text-text-primary">{email}</strong>, a password reset link has been sent.
          </p>
          <div className="pt-2">
            <Link to="/login">
              <Button variant="secondary" className="w-full">
                Back to Login
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-danger-subtle border border-danger/30 text-xs text-danger animate-fade-in">
              {formError}
            </div>
          )}

          <Input
            label="Account Email"
            type="email"
            placeholder="name@domain.com"
            value={email}
            onChange={e => {
              setEmail(e.target.value);
              if (emailError) setEmailError('');
            }}
            error={emailError}
            leftIcon={<Mail className="w-4 h-4" />}
            disabled={isSubmitting}
          />

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            isLoading={isSubmitting}
          >
            Send Reset Instructions
          </Button>

          <div className="text-center pt-2">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors py-1.5 touch-manipulation"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Login</span>
            </Link>
          </div>
        </form>
      )}
    </AuthLayout>
  );
};

