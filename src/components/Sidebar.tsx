import { useState } from 'react';
import {
  Workflow,
  Box,
  FileText,
  Users,
  Database,
  Layers,
  BarChart3,
  TrendingUp,
  Activity,
  Pin,
  PinOff,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export const Sidebar = ({
  activeTab,
  setActiveTab,
  collapsed,
  setCollapsed,
}: SidebarProps) => {
  // State quản lý chế độ tự động ẩn (Auto-Hide on Hover)
  const [autoHide, setAutoHide] = useState<boolean>(true);
  const [isHovered, setIsHovered] = useState<boolean>(false);

  // Xác định trạng thái hiển thị thực tế:
  // Nếu bật Auto-Hide: khi di chuột vào (isHovered = true) -> Mở rộng (w-280), ra ngoài -> Thu gọn (w-68)
  // Nếu tắt Auto-Hide (Ghim cố định): tuân theo prop collapsed (w-280 hoặc w-68)
  const isExpanded = autoHide ? isHovered : !collapsed;

  const mainNavItems = [
    { id: 'quotations', label: 'Quản Lý RFQ / Báo Giá', icon: FileText, shortcut: '⌘1' },
    { id: 'documents', label: 'Văn Bản Báo Giá Gộp', icon: Layers, shortcut: '⌘2' },
    { id: 'forging', label: 'Tính Giá Rèn Dập', icon: Workflow, shortcut: '⌘3' },
    { id: 'casting', label: 'Tính Giá Đúc Gang', icon: Box, shortcut: '⌘4' },
    { id: 'master_data', label: 'Quản Lý Master Data', icon: Database, shortcut: '⌘5' },
    { id: 'analytics', label: 'Báo Cáo Thống Kê RFQ', icon: TrendingUp, shortcut: '⌘7' },
  ];

  const adminNavItems = [
    { id: 'users', label: 'Quản Lý Quyền & Tài Khoản', icon: Users, shortcut: '⌘U' },
    { id: 'health_check', label: 'Kiểm Tra Kết Nối DB (Health)', icon: Activity, shortcut: '⌘H' },
  ];

  return (
    <aside
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`bg-[#FBFBFA] border-r border-[#EAEAEA] flex flex-col h-screen sticky top-0 transition-all duration-300 ease-in-out z-30 select-none shadow-[2px_0_12px_rgba(0,0,0,0.03)] ${
        isExpanded ? 'w-[280px]' : 'w-[68px]'
      }`}
    >
      {/* Sidebar Header */}
      <div className="h-14 px-3.5 flex items-center justify-between border-b border-[#EAEAEA] flex-shrink-0">
        <div className="flex items-center space-x-2.5 overflow-hidden">
          {/* Logo icon: #111111 box with 6px radius per minimalist-ui */}
          <div className="w-8 h-8 rounded-[6px] bg-[#111111] text-white flex items-center justify-center flex-shrink-0 shadow-xs">
            <BarChart3 className="w-4 h-4 stroke-[2]" />
          </div>
          {isExpanded && (
            <div className="truncate">
              <span className="font-bold text-[#111111] text-sm tracking-tight block leading-tight truncate">
                DSC Quotation
              </span>
              <span className="text-[10px] text-[#787774] font-medium block truncate">
                DISOCO Workspace
              </span>
            </div>
          )}
        </div>

        {/* Nút Chuyển Chế Độ: Tự Động Ẩn / Ghim Cố Định */}
        <button
          type="button"
          onClick={() => {
            if (autoHide) {
              setAutoHide(false);
              setCollapsed(false);
            } else {
              setAutoHide(true);
              setCollapsed(true);
            }
          }}
          className={`p-1.5 rounded-[6px] transition-colors flex-shrink-0 cursor-pointer ${
            autoHide
              ? 'text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200'
              : 'text-[#787774] hover:text-[#111111] hover:bg-[#F0F0EE] border border-transparent'
          }`}
          title={
            autoHide
              ? 'Đang bật Tự Động Ẩn (Rê chuột vào để mở) - Bấm để Ghim Cố Định'
              : 'Đang Ghim Cố Định - Bấm để Tự Động Ẩn khi rời chuột'
          }
        >
          {autoHide ? (
            <PinOff className="w-3.5 h-3.5 stroke-[2]" />
          ) : (
            <Pin className="w-3.5 h-3.5 stroke-[2]" />
          )}
        </button>
      </div>

      {/* Auto-hide indicator banner when expanded */}
      {isExpanded && autoHide && (
        <div className="px-3 py-1 bg-amber-50/70 border-b border-amber-200/50 flex items-center justify-between text-[10px] text-amber-900 font-medium tracking-tight">
          <span className="inline-flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span>Chế độ Tự Động Ẩn khi rời chuột</span>
          </span>
          <button
            type="button"
            onClick={() => setAutoHide(false)}
            className="font-bold underline cursor-pointer text-amber-900 hover:text-amber-950"
          >
            Ghim
          </button>
        </div>
      )}

      {/* Navigation List */}
      <div className="flex-1 py-3 px-2 space-y-1 overflow-y-auto overflow-x-hidden flex flex-col justify-between">
        {/* Main Business Logic Menu Group */}
        <div className="space-y-0.5">
          {isExpanded && (
            <p className="px-2.5 text-[10px] font-semibold text-[#787774] uppercase tracking-wider mb-1.5 mt-1">
              Nghiệp Vụ Báo Giá
            </p>
          )}
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                title={!isExpanded ? item.label : undefined}
                className={`w-full flex items-center h-9 px-2.5 rounded-[6px] text-xs transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-[#F0F0EE] text-[#111111] font-bold shadow-2xs'
                    : 'text-[#787774] hover:bg-[#F7F6F3] hover:text-[#111111] font-medium'
                }`}
              >
                <Icon
                  className={`w-4 h-4 flex-shrink-0 stroke-[1.75] ${
                    isActive ? 'text-[#111111]' : 'text-[#787774]'
                  } ${!isExpanded ? 'mx-auto' : 'mr-2.5'}`}
                />
                {isExpanded && (
                  <>
                    <span className="truncate text-left flex-1">{item.label}</span>
                    <kbd className="text-[9px] text-[#787774] bg-[#FFFFFF] border border-[#EAEAEA] px-1 py-0.2 rounded-[3px]">
                      {item.shortcut}
                    </kbd>
                  </>
                )}
              </button>
            );
          })}
        </div>

        {/* System Administration Group */}
        <div className="pt-3 border-t border-[#EAEAEA] space-y-0.5">
          {isExpanded && (
            <p className="px-2.5 text-[10px] font-semibold text-[#787774] uppercase tracking-wider mb-1.5">
              Hệ Thống
            </p>
          )}
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                title={!isExpanded ? item.label : undefined}
                className={`w-full flex items-center h-9 px-2.5 rounded-[6px] text-xs transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-[#F0F0EE] text-[#111111] font-bold shadow-2xs'
                    : 'text-[#787774] hover:bg-[#F7F6F3] hover:text-[#111111] font-medium'
                }`}
              >
                <Icon
                  className={`w-4 h-4 flex-shrink-0 stroke-[1.75] ${
                    isActive ? 'text-[#111111]' : 'text-[#787774]'
                  } ${!isExpanded ? 'mx-auto' : 'mr-2.5'}`}
                />
                {isExpanded && (
                  <>
                    <span className="truncate text-left flex-1">{item.label}</span>
                    <kbd className="text-[9px] text-[#787774] bg-[#FFFFFF] border border-[#EAEAEA] px-1 py-0.2 rounded-[3px]">
                      {item.shortcut}
                    </kbd>
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
};
