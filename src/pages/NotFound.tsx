import React from 'react';
import { Link } from 'react-router-dom';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Button } from '@/components/common/Button';

export const NotFound: React.FC = () => {
  return (
    <AuthLayout
      title="Page Not Found"
      subtitle="The requested page could not be located"
    >
      <div className="text-center space-y-4">
        <p className="text-xs text-text-secondary">
          Check the URL or return to your private conversation.
        </p>
        <Link to="/chat">
          <Button variant="primary" className="w-full">
            Go to HI Chat
          </Button>
        </Link>
      </div>
    </AuthLayout>
  );
};

