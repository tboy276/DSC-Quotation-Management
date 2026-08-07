import { useState } from 'react';
import {
  Workflow,
  Box,
  FileText,
  Users,
  Database,
  Layers,
  TrendingUp,
  Activity,
  Scissors,
  Wrench,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  collapsed?: boolean;
  setCollapsed?: (collapsed: boolean) => void;
}

export const Sidebar = ({
  activeTab,
  setActiveTab,
}: SidebarProps) => {
  const [isHovered, setIsHovered] = useState<boolean>(false);

  const mainNavItems = [
    { id: 'quotations', label: 'Quản Lý RFQ / Báo Giá', icon: FileText, shortcut: '⌘1' },
    { id: 'documents', label: 'Văn Bản Báo Giá Gộp', icon: Layers, shortcut: '⌘2' },
    { id: 'forging', label: 'Tính Giá Rèn Dập', icon: Workflow, shortcut: '⌘3' },
    { id: 'casting', label: 'Tính Giá Đúc Gang', icon: Box, shortcut: '⌘4' },
    { id: 'sawing', label: 'Tính Giá Phôi Cưa & GC', icon: Scissors, shortcut: '⌘5' },
    { id: 'machining', label: 'Tính Giá Chỉ Gia Công CNC', icon: Wrench, shortcut: '⌘6' },
    { id: 'master_data', label: 'Quản Lý Master Data', icon: Database, shortcut: '⌘7' },
    { id: 'analytics', label: 'Báo Cáo Thống Kê RFQ', icon: TrendingUp, shortcut: '⌘8' },
  ];

  const adminNavItems = [
    { id: 'users', label: 'Quản Lý Quyền & Tài Khoản', icon: Users, shortcut: '⌘U' },
    { id: 'health_check', label: 'Kiểm Tra Kết Nối DB (Health)', icon: Activity, shortcut: '⌘H' },
  ];

  return (
    <aside
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative h-screen flex-shrink-0 transition-all duration-300 ease-in-out bg-[#0F172A] border-r border-[#1E293B] flex flex-col z-30 select-none shadow-xl ${
        isHovered ? 'w-[280px]' : 'w-[68px]'
      }`}
    >
      {/* Sidebar Header */}
      <div className="h-16 px-3.5 flex items-center space-x-3 border-b border-[#1E293B] flex-shrink-0 overflow-hidden">
        {/* Logo icon 'D' */}
        <div className="w-8 h-8 rounded-[6px] bg-white text-[#0F172A] flex items-center justify-center flex-shrink-0 font-black text-base shadow-sm">
          D
        </div>
        {isHovered && (
          <div className="truncate">
            <span className="font-extrabold text-white text-sm tracking-tight block leading-tight truncate">
              DSC Quotation
            </span>
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest block truncate">
              DISOCO WORKSPACE
            </span>
          </div>
        )}
      </div>

      {/* Navigation List */}
      <div className="flex-1 py-4 px-2 space-y-1 overflow-y-auto overflow-x-hidden flex flex-col justify-between">
        {/* Main Business Logic Menu Group */}
        <div className="space-y-1">
          {isHovered && (
            <p className="px-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 mt-1">
              NGHIỆP VỤ BÁO GIÁ
            </p>
          )}
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                title={!isHovered ? item.label : undefined}
                className={`w-full flex items-center h-10 px-2.5 rounded-[6px] text-xs transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-[#1E293B] text-white font-bold border-l-2 border-blue-500 shadow-xs'
                    : 'text-slate-300 hover:bg-[#1E293B]/70 hover:text-white font-medium'
                }`}
              >
                <Icon
                  className={`w-4 h-4 flex-shrink-0 stroke-[2] ${
                    isActive ? 'text-white' : 'text-slate-400'
                  } ${!isHovered ? 'mx-auto' : 'mr-3'}`}
                />
                {isHovered && (
                  <>
                    <span className="truncate text-left flex-1 text-slate-200 font-semibold">{item.label}</span>
                    <kbd className="text-[9px] font-mono text-slate-400 bg-[#0F172A] border border-[#334155] px-1 py-0.5 rounded-[3px]">
                      {item.shortcut}
                    </kbd>
                  </>
                )}
              </button>
            );
          })}
        </div>

        {/* System Administration Group */}
        <div className="pt-4 border-t border-[#1E293B] space-y-1">
          {isHovered && (
            <p className="px-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
              HỆ THỐNG
            </p>
          )}
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                title={!isHovered ? item.label : undefined}
                className={`w-full flex items-center h-10 px-2.5 rounded-[6px] text-xs transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-[#1E293B] text-white font-bold border-l-2 border-blue-500 shadow-xs'
                    : 'text-slate-300 hover:bg-[#1E293B]/70 hover:text-white font-medium'
                }`}
              >
                <Icon
                  className={`w-4 h-4 flex-shrink-0 stroke-[2] ${
                    isActive ? 'text-white' : 'text-slate-400'
                  } ${!isHovered ? 'mx-auto' : 'mr-3'}`}
                />
                {isHovered && (
                  <>
                    <span className="truncate text-left flex-1 text-slate-200 font-semibold">{item.label}</span>
                    <kbd className="text-[9px] font-mono text-slate-400 bg-[#0F172A] border border-[#334155] px-1 py-0.5 rounded-[3px]">
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
