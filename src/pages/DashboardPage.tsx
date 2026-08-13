import { useState, useEffect } from 'react';
import { useLocation, Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
// Removed useQuotationStore
import { Layout } from '../components/Layout';
import { StatusBadge } from '../components/StatusBadge';
import { MasterDataContainer } from '../components/master-data/MasterDataContainer';
import { RequireRole } from '../components/RequireRole';
import ForgingCostingPage from './ForgingCostingPage';
import CastingCostingPage from './CastingCostingPage';
import SawingCostingPage from './SawingCostingPage';
import MachiningCostingPage from './MachiningCostingPage';
import { QuotationsManager } from '../components/quotations/QuotationsManager';
import { QuotationDocumentsManager } from '../components/quotations/QuotationDocumentsManager';
import { RfqAnalyticsReport } from '../components/analytics/RfqAnalyticsReport';
import {
  User,
  Shield,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';

import { SystemHealthCheck } from '../components/analytics/SystemHealthCheck';
import { PricingToolsPage } from './PricingToolsPage';
import { fetchAllUserProfiles, updateUserRole, revokeUserProfile } from '../lib/user-service';
import type { UserProfile } from '../types';

function LegacyPricingRedirect({ segment }: { segment: string }) {
  const { rfqItemId } = useParams();
  const target = rfqItemId 
    ? `/pricing-tools/${segment}/${rfqItemId}` 
    : `/pricing-tools/${segment}`;
  return <Navigate to={target} replace />;
}

export const DashboardPage = () => {
  const { user, profile, refreshProfile } = useAuth();
  
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname.split('/')[1] || 'quotations';
  const activeTab = path;

  const [isGlobalDirty, setIsGlobalDirty] = useState(false);

  useEffect(() => {
    const handleDirtyChange = (e: any) => setIsGlobalDirty(Boolean(e.detail));
    window.addEventListener('app-dirty-change', handleDirtyChange);
    return () => window.removeEventListener('app-dirty-change', handleDirtyChange);
  }, []);

  const email = profile?.email || user?.email || 'N/A';
  const role = profile?.role || 'viewer';
  const isAdmin = role === 'admin';

  const handleTabChange = (tab: string) => {
    if (tab === activeTab) return;
    if (isGlobalDirty) {
      const confirmLeave = window.confirm(
        "Bạn có dữ liệu tính giá chưa lưu. Rời khỏi trang sẽ làm mất các thông số đã nhập. Bạn có chắc chắn muốn tiếp tục?"
      );
      if (!confirmLeave) return;
    }
    setIsGlobalDirty(false);
    navigate(`/${tab}`);
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case 'quotations':
        return 'Quản Lý Danh Sách RFQ & Báo Giá (Quotations Manager)';
      case 'documents':
        return 'Danh Sách Văn Bản Báo Giá Gộp (Quotation Documents)';
      case 'forging':
        return 'Tính Giá Báo Giá Rèn Dập (Forging Costing)';
      case 'casting':
        return 'Tính Giá Báo Giá Đúc Gang (Iron Casting Costing)';
      case 'sawing':
        return 'Tính Giá Phôi Cưa & Gia Công (Sawing Costing)';
      case 'machining':
        return 'Tính Giá Chỉ Gia Công CNC (Machining Only)';
      case 'master_data':
        return 'Quản Lý Master Data (Dữ Liệu Cơ Sở)';
      case 'analytics':
        return 'Báo Cáo Thống Kê Tổng Hợp RFQ (RFQ Analytics Report)';
      case 'health_check':
        return 'Kiểm Tra Tình Trạng Kết Nối Database Supabase (Health Check)';
      case 'users':
        return 'Quản Lý Quyền & Tài Khoản Hệ Thống';
      default:
        return 'Quản Lý Báo Giá DISOCO';
    }
  };



  const UsersManagementTab = () => {
    const [profiles, setProfiles] = useState<UserProfile[]>([]);
    const [savingId, setSavingId] = useState<string | null>(null);
    useEffect(() => {
      const loadProfiles = async () => {
        try {
          if (isAdmin) {
            const data = await fetchAllUserProfiles();
            setProfiles(data);
          }
        } catch (e) {
          console.error("Lỗi lấy danh sách tài khoản", e);
        }
      };
      loadProfiles();
    }, []);

    const handleRoleChange = async (userId: string, newRole: string) => {
      if (!window.confirm(`Xác nhận đổi vai trò tài khoản này thành "${newRole}"?`)) return;
      try {
        setSavingId(userId);
        await updateUserRole(userId, newRole);
        const data = await fetchAllUserProfiles();
        setProfiles(data);
      } catch (e: any) {
        alert(e.message || 'Có lỗi xảy ra');
      } finally {
        setSavingId(null);
      }
    };

    const handleRevoke = async (userId: string, email: string) => {
      if (!window.confirm(`Thu hồi toàn bộ quyền của "${email}"? Tài khoản vẫn đăng nhập được nhưng sẽ chỉ còn quyền viewer cho tới khi được cấp lại.`)) return;
      try {
        setSavingId(userId);
        await revokeUserProfile(userId);
        const data = await fetchAllUserProfiles();
        setProfiles(data);
      } catch (e: any) {
        alert(e.message || 'Có lỗi xảy ra');
      } finally {
        setSavingId(null);
      }
    };
    // Nếu không phải admin, chỉ hiển thị chính profile của mình
    const displayProfiles = isAdmin ? profiles : (profile ? [profile] : []);

    return (
      <div className="space-y-5 max-w-5xl mx-auto animate-fade-in-up">
        <div className="bg-white p-4 rounded-[10px] border border-[#EAEAEA] shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-1.5 text-[11px] font-semibold text-[#787774] uppercase tracking-wider">
              <Shield className="w-4 h-4 text-[#111111]" />
              <span>Phân Quyền Hệ Thống DISOCO</span>
            </div>
            <h2 className="text-base font-bold text-[#111111]">Quản Lý Danh Sách Người Dùng & Phân Quyền</h2>
          </div>
          <button
            onClick={refreshProfile}
            className="inline-flex items-center space-x-2 bg-white border border-[#EAEAEA] text-[#111111] px-3 py-1.5 rounded-[6px] text-xs font-bold hover:bg-[#F9F9F8] transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Đồng bộ dữ liệu</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-[10px] border border-[#EAEAEA] shadow-[0_2px_8px_rgba(0,0,0,0.03)] space-y-3">
            <div className="flex items-center space-x-2 text-[#787774] text-xs font-bold uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4" />
              <span>Vai Trò Của Bạn Hiện Tại</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-[8px] bg-[#FBFBFA] border border-[#EAEAEA]">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-[#111111] text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                  {email.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-bold text-[#111111]">{email}</p>
                  <p className="text-xs text-[#787774] capitalize">Role: {role}</p>
                </div>
              </div>
              <StatusBadge role={role} size="sm" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-[10px] border border-[#EAEAEA] shadow-[0_2px_8px_rgba(0,0,0,0.03)] space-y-3">
            <div className="flex items-center space-x-2 text-[#787774] text-xs font-bold uppercase tracking-wider">
              <User className="w-4 h-4" />
              <span>Giải thích phân quyền</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1 flex-shrink-0"></div>
                <p>
                  <strong className="text-[#111111]">Viewer:</strong> Chỉ có quyền xem danh sách và chi tiết các báo giá. Không thể tạo mới hay chỉnh sửa dữ liệu.
                </p>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1 flex-shrink-0"></div>
                <p>
                  <strong className="text-[#111111]">Sales:</strong> Tạo RFQ, cập nhật giá vật tư, yêu cầu báo giá và xuất file báo giá gửi khách.
                </p>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1 flex-shrink-0"></div>
                <p>
                  <strong className="text-[#111111]">Admin:</strong> Toàn quyền kiểm soát. Có thể cập nhật tất cả Master Data, tính toán báo giá nội bộ, và phê duyệt các thông số kỹ thuật.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#EAEAEA] rounded-[10px] overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
          <div className="p-4 border-b border-[#EAEAEA] flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-[#111111]" />
              <h3 className="text-xs font-bold text-[#111111] uppercase tracking-wider">Danh Sách Người Dùng Hiện Tại</h3>
            </div>
            <span className="text-xs text-[#787774]">Phân quyền vai trò được cập nhật trực tiếp qua Supabase Dashboard</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#FBFBFA] border-b border-[#EAEAEA] text-[11px] font-bold uppercase text-[#787774]">
                  <th className="py-3 px-4">Tài khoản Email</th>
                  <th className="py-3 px-4">User ID (Supabase)</th>
                  <th className="py-3 px-4">Vai Trò (Role)</th>
                  <th className="py-3 px-4">Trạng Thái</th>
                  <th className="py-3 px-4 text-right">Ghi Chú</th>
                  <th className="py-3 px-4 text-right">Hành Động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAEAEA] text-xs text-[#111111]">
                {displayProfiles.map(p => (
                  <tr key={p.id} className="hover:bg-[#FBFBFA]">
                    <td className="py-3.5 px-4 font-bold text-[#111111] flex items-center space-x-2">
                      <div className="w-6 h-6 rounded-full bg-[#111111] text-white flex items-center justify-center text-[10px] font-bold">
                        {p.email ? p.email.charAt(0).toUpperCase() : '?'}
                      </div>
                      <span>{p.email}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-[#787774]">
                      {p.id ? `${p.id.substring(0, 18)}...` : 'N/A'}
                    </td>
                    <td className="py-3.5 px-4">
                      {isAdmin && p.id !== user?.id ? (
                        <select
                          value={p.role || 'viewer'}
                          disabled={savingId === p.id}
                          onChange={(e) => handleRoleChange(p.id, e.target.value)}
                          className="text-[11px] font-bold border border-[#EAEAEA] rounded-[6px] px-2 py-1 bg-white cursor-pointer disabled:opacity-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="viewer">viewer</option>
                          <option value="sales">sales</option>
                          <option value="admin">admin</option>
                          <option value="estimator">estimator</option>
                        </select>
                      ) : (
                        <StatusBadge role={p.role || 'viewer'} size="sm" />
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-[#EDF3EC] text-[#346538] border border-[#C6E1C4]">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Đang Hoạt Động
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right text-[11px] text-[#787774]">
                      {p.id === user?.id ? 'Tài khoản đang đăng nhập' : ''}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {isAdmin && p.id !== user?.id && (
                        <button
                          onClick={() => handleRevoke(p.id, p.email || '')}
                          disabled={savingId === p.id}
                          className="text-[11px] font-bold text-[#9F2F2D] hover:underline disabled:opacity-50"
                        >
                          Thu hồi quyền
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={handleTabChange} pageTitle={getPageTitle()}>
      <Routes>
        <Route path="/" element={<Navigate to="/quotations" replace />} />
        <Route path="/quotations" element={<QuotationsManager />} />
        <Route path="/documents" element={<QuotationDocumentsManager />} />
        
        {/* Legacy redirect routes */}
        <Route path="/forging/:rfqItemId?" element={<RequireRole allow={['sales', 'admin']}><LegacyPricingRedirect segment="forging" /></RequireRole>} />
        <Route path="/casting/:rfqItemId?" element={<RequireRole allow={['sales', 'admin']}><LegacyPricingRedirect segment="casting" /></RequireRole>} />
        <Route path="/sawing/:rfqItemId?" element={<RequireRole allow={['sales', 'admin']}><LegacyPricingRedirect segment="sawing" /></RequireRole>} />
        <Route path="/machining/:rfqItemId?" element={<RequireRole allow={['sales', 'admin']}><LegacyPricingRedirect segment="machining" /></RequireRole>} />

        {/* New unified Pricing Tools route group */}
        <Route path="/pricing-tools" element={<RequireRole allow={['sales', 'admin']}><PricingToolsPage /></RequireRole>}>
          <Route index element={<Navigate to="forging" replace />} />
          <Route path="forging/:rfqItemId?" element={<ForgingCostingPage />} />
          <Route path="casting/:rfqItemId?" element={<CastingCostingPage />} />
          <Route path="sawing/:rfqItemId?" element={<SawingCostingPage />} />
          <Route path="machining/:rfqItemId?" element={<MachiningCostingPage />} />
        </Route>

        <Route path="/master_data" element={<RequireRole allow={['sales', 'admin']}><MasterDataContainer /></RequireRole>} />
        <Route path="/analytics" element={<RfqAnalyticsReport />} />
        <Route path="/health_check" element={<RequireRole allow={['admin']}><SystemHealthCheck /></RequireRole>} />
        <Route path="/users" element={<RequireRole allow={['admin']}><UsersManagementTab /></RequireRole>} />
      </Routes>
    </Layout>
  );
};
