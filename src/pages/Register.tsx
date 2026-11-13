import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Input } from '@/components/common/Input';
import { PasswordInput } from '@/components/auth/PasswordInput';
import { Button } from '@/components/common/Button';
import { useAuth } from '@/hooks/useAuth';
import {
  isValidEmail,
  validatePassword,
  validateUsername,
  normalizeUsername,
} from '@/utils/validation';
import { Mail, AtSign, ArrowRight, ShieldCheck, MailCheck } from 'lucide-react';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const { signUp, checkUsernameAvailability } = useAuth();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [usernameError, setUsernameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUsernameError('');
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');
    setFormError('');

    let hasError = false;

    const userValidation = validateUsername(username);
    if (!userValidation.isValid) {
      setUsernameError(userValidation.message || 'Invalid username');
      hasError = true;
    }

    if (!email.trim()) {
      setEmailError('Email address is required for verification');
      hasError = true;
    } else if (!isValidEmail(email)) {
      setEmailError('Please enter a valid email address');
      hasError = true;
    }

    const passValidation = validatePassword(password);
    if (!passValidation.isValid) {
      setPasswordError(passValidation.message || 'Password must be at least 8 characters');
      hasError = true;
    }

    if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      hasError = true;
    }

    if (hasError) return;

    setIsSubmitting(true);
    try {
      const cleanUsername = normalizeUsername(username);

      // Verify username availability before proceeding
      const isAvailable = await checkUsernameAvailability(cleanUsername);
      if (!isAvailable) {
        setUsernameError('This username is already taken. Please choose another.');
        setIsSubmitting(false);
        return;
      }

      const res = await signUp({
        username: cleanUsername,
        email: email.trim(),
        password,
      });

      if (res.error) {
        setFormError(res.error);
      } else {
        setIsSuccess(true);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      setFormError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <AuthLayout
        title="Check Your Email"
        subtitle="Verification link dispatched to your inbox"
      >
        <div className="space-y-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
            <MailCheck className="w-7 h-7" />
          </div>

          <div className="p-3.5 rounded-xl bg-bg-panel border border-border-subtle text-xs text-text-secondary space-y-2.5 text-left">
            <div className="flex items-center gap-1.5 text-text-primary font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Email Verification Required</span>
            </div>
            <p>
              We sent a verification link to <strong className="text-text-primary">{email}</strong>. You must click that link to confirm your account before you can log in.
            </p>
            <p className="border-t border-border-subtle/50 pt-2 text-text-muted">
              Once verified, your login credentials will be:
              <br />
              Username: <strong className="text-text-primary">@{normalizeUsername(username)}</strong>
              <br />
              Password: <span className="text-text-primary">••••••••</span>
            </p>
          </div>

          <Button
            variant="primary"
            className="w-full mt-4"
            onClick={() => navigate('/login')}
          >
            Go to Login
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Create Account"
      subtitle="Register with username and email for private access"
    >
      <form onSubmit={handleSubmit} className="space-y-3.5">
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
          placeholder="e.g. alex_r"
          helperText="3–30 characters (letters, numbers, underscores, hyphens)"
          value={username}
          onChange={e => {
            setUsername(e.target.value);
            if (usernameError) setUsernameError('');
          }}
          error={usernameError}
          leftIcon={<AtSign className="w-4 h-4" />}
          disabled={isSubmitting}
        />

        <Input
          label="Email Address (Gmail or supported)"
          type="email"
          autoComplete="email"
          placeholder="name@gmail.com"
          helperText="A one-time verification link will be sent here"
          value={email}
          onChange={e => {
            setEmail(e.target.value);
            if (emailError) setEmailError('');
          }}
          error={emailError}
          leftIcon={<Mail className="w-4 h-4" />}
          disabled={isSubmitting}
        />

        <PasswordInput
          label="Password"
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
          label="Confirm Password"
          autoComplete="new-password"
          placeholder="Re-enter password"
          value={confirmPassword}
          onChange={e => {
            setConfirmPassword(e.target.value);
            if (confirmPasswordError) setConfirmPasswordError('');
          }}
          error={confirmPasswordError}
          disabled={isSubmitting}
        />

        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            className="w-full"
            isLoading={isSubmitting}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Register Account
          </Button>
        </div>

        <p className="text-center text-xs text-text-secondary pt-2">
          Already registered?{' '}
          <Link to="/login" className="text-text-primary font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
};
