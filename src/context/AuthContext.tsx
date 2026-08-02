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
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isConfigured: false,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

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
          role: 'sales',
        });
      }
    } catch (err) {
      console.error('Lỗi kết nối user_profiles:', err);
      setProfile({
        id: userId,
        email: email,
        role: 'sales',
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
      setUser(currentUser);
      if (currentUser) {
        fetchProfile(currentUser.id, currentUser.email || '');
      }
      setLoading(false);
    });

    // Listen to changes on auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        await fetchProfile(currentUser.id, currentUser.email || '');
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
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
        isConfigured: !!isSupabaseConfigured,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
