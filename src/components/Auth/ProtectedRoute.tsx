import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import PinEntry from './PinEntry';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <PinEntry />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;