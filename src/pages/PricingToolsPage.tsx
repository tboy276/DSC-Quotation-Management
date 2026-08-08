import { useState } from 'react';
import { Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Workflow, Box, Scissors, Wrench } from 'lucide-react';

export const PricingToolsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { rfqItemId } = useParams();
  
  // Track if the current child tab has unsaved changes
  const [isChildDirty, setIsChildDirty] = useState(false);

  const tabs = [
    { id: 'forging', label: 'Rèn Dập', icon: Workflow },
    { id: 'casting', label: 'Đúc Gang', icon: Box },
    { id: 'sawing', label: 'Phôi Cưa', icon: Scissors },
    { id: 'machining', label: 'Chỉ Gia Công CNC', icon: Wrench },
  ];

  const currentSegment = location.pathname.split('/')[2] || 'forging';

  const handleTabClick = (tabId: string) => {
    if (tabId === currentSegment) return;

    if (isChildDirty) {
      const confirmLeave = window.confirm("Bạn có thay đổi chưa lưu ở form hiện tại. Chuyển tab sẽ làm mất dữ liệu chưa lưu. Tiếp tục?");
      if (!confirmLeave) {
        return; // Abort navigation
      }
    }

    // Clear dirty state immediately to prevent double prompts if there's a delay
    setIsChildDirty(false);
    
    if (rfqItemId) {
      navigate(`/pricing-tools/${tabId}/${rfqItemId}`);
    } else {
      navigate(`/pricing-tools/${tabId}`);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#FAFAFA]">
      {/* Navigation Bar */}
      <div className="bg-white border-b border-[#EAEAEA] px-6 py-2 flex items-center space-x-2 shrink-0">
        <span className="text-xs font-bold text-[#787774] uppercase tracking-widest mr-4">Công Cụ Tính Giá:</span>
        <div className="flex space-x-1 bg-[#F5F5F4] p-1 rounded-lg">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = currentSegment === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-semibold transition-colors ${
                  isActive
                    ? 'bg-white text-[#111111] shadow-sm'
                    : 'text-[#787774] hover:text-[#111111] hover:bg-[#EAEAEA]'
                }`}
              >
                <Icon className="w-4 h-4 stroke-[2]" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Child Content */}
      <div className="flex-1 overflow-auto">
        <Outlet context={{ setIsChildDirty }} />
      </div>
    </div>
  );
};
