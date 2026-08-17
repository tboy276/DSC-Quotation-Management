import { useState, useEffect, Suspense, lazy } from 'react';
import { useLocation, Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useConfirm } from '../context/ConfirmDialogContext';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
// Removed useQuotationStore
import { Layout } from '../components/Layout';
import { StatusBadge } from '../components/StatusBadge';
import { RequireRole } from '../components/RequireRole';
import { QuotationsManager } from '../components/quotations/QuotationsManager';
import { QuotationDocumentsManager } from '../components/quotations/QuotationDocumentsManager';

const ForgingCostingPage = lazy(() => import('./ForgingCostingPage'));
const CastingCostingPage = lazy(() => import('./CastingCostingPage'));
const SawingCostingPage = lazy(() => import('./SawingCostingPage'));
const MachiningCostingPage = lazy(() => import('./MachiningCostingPage'));
const MasterDataContainer = lazy(() => import('../components/master-data/MasterDataContainer').then(m => ({ default: m.MasterDataContainer })));
const RfqAnalyticsReport = lazy(() => import('../components/analytics/RfqAnalyticsReport').then(m => ({ default: m.RfqAnalyticsReport })));
import {
  User,
  Shield,
  RefreshCw,
  CheckCircle2,
  Plus,
  Trash2,
  Loader2,
} from 'lucide-react';

