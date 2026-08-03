import {
  Workflow,
  Box,
  FileText,
  Users,
  Database,
  LayoutGrid,
  ChevronLeft,
  Layers,
  BarChart3,
  TrendingUp,
  Activity,
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
      className={`bg-[#FBFBFA] border-r border-[#EAEAEA] flex flex-col h-screen sticky top-0 transition-all duration-200 z-30 select-none ${
        collapsed ? 'w-[72px]' : 'w-[280px]'
      }`}
    >
      {/* Sidebar Header */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-[#EAEAEA] flex-shrink-0">
        <div className="flex items-center space-x-2.5 overflow-hidden">
          {/* Logo icon: #111111 box with 6px radius per minimalist-ui */}
          <div className="w-8 h-8 rounded-[6px] bg-[#111111] text-white flex items-center justify-center flex-shrink-0">
            <BarChart3 className="w-4 h-4 stroke-[2]" />
          </div>
          {!collapsed && (
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

        {/* Toggle Collapse Button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded-[5px] text-[#787774] hover:text-[#111111] hover:bg-[#F0F0EE] transition-colors flex-shrink-0 cursor-pointer"
          title={collapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
        >
          {collapsed ? (
            <LayoutGrid className="w-4 h-4 stroke-[1.75]" />
          ) : (
            <ChevronLeft className="w-4 h-4 stroke-[1.75]" />
          )}
        </button>
      </div>

      {/* Navigation List */}
      <div className="flex-1 py-3 px-2 space-y-1 overflow-y-auto overflow-x-hidden flex flex-col justify-between">
        {/* Main Business Logic Menu Group */}
        <div className="space-y-0.5">
          {!collapsed && (
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
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center h-9 px-2.5 rounded-[6px] text-xs transition-all duration-100 cursor-pointer ${
                  isActive
                    ? 'bg-[#F0F0EE] text-[#111111] font-bold'
                    : 'text-[#787774] hover:bg-[#F7F6F3] hover:text-[#111111] font-medium'
                }`}
              >
                <Icon
                  className={`w-4 h-4 flex-shrink-0 stroke-[1.75] ${
                    isActive ? 'text-[#111111]' : 'text-[#787774]'
                  } ${collapsed ? 'mx-auto' : 'mr-2.5'}`}
                />
                {!collapsed && (
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
          {!collapsed && (
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
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center h-9 px-2.5 rounded-[6px] text-xs transition-all duration-100 cursor-pointer ${
                  isActive
                    ? 'bg-[#F0F0EE] text-[#111111] font-bold'
                    : 'text-[#787774] hover:bg-[#F7F6F3] hover:text-[#111111] font-medium'
                }`}
              >
                <Icon
                  className={`w-4 h-4 flex-shrink-0 stroke-[1.75] ${
                    isActive ? 'text-[#111111]' : 'text-[#787774]'
                  } ${collapsed ? 'mx-auto' : 'mr-2.5'}`}
                />
                {!collapsed && (
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
