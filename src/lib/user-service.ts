import { supabase } from './supabase';
import type { UserProfile } from '../types';

export const fetchAllUserProfiles = async (): Promise<UserProfile[]> => {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user profiles:', error);
    throw new Error(error.message);
  }

  return data as UserProfile[];
};

export const updateUserRole = async (userId: string, newRole: string): Promise<void> => {
  const { error } = await supabase
    .from('user_profiles')
    .update({ role: newRole })
    .eq('id', userId);

  if (error) {
    throw new Error(`Lỗi cập nhật vai trò: ${error.message}`);
  }
};

export const revokeUserProfile = async (userId: string): Promise<void> => {
  const { error } = await supabase
    .from('user_profiles')
    .delete()
    .eq('id', userId);

  if (error) {
    throw new Error(`Lỗi thu hồi quyền: ${error.message}`);
  }
};
