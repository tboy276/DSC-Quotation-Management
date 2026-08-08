import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { resetSystemData } from '../lib/quotation-service';
import { Modal } from './ui/Modal';
import { Search, Bell, RotateCw, LogOut, ChevronDown, AlertTriangle, Check } from 'lucide-react';
import { ActionButton } from './ui/ActionButton';
import { StatusBadge } from './StatusBadge';

interface PageHeaderProps {
  title: string;
}

export const PageHeader = ({ title }: PageHeaderProps) => {
  const { user, profile, signOut } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const email = profile?.email || user?.email || 'user@disoco.vn';
  const role = profile?.role || 'sales';
  const initials = email.charAt(0).toUpperCase();

  // Reset capability: Accessible for Estimator & Admin roles
  const canResetData = role === 'estimator' || role === 'admin';

  const handleConfirmReset = async () => {
    setIsResetting(true);
    await resetSystemData();
    setShowResetModal(false);
    setIsResetting(false);
    // Reload page to refresh all components and store states immediately
    window.location.reload();
  };

  return (
    <>
      <header className="h-14 bg-white border-b border-[#EAEAEA] px-6 flex items-center justify-between sticky top-0 z-20">
        {/* Page Title */}
        <h1 className="text-base font-bold text-[#111111] tracking-tight">{title}</h1>

        {/* Top Right Utility Group */}
        <div className="flex items-center space-x-2.5">
          {/* Search button */}
          <button
            className="p-1.5 rounded-[5px] text-[#787774] hover:text-[#111111] hover:bg-[#F7F6F3] transition-colors cursor-pointer"
            title="Tìm kiếm (⌘K)"
          >
            <Search className="w-4 h-4 stroke-[1.75]" />
          </button>

          {/* Notification Bell */}
          <button
            className="p-1.5 rounded-[5px] text-[#787774] hover:text-[#111111] hover:bg-[#F7F6F3] transition-colors relative cursor-pointer"
            title="Thông báo"
          >
            <Bell className="w-4 h-4 stroke-[1.75]" />
            <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-[#9F2F2D] rounded-full" />
          </button>

          {/* Reset System Data Button (Estimator & Admin) */}
          {canResetData && (
            <button
              onClick={() => setShowResetModal(true)}
              className="px-2 py-1 rounded-[6px] bg-[#FDEBEC] text-[#9F2F2D] border border-[#FADBDC] hover:bg-[#F8C9CA] transition-colors cursor-pointer text-xs font-bold inline-flex items-center space-x-1.5 shadow-2xs"
              title="Reset toàn bộ dữ liệu ứng dụng về ban đầu (Chỉ Kỹ Thuật Estimator / Admin)"
            >
              <RotateCw className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="hidden sm:inline">Reset Data</span>
            </button>
          )}

          <div className="h-4 w-px bg-[#EAEAEA] mx-1" />

          {/* User Profile Avatar & Dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center space-x-2 p-1 rounded-[6px] hover:bg-[#F7F6F3] transition-colors cursor-pointer"
            >
              {/* Avatar: Off-black circle with uppercase initials */}
              <div className="w-7 h-7 rounded-full bg-[#111111] text-white flex items-center justify-center font-bold text-xs">
                {initials}
              </div>

              <div className="text-left hidden md:block">
                <p className="text-xs font-semibold text-[#111111] truncate max-w-[150px] leading-tight">
                  {email}
                </p>
                <div className="mt-0.5">
                  <StatusBadge role={role} showIcon={false} size="sm" />
                </div>
              </div>

              <ChevronDown className="w-3.5 h-3.5 text-[#787774]" />
            </button>

            {/* User Dropdown Menu */}
            {dropdownOpen && (
              <div
                className="absolute right-0 mt-1.5 w-56 bg-white rounded-[8px] border border-[#EAEAEA] py-1 z-50 shadow-[0_2px_8px_rgba(0,0,0,0.04)] animate-fade-in-up"
                onMouseLeave={() => setDropdownOpen(false)}
              >
                <div className="px-3 py-2 border-b border-[#EAEAEA] md:hidden">
                  <p className="text-xs font-semibold text-[#111111] truncate">{email}</p>
                  <div className="mt-1">
                    <StatusBadge role={role} size="sm" />
                  </div>
                </div>

                <div className="px-3 py-2 border-b border-[#EAEAEA]">
                  <p className="text-[10px] font-semibold uppercase text-[#787774] tracking-wider">
                    Quyền Hạn Khả Dụng
                  </p>
                  <p className="text-xs font-medium text-[#2F3437] mt-0.5 capitalize">
                    {role === 'admin' || email.toLowerCase() === 'tuan.vuongdinh@disoco.net'
                      ? 'Admin (Quản Trị Viên Hệ Thống)'
                      : role === 'estimator'
                      ? 'Estimator (Kỹ Thuật Báo Giá)'
                      : 'Sales (Nghiệp Vụ Bán Hàng)'}
                  </p>
                </div>

                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    signOut();
                  }}
                  className="w-full flex items-center space-x-2 px-3 py-2 text-xs font-semibold text-[#9F2F2D] hover:bg-[#FDEBEC] transition-colors text-left cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Đăng xuất hệ thống</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Admin Reset Data Confirmation Modal */}
      <Modal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        size="sm"
        icon={<AlertTriangle className="w-5 h-5 text-[#9F2F2D]" />}
        title="Xác Nhận Reset Data Hệ Thống (Admin Only)"
        footer={
          <>
            <ActionButton
              variant="neutral"
              onClick={() => setShowResetModal(false)}
              label="Hủy"
            />
            <ActionButton
              type="button"
              disabled={isResetting}
              onClick={handleConfirmReset}
              variant="danger"
              icon={Check}
              label={isResetting ? 'Đang Reset...' : 'Xác Nhận Reset Dữ Liệu'}
            />
          </>
        }
      >
        <div className="space-y-2">
          <p className="text-xs text-[#2F3437] leading-relaxed">
            Bạn đang thực hiện quyền Admin (<strong>tuan.vuongdinh@disoco.net</strong>).
          </p>
          <div className="p-3 bg-[#FDEBEC] border border-[#FADBDC] rounded-[6px] text-[#9F2F2D] font-medium space-y-1">
            <p className="font-bold">⚠️ Cảnh báo xoá dữ liệu thử nghiệm:</p>
            <p className="text-[11px] text-[#9F2F2D]/90">
              Thao tác này sẽ khôi phục toàn bộ danh sách RFQ, các mã sản phẩm và kết quả tính giá thử nghiệm về trạng thái ban đầu của hệ thống.
            </p>
          </div>
        </div>
      </Modal>
    </>
  );
};
