import { supabase } from './supabase';
import type { UserProfile } from '../types';
import { logAudit } from './audit-service';

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

export const updateUserRole = async (userId: string, newRole: string, email?: string): Promise<void> => {
  const { error } = await supabase
    .from('user_profiles')
    .update({ role: newRole })
    .eq('id', userId);

  if (error) {
    throw new Error(`Lỗi cập nhật vai trò: ${error.message}`);
  }
  await logAudit('UPDATE_USER_ROLE', 'user_profiles', userId, { target_email: email || userId, new_role: newRole });
};

export const revokeUserProfile = async (userId: string, email?: string): Promise<void> => {
  const { error } = await supabase
    .from('user_profiles')
    .delete()
    .eq('id', userId);

  if (error) {
    throw new Error(`Lỗi thu hồi quyền: ${error.message}`);
  }
  await logAudit('REVOKE_USER_PROFILE', 'user_profiles', userId, { email: email || userId });
};

export const fetchAllowedUsers = async (): Promise<{ email: string; role: string; added_by?: string; created_at: string }[]> => {
  const { data, error } = await supabase.from('allowed_users').select('*').order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching allowed users:', error);
    throw new Error(error.message);
  }
  return data as { email: string; role: string; added_by?: string; created_at: string }[];
};

export const addAllowedUser = async (email: string, role: 'viewer' | 'sales' | 'admin', addedByEmail: string): Promise<void> => {
  const { error } = await supabase.from('allowed_users').insert([{ email, role, added_by: addedByEmail }]);
  if (error) {
    throw new Error('Lỗi thêm email vào allowlist: ' + error.message);
  }
  await logAudit('ADD_ALLOWED_EMAIL', 'allowed_users', email, { email, role });
};

export const removeAllowedUser = async (email: string): Promise<void> => {
  const { error } = await supabase.from('allowed_users').delete().eq('email', email);
  if (error) {
    throw new Error('Lỗi xóa email khỏi allowlist: ' + error.message);
  }
  await logAudit('REMOVE_ALLOWED_EMAIL', 'allowed_users', email, { email });
};
