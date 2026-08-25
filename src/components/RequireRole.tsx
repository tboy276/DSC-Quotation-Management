import type { ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert } from 'lucide-react';

interface RequireRoleProps {
  allow: string[];
  children: ReactNode;
}

export const RequireRole = ({ allow, children }: RequireRoleProps) => {
  const { profile } = useAuth();

  if (profile === null) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-3 animate-fade-in-up">
        <div className="w-14 h-14 rounded-full bg-[#FDEBEC] flex items-center justify-center">
          <ShieldAlert className="w-7 h-7 text-[#9F2F2D]" />
        </div>
        <h2 className="text-base font-bold text-[#111111]">Tài khoản chưa được cấp quyền truy cập</h2>
        <p className="text-xs text-[#787774] max-w-sm">
          Tài khoản của bạn đã đăng nhập thành công nhưng chưa được thiết lập vai trò trong hệ thống.
          Vui lòng liên hệ Admin để được cấp quyền.
        </p>
      </div>
    );
  }

  const role = profile.role || 'viewer';

  if (!allow.includes(role)) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-3 animate-fade-in-up">
        <div className="w-14 h-14 rounded-full bg-[#FDEBEC] flex items-center justify-center">
          <ShieldAlert className="w-7 h-7 text-[#9F2F2D]" />
        </div>
        <h2 className="text-base font-bold text-[#111111]">Không đủ quyền truy cập</h2>
        <p className="text-xs text-[#787774] max-w-sm">
          Tài khoản của bạn (vai trò: <strong className="text-[#111111]">{role}</strong>) không có
          quyền xem trang này. Vui lòng liên hệ Admin nếu cần được cấp thêm quyền.
        </p>
      </div>
    );
  }

  return <>{children}</>;
};
