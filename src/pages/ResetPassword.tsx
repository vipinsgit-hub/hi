import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { PasswordInput } from '@/components/auth/PasswordInput';
import { Button } from '@/components/common/Button';
import { useAuth } from '@/hooks/useAuth';
import { validatePassword } from '@/utils/validation';
import { CheckCircle2 } from 'lucide-react';

export const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const { updatePassword } = useAuth();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setConfirmPasswordError('');
    setFormError('');

    const passValidation = validatePassword(password);
    if (!passValidation.isValid) {
      setPasswordError(passValidation.message || 'Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await updatePassword({ newPassword: password });
      if (res.error) {
        setFormError(res.error);
      } else {
        setIsSuccess(true);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Password update failed';
      setFormError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Set New Password"
      subtitle="Enter a new secure password for your account"
    >
      {isSuccess ? (
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <p className="text-sm font-medium text-text-primary">Password Successfully Updated</p>
          <p className="text-xs text-text-secondary">
            Your account credentials have been updated. You can now access HI with your new password.
          </p>
          <div className="pt-2">
            <Button
              variant="primary"
              className="w-full"
              onClick={() => navigate('/chat')}
            >
              Proceed to Chat
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-danger-subtle border border-danger/30 text-xs text-danger animate-fade-in">
              {formError}
            </div>
          )}

          <PasswordInput
            label="New Password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            value={password}
            onChange={e => {
              setPassword(e.target.value);
              if (passwordError) setPasswordError('');
            }}
            error={passwordError}
            disabled={isSubmitting}
          />

          <PasswordInput
            label="Confirm New Password"
            autoComplete="new-password"
            placeholder="Re-enter new password"
            value={confirmPassword}
            onChange={e => {
              setConfirmPassword(e.target.value);
              if (confirmPasswordError) setConfirmPasswordError('');
            }}
            error={confirmPasswordError}
            disabled={isSubmitting}
          />

          <Button
            type="submit"
            variant="primary"
            className="w-full mt-2"
            isLoading={isSubmitting}
          >
            Update Password
          </Button>
        </form>
      )}
    </AuthLayout>
  );
};

