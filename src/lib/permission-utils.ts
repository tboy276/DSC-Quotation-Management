import type { UserProfile } from '../types';

interface ManageableRecord {
  created_by?: string;
  created_by_email?: string;
  rfq?: {
    created_by?: string;
    created_by_email?: string;
  };
  items?: {
    quote?: {
      rfq?: {
        created_by_email?: string;
      }
    }
  }[];
}

export const canManageRecord = (
  profile: UserProfile | null | undefined,
  currentUserEmail: string | null | undefined,
  record?: ManageableRecord | null
): boolean => {
  if (!record) return false;
  if (profile?.role === 'admin') return true;

  const creatorId = record.rfq?.created_by || record.created_by;
  const creatorEmail = record.rfq?.created_by_email || record.created_by_email || record.items?.[0]?.quote?.rfq?.created_by_email;

  return Boolean(
    (profile?.id && creatorId === profile.id) ||
    (currentUserEmail && creatorEmail === currentUserEmail)
  );
};
