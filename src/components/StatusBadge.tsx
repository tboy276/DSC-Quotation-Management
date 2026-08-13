import { ShieldCheck, UserCheck } from 'lucide-react';
import type { UserRole } from '../types';

interface StatusBadgeProps {
  role?: UserRole | string;
  showIcon?: boolean;
  size?: 'sm' | 'md';
}

export const StatusBadge = ({ role = 'sales', showIcon = true, size = 'md' }: StatusBadgeProps) => {
  const isAdmin = role === 'admin';

  const baseClasses = "inline-flex items-center font-semibold rounded-full uppercase tracking-wider transition-colors";
  const sizeClasses = size === 'sm' ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs";

  // Muted Pastels per Minimalist UI Skill:
  // Admin -> Pale Yellow (#FBF3DB, Text: #956400)
  // Sales -> Pale Green (#EDF3EC, Text: #346538)
  const colorClasses = isAdmin
    ? "bg-[#FBF3DB] text-[#956400] border border-[#F3E5AB]"
    : "bg-[#EDF3EC] text-[#346538] border border-[#C6E1C4]";

  return (
    <span className={`${baseClasses} ${sizeClasses} ${colorClasses}`}>
      {showIcon && (
        isAdmin ? (
          <ShieldCheck className="w-3 h-3 mr-1 flex-shrink-0 stroke-[2]" />
        ) : (
          <UserCheck className="w-3 h-3 mr-1 flex-shrink-0 stroke-[2]" />
        )
      )}
      <span>{role}</span>
    </span>
  );
};
