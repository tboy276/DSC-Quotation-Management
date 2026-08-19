import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { UserProfile } from '../types';

interface AuthContextType {
  user: any | null;
  profile: UserProfile | null;
  loading: boolean;
  isConfigured: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  loginAsDemo: (email?: string, role?: 'admin' | 'sales' | 'viewer') => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isConfigured: false,
  signOut: async () => {},
  refreshProfile: async () => {},
  loginAsDemo: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any | null>(() => {
    try {
      const saved = localStorage.getItem('dsc_demo_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('dsc_demo_user');
      if (saved) {
        const u = JSON.parse(saved);
        return { id: u.id, email: u.email, role: u.role || 'admin' };
      }
      return null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState<boolean>(false);

  const loginAsDemo = (email = 'admin@disoco.vn', role: 'admin' | 'sales' | 'viewer' = 'admin') => {
    const mockUser = {
      id: 'usr-admin-mock',
      email: email,
      role: role,
    };
    setUser(mockUser);
    setProfile({
      id: 'usr-admin-mock',
      email: email,
      role: role,
    });
    localStorage.setItem('dsc_demo_user', JSON.stringify(mockUser));
  };

  const fetchProfile = async (userId: string, email: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Lỗi lấy thông tin vai trò:', error.message);
      }

      if (data) {
        setProfile(data as UserProfile);
      } else {
        // Fallback mặc định role sales nếu chưa trigger tạo kịp
        setProfile({
          id: userId,
          email: email,
          role: 'admin',
        });
      }
    } catch (err) {
      console.error('Lỗi kết nối user_profiles:', err);
      setProfile({
        id: userId,
        email: email,
        role: 'admin',
      });
    }
  };

  const refreshProfile = async () => {
    if (user?.id && user?.email) {
      await fetchProfile(user.id, user.email);
    }
  };

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    // Check active session on initial load
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      if (currentUser) {
        setUser(currentUser);
        fetchProfile(currentUser.id, currentUser.email || '');
      }
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });

    // Listen to changes on auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      if (currentUser) {
        setUser(currentUser);
        await fetchProfile(currentUser.id, currentUser.email || '');
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    localStorage.removeItem('dsc_demo_user');
    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch {}
    }
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isConfigured: true,
        signOut,
        refreshProfile,
        loginAsDemo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
