import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Role = 'ADMIN' | 'CREATOR' | 'REVIEWER';

interface AuthContextProps {
  role: Role;
  setRole: (role: Role) => void;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [role, setRole] = useState<Role>('ADMIN'); // default for demo
  return (
    <AuthContext.Provider value={{ role, setRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextProps => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
};
