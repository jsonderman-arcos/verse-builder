import React from 'react';
import { AuthContext, useAuthProvider } from '@/hooks/useAuth';

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  try {
    const auth = useAuthProvider();

    return (
      <AuthContext.Provider value={auth}>
        {children}
      </AuthContext.Provider>
    );
  } catch (error) {
    console.error('AuthProvider error:', error);
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-peaceful">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-destructive mb-2">Authentication Error</h1>
          <p className="text-muted-foreground">Please refresh the page</p>
        </div>
      </div>
    );
  }
};