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
    <div className="h-screen w-screen bg-[#F7F6F3] flex font-sans antialiased text-[#111111] overflow-hidden">
      {/* 1. Sidebar đứng làm 1 flex item cố định chiều rộng */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />

      {/* 2. Khung nội dung chính chiếm phần diện tích còn lại */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto">
        <PageHeader title={pageTitle} />
        <main className="flex-1 p-6 min-w-0 animate-fade-in-up">{children}</main>
      </div>
    </div>
  );
};
