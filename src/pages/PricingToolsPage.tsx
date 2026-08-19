import { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Workflow, Box, Scissors, Wrench } from 'lucide-react';
import { fetchQuoteByItemId } from '../lib/quotation-service';
import { useConfirm } from '../context/ConfirmDialogContext';
import { getTechFamily } from '../utils/tech-family';
import type { TechnologyRequirementType } from '../types/quote';

export const PricingToolsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const confirm = useConfirm();
  const { rfqItemId } = useParams();
  
  // Track if the current child tab has unsaved changes
  const [isChildDirty, setIsChildDirty] = useState(false);
  const [itemTech, setItemTech] = useState<string>('');

  const currentSegment = location.pathname.split('/')[2] || 'forging';

  useEffect(() => {
    if (rfqItemId) {
      fetchQuoteByItemId(rfqItemId).then((res) => {
        const techReq = res?.rfqItem?.technology_requirement as TechnologyRequirementType | undefined;
        
        if (techReq) {
          setItemTech(techReq);
          const correctTab = getTechFamily(techReq);

          if (correctTab && correctTab !== 'unspecified' && currentSegment !== correctTab) {
            navigate(`/pricing-tools/${correctTab}/${rfqItemId}`, { replace: true });
          }
        }
      });
    } else {
      setItemTech('');
    }
  }, [rfqItemId, currentSegment, navigate]);

  // Handle Browser Unload F5
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isChildDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isChildDirty]);

  // Phát event toàn cục để chặn Sidebar
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('app-dirty-change', { detail: isChildDirty }));
    return () => {
      window.dispatchEvent(new CustomEvent('app-dirty-change', { detail: false }));
    };
  }, [isChildDirty]);

  const safeNavigate = async (targetPath: string) => {
    if (isChildDirty) {
      const confirmLeave = await confirm({
        title: 'Dữ Liệu Chưa Được Lưu',
        message: "Bạn có dữ liệu tính giá chưa lưu. Rời khỏi trang sẽ làm mất các thông số đã nhập. Bạn có chắc chắn muốn tiếp tục?",
        confirmLabel: 'Tiếp Tục Rời Trang',
        cancelLabel: 'Ở Lại Trang',
        variant: 'default',
      });
      if (!confirmLeave) return;
    }
    setIsChildDirty(false);
    navigate(targetPath);
  };

  const tabs = [
    { id: 'forging', label: 'Rèn Dập', icon: Workflow },
    { id: 'casting', label: 'Đúc Gang', icon: Box },
    { id: 'sawing', label: 'Phôi Cưa', icon: Scissors },
    { id: 'machining', label: 'Chỉ Gia Công CNC', icon: Wrench },
  ];

  const handleTabClick = (tabId: string) => {
    if (tabId === currentSegment) return;
    
    // Check if locked
    if (rfqItemId && itemTech) {
      const tech = itemTech.toLowerCase();
      let correctTab = 'forging';
      if (tech.includes('cưa')) correctTab = 'sawing';
      else if (tech.includes('đúc')) correctTab = 'casting';
      else if (tech.includes('cnc')) correctTab = 'machining';
      
      if (tabId !== correctTab) {
        return; // Locked
      }
    }

    safeNavigate(rfqItemId ? `/pricing-tools/${tabId}/${rfqItemId}` : `/pricing-tools/${tabId}`);
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
            
            let isLocked = false;
            if (rfqItemId && itemTech) {
              const tech = itemTech.toLowerCase();
              let correctTab = 'forging';
              if (tech.includes('cưa')) correctTab = 'sawing';
              else if (tech.includes('đúc')) correctTab = 'casting';
              else if (tech.includes('cnc')) correctTab = 'machining';
              isLocked = (tab.id !== correctTab);
            }

            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                disabled={isLocked}
                title={isLocked ? `Sản phẩm này thuộc phân hệ công nghệ [${itemTech}], không thể tính giá ở tab khác.` : undefined}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-semibold transition-colors ${
                  isLocked
                    ? 'opacity-40 cursor-not-allowed text-[#787774] hover:bg-transparent'
                    : isActive
                    ? 'bg-white text-[#111111] shadow-sm'
                    : 'text-[#787774] hover:text-[#111111] hover:bg-[#EAEAEA] cursor-pointer'
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
        <Outlet context={{ setIsChildDirty, safeNavigate }} />
      </div>
    </div>
  );
};
