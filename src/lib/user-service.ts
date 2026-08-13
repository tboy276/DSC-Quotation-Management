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
