'use client';
import React, { createContext, useContext, useState, type ReactNode } from 'react';

export type Role = 'ADMIN' | 'CREATOR' | 'REVIEWER';

export interface UserProfile {
  role: Role;
  name: string;
  avatar: string;
}

const PROFILES: Record<Role, UserProfile> = {
  ADMIN:    { role: 'ADMIN',    name: 'Alex Admin',    avatar: 'AA' },
  CREATOR:  { role: 'CREATOR',  name: 'Casey Creator', avatar: 'CC' },
  REVIEWER: { role: 'REVIEWER', name: 'Riley Reviewer', avatar: 'RR' },
};

interface AuthContextProps {
  role: Role;
  user: UserProfile;
  setRole: (role: Role) => void;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>('ADMIN');
  return (
    <AuthContext.Provider value={{ role, user: PROFILES[role], setRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextProps {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
