import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Input } from '@/components/common/Input';
import { PasswordInput } from '@/components/auth/PasswordInput';
import { Button } from '@/components/common/Button';
import { useAuth } from '@/hooks/useAuth';
import { validateUsername, normalizeUsername } from '@/utils/validation';
import { AtSign, ArrowRight, UserCheck } from 'lucide-react';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { signIn, isMockMode, switchMockUser } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUsernameError('');
    setPasswordError('');
    setFormError('');

    let hasError = false;

    const usernameValidation = validateUsername(username);
    if (!usernameValidation.isValid) {
      setUsernameError(usernameValidation.message || 'Please enter a valid username');
      hasError = true;
    }

    if (!password) {
      setPasswordError('Password is required');
      hasError = true;
    }

    if (hasError) return;

    setIsSubmitting(true);
    try {
      const cleanUsername = normalizeUsername(username);
      const res = await signIn({ username: cleanUsername, password });
      if (res.error) {
        setFormError(res.error);
      } else {
        navigate('/chat');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      setFormError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickPreviewLogin = async (userType: 'alex' | 'jordan') => {
    setIsSubmitting(true);
    try {
      if (switchMockUser) switchMockUser(userType);
      await signIn({ username: userType, password: 'password123' });
      navigate('/chat');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in with your username to access your private channel"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {formError && (
          <div className="p-3 rounded-xl bg-danger-subtle border border-danger/30 text-xs text-danger animate-fade-in leading-relaxed">
            {formError}
          </div>
        )}

        <Input
          label="Username"
          type="text"
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck="false"
          placeholder="your_username"
          value={username}
          onChange={e => {
            setUsername(e.target.value);
            if (usernameError) setUsernameError('');
          }}
          error={usernameError}
          leftIcon={<AtSign className="w-4 h-4" />}
          disabled={isSubmitting}
        />

        <div className="space-y-1">
          <PasswordInput
            label="Password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={e => {
              setPassword(e.target.value);
              if (passwordError) setPasswordError('');
            }}
            error={passwordError}
            disabled={isSubmitting}
          />
          <div className="flex justify-end pt-0.5">
            <Link
              to="/forgot-password"
              className="text-xs text-text-muted hover:text-text-primary transition-colors py-1 touch-manipulation"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          className="w-full mt-2"
          isLoading={isSubmitting}
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          Sign In
        </Button>

        {/* Development Preview 1-Click Access */}
        {isMockMode && (
          <div className="pt-4 border-t border-border-subtle/60 mt-4 space-y-2">
            <p className="text-[11px] text-text-muted text-center">
              Stage 1 Preview Quick Access:
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => handleQuickPreviewLogin('alex')}
                disabled={isSubmitting}
                leftIcon={<UserCheck className="w-3.5 h-3.5 text-accent" />}
              >
                @alex
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => handleQuickPreviewLogin('jordan')}
                disabled={isSubmitting}
                leftIcon={<UserCheck className="w-3.5 h-3.5 text-accent" />}
              >
                @jordan
              </Button>
            </div>
          </div>
        )}

        <p className="text-center text-xs text-text-secondary pt-2">
          Need an account?{' '}
          <Link to="/register" className="text-text-primary font-medium hover:underline py-1 touch-manipulation inline-block">
            Register here
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
};