import { SystemHealthCheck } from '../components/analytics/SystemHealthCheck';
import { PricingToolsPage } from './PricingToolsPage';
import { fetchAllUserProfiles, updateUserRole, revokeUserProfile, fetchAllowedUsers, addAllowedUser, removeAllowedUser } from '../lib/user-service';
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
  const confirm = useConfirm();
  const toast = useToast();
  
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

  const handleTabChange = async (tab: string) => {
    if (tab === activeTab) return;
    if (isGlobalDirty) {
      const confirmLeave = await confirm({
        title: 'Dữ Liệu Chưa Được Lưu',
        message: "Bạn có dữ liệu tính giá chưa lưu. Rời khỏi trang sẽ làm mất các thông số đã nhập. Bạn có chắc chắn muốn tiếp tục?",
        confirmLabel: 'Tiếp Tục Rời Trang',
        cancelLabel: 'Ở Lại Trang',
        variant: 'default',
      });
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
    const [allowedUsers, setAllowedUsers] = useState<{ email: string; role: string; added_by?: string; created_at: string }[]>([]);
    const [newAllowedEmail, setNewAllowedEmail] = useState('');
    const [newAllowedRole, setNewAllowedRole] = useState<'viewer' | 'sales' | 'admin'>('viewer');
    const [isSubmittingAllowlist, setIsSubmittingAllowlist] = useState(false);

    const loadData = async () => {
      try {
        if (isAdmin) {
          const [profilesData, allowedUsersData] = await Promise.all([
            fetchAllUserProfiles(),
            fetchAllowedUsers()
          ]);
          setProfiles(profilesData);
          setAllowedUsers(allowedUsersData);
        }
      } catch (e) {
        console.error("Lỗi lấy dữ liệu tài khoản", e);
      }
    };

    useEffect(() => {
      loadData();
    }, []);

    const handleRoleChange = async (userId: string, newRole: string) => {
      const confirmed = await confirm({
        title: 'Đổi Vai Trò Tài Khoản',
        message: `Xác nhận đổi vai trò tài khoản này thành "${newRole}"?`,
        confirmLabel: 'Xác Nhận Đổi',
        variant: 'default',
      });
      if (!confirmed) return;
        try {
          setSavingId(userId);
          await updateUserRole(userId, newRole);
          toast.success('Cập nhật quyền thành công!');
          await loadData();
        } catch (e: any) {
          toast.error(e.message || 'Có lỗi xảy ra');
        } finally {
        setSavingId(null);
      }
    };

    const handleRevoke = async (userId: string, email: string) => {
      const confirmed = await confirm({
        title: 'Thu Hồi Quyền Truy Cập',
        message: `Thu hồi toàn bộ quyền của "${email}"? Tài khoản vẫn đăng nhập được nhưng sẽ chỉ còn quyền viewer cho tới khi được cấp lại.`,
        confirmLabel: 'Thu Hồi',
        variant: 'danger',
      });
      if (!confirmed) return;
        try {
          setSavingId(userId);
          await revokeUserProfile(userId);
          toast.success('Thu hồi quyền truy cập thành công!');
          await loadData();
        } catch (e: any) {
          toast.error(e.message || 'Có lỗi xảy ra');
        } finally {
        setSavingId(null);
      }
    };

    const handleAddAllowedUser = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newAllowedEmail.trim()) return;
      
      setIsSubmittingAllowlist(true);
      try {
        await addAllowedUser(newAllowedEmail.trim(), newAllowedRole, user?.email || 'unknown');
        setNewAllowedEmail('');
        toast.success('Thêm email vào allowlist thành công!');
        setNewAllowedRole('viewer');
        await loadData();
      } catch (e: any) {
        toast.error(e.message || 'Có lỗi xảy ra khi thêm allowlist');
      } finally {
        setIsSubmittingAllowlist(false);
      }
    };

    const handleRemoveAllowedUser = async (email: string) => {
      const confirmed = await confirm({
        title: 'Xóa Khỏi Allowlist',
        message: `Xóa "${email}" khỏi danh sách được phép đăng ký? Người dùng này sẽ không thể tạo tài khoản mới.`,
        confirmLabel: 'Xóa',
        variant: 'danger',
      });
      if (!confirmed) return;

      try {
        await removeAllowedUser(email);
        toast.success('Đã xóa khỏi allowlist!');
        await loadData();
      } catch (e: any) {
        toast.error(e.message || 'Có lỗi xảy ra khi xóa allowlist');
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

        {isAdmin && (
          <div className="bg-white border border-[#EAEAEA] rounded-[10px] overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.03)] mt-6">
            <div className="p-4 border-b border-[#EAEAEA] flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4 text-[#111111]" />
                <h3 className="text-xs font-bold text-[#111111] uppercase tracking-wider">Danh Sách Email Được Cấp Quyền Truy Cập (Allowlist)</h3>
              </div>
            </div>
            
            <div className="p-4 border-b border-[#EAEAEA] bg-[#FBFBFA]">
              <form onSubmit={handleAddAllowedUser} className="flex items-center gap-3">
                <input
                  type="email"
                  required
                  placeholder="Nhập email..."
                  value={newAllowedEmail}
                  onChange={(e) => setNewAllowedEmail(e.target.value)}
                  className="flex-1 px-3 py-1.5 border border-[#EAEAEA] rounded-[6px] text-xs focus:outline-none focus:border-[#111111]"
                />
                <select
                  value={newAllowedRole}
                  onChange={(e) => setNewAllowedRole(e.target.value as any)}
                  className="px-3 py-1.5 border border-[#EAEAEA] rounded-[6px] text-xs focus:outline-none focus:border-[#111111] bg-white cursor-pointer"
                >
                  <option value="viewer">viewer</option>
                  <option value="sales">sales</option>
                  <option value="admin">admin</option>
                </select>
                <button
                  type="submit"
                  disabled={isSubmittingAllowlist || !newAllowedEmail}
                  className="inline-flex items-center space-x-1.5 bg-[#111111] text-white px-4 py-1.5 rounded-[6px] text-xs font-bold hover:bg-[#333333] transition-colors disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm vào Allowlist</span>
                </button>
              </form>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#FBFBFA] border-b border-[#EAEAEA] text-[11px] font-bold uppercase text-[#787774]">
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Vai Trò</th>
                    <th className="py-3 px-4">Ngày Thêm</th>
                    <th className="py-3 px-4">Người Thêm</th>
                    <th className="py-3 px-4 text-right">Hành Động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAEAEA] text-xs text-[#111111]">
                  {allowedUsers.map(user => (
                    <tr key={user.email} className="hover:bg-[#FBFBFA]">
                      <td className="py-3.5 px-4 font-bold text-[#111111]">{user.email}</td>
                      <td className="py-3.5 px-4"><StatusBadge role={user.role} size="sm" /></td>
                      <td className="py-3.5 px-4 text-[#787774]">{new Date(user.created_at).toLocaleDateString('vi-VN')}</td>
                      <td className="py-3.5 px-4 text-[#787774]">{user.added_by || '-'}</td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleRemoveAllowedUser(user.email)}
                          className="p-1 text-[#9F2F2D] hover:bg-[#FDEBEC] rounded cursor-pointer transition-colors inline-flex"
                          title="Xóa khỏi danh sách"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {allowedUsers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-[#787774] text-xs">
                        Chưa có email nào trong allowlist
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={handleTabChange} pageTitle={getPageTitle()}>
      <Suspense fallback={<div className="flex justify-center p-12"><Loader2 className="w-6 h-6 animate-spin text-[#787774]" /></div>}>
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
      </Suspense>
    </Layout>
  );
};
