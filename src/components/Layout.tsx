import { useState, type ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { PageHeader } from './PageHeader';

interface LayoutProps {
  children: ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  pageTitle: string;
}

export const Layout = ({
  children,
  activeTab,
  setActiveTab,
  pageTitle,
}: LayoutProps) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-[#F7F6F3] flex font-sans antialiased text-[#111111] overflow-x-hidden">
      {/* 1. Sidebar cố định bên trái (Width 280px / 72px) */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />

      {/* 2. Vùng nội dung chính bên phải */}
      {/* NOTE: overflow-visible (default) là BẮT BUỘC ở đây — overflow:hidden trên flex parent
          tạo stacking context mới, clip các children có position:fixed (Modal/Dialog) khiến
          chúng bị cắt và lệch lên phía trên màn hình thay vì phủ toàn viewport. */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        <PageHeader title={pageTitle} />
        <main className="flex-1 p-6 overflow-y-auto animate-fade-in-up">{children}</main>
      </div>
    </div>
  );
};
