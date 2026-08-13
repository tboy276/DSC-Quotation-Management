import { ShieldCheck, UserCheck, Eye } from 'lucide-react';
import type { UserRole } from '../types';

interface StatusBadgeProps {
  role?: UserRole | string;
  showIcon?: boolean;
  size?: 'sm' | 'md';
}

export const StatusBadge = ({ role = 'viewer', showIcon = true, size = 'md' }: StatusBadgeProps) => {
  const isAdmin = role === 'admin';
  const isSales = role === 'sales';

  const baseClasses = "inline-flex items-center font-semibold rounded-full uppercase tracking-wider transition-colors";
  const sizeClasses = size === 'sm' ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs";

  // Muted Pastels per Minimalist UI Skill:
  // Admin -> Pale Yellow (#FBF3DB, Text: #956400)
  // Sales -> Pale Green (#EDF3EC, Text: #346538)
  // Viewer -> Muted Gray/Slate (#F0F2F5, Text: #4B5563)
  const colorClasses = isAdmin
    ? "bg-[#FBF3DB] text-[#956400] border border-[#F3E5AB]"
    : isSales
    ? "bg-[#EDF3EC] text-[#346538] border border-[#C6E1C4]"
    : "bg-[#F0F2F5] text-[#4B5563] border border-[#E5E7EB]";

  const IconComponent = isAdmin ? ShieldCheck : isSales ? UserCheck : Eye;

  return (
    <span className={`${baseClasses} ${sizeClasses} ${colorClasses}`}>
      {showIcon && (
        <IconComponent className="w-3 h-3 mr-1 flex-shrink-0 stroke-[2]" />
      )}
      <span>{role}</span>
    </span>
  );
};
