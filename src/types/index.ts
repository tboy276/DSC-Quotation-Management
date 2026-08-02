export type UserRole = 'sales' | 'estimator';

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  created_at?: string;
  updated_at?: string;
}

export interface AuthState {
  user: any | null;
  profile: UserProfile | null;
  loading: boolean;
}
