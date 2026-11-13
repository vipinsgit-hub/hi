import React, { useState } from 'react';
import { Input, type InputProps } from '@/components/common/Input';
import { Eye, EyeOff, Lock } from 'lucide-react';

export const PasswordInput = React.forwardRef<HTMLInputElement, Omit<InputProps, 'type' | 'rightIcon'>>(
  (props, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
      <Input
        {...props}
        ref={ref}
        type={showPassword ? 'text' : 'password'}
        leftIcon={<Lock className="w-4 h-4" />}
        rightIcon={
          <button
            type="button"
            onClick={() => setShowPassword(prev => !prev)}
            className="p-1.5 text-text-muted hover:text-text-primary active:text-text-primary transition-colors focus:outline-none touch-manipulation min-w-[32px] min-h-[32px] flex items-center justify-center -mr-1"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        }
      />
    );
  }
);

PasswordInput.displayName = 'PasswordInput';
