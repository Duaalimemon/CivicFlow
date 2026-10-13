import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type UserRole = 'CITIZEN' | 'CIVIC_OFFICIAL' | 'ADMINISTRATOR';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  badgeNumber?: string;
  department?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: { email: string; password: string; fullName: string }) => Promise<User>;
  logout: () => Promise<void>;
  checkSession: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Safely parse HTTP response into JSON data if possible, preventing unexpected EOF / JSON parse crashes.
 */
async function parseResponsePayload(res: Response): Promise<{ data: any; rawText: string }> {
  let rawText = '';
  try {
    rawText = await res.text();
  } catch {
    rawText = '';
  }

  if (!rawText || rawText.trim().length === 0) {
    return { data: null, rawText: '' };
  }

  try {
    const data = JSON.parse(rawText);
    return { data, rawText };
  } catch {
    return { data: null, rawText };
  }
}

function extractErrorMessage(res: Response, data: any, rawText: string, fallbackMessage: string): string {
  if (data?.message && typeof data.message === 'string') {
    return data.message;
  }
  if (data?.error) {
    if (typeof data.error === 'string') return data.error;
    if (typeof data.error?.message === 'string') return data.error.message;
  }
  if (Array.isArray(data?.errors) && data.errors.length > 0) {
    const messages = data.errors.map((e: any) => (typeof e === 'string' ? e : e.message || JSON.stringify(e)));
    return messages.join('; ');
  }
  if (res.status === 502 || res.status === 503 || res.status === 504) {
    return `Authentication service unavailable (HTTP ${res.status}). Verify backend service is running on port 5000.`;
  }
  if (res.status === 500 && (!data || !data.message)) {
    return `Backend connection error (HTTP 500). Please verify backend server is running on port 5000.`;
  }
  if (res.status === 404) {
    return `Authentication endpoint not found (HTTP 404).`;
  }
  if (rawText && rawText.length < 120 && !rawText.trim().startsWith('<')) {
    return `${fallbackMessage} (${rawText.trim()})`;
  }
  return fallbackMessage;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Visitors start completely logged out
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Verify existing HttpOnly cookie session with backend on initial load / reload
  const checkSession = useCallback(async (): Promise<User | null> => {
    try {
      const res = await fetch('/api/v1/auth/me', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (res.ok) {
        const { data } = await parseResponsePayload(res);
        if (data?.success && data?.user) {
          setUser(data.user);
          return data.user;
        }
      }
      setUser(null);
      return null;
    } catch (err) {
      console.warn('[AuthSession] Session check error:', err);
      setUser(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void checkSession();
  }, [checkSession]);

  const login = async (email: string, password: string): Promise<User> => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const { data, rawText } = await parseResponsePayload(res);

      if (!res.ok || !data?.success) {
        const message = extractErrorMessage(res, data, rawText, 'Authentication failed. Please check credentials.');
        throw new Error(message);
      }

      if (!data.user) {
        throw new Error('Authentication succeeded but user profile was not returned.');
      }

      setUser(data.user);
      return data.user;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: { email: string; password: string; fullName: string }): Promise<User> => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          fullName: data.fullName,
          role: 'CITIZEN',
        }),
      });

      const { data: resData, rawText } = await parseResponsePayload(res);

      if (!res.ok || !resData?.success) {
        const message = extractErrorMessage(res, resData, rawText, 'Registration failed.');
        throw new Error(message);
      }

      if (!resData.user) {
        throw new Error('Registration succeeded but user profile was not returned.');
      }

      setUser(resData.user);
      return resData.user;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!res.ok) {
        const { data, rawText } = await parseResponsePayload(res);
        const message = extractErrorMessage(res, data, rawText, 'Failed to terminate session on server.');
        throw new Error(message);
      }

      setUser(null);
    } catch (err: any) {
      console.error('[AuthSession] Logout error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        checkSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
