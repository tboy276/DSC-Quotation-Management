import { useLocation, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
// Removed useQuotationStore
import { Layout } from '../components/Layout';
import { StatusBadge } from '../components/StatusBadge';
import { MasterDataContainer } from '../components/master-data/MasterDataContainer';
import { PricingCalculatorPage } from './PricingCalculatorPage';
import { QuotationsManager } from '../components/quotations/QuotationsManager';
import { QuotationDocumentsManager } from '../components/quotations/QuotationDocumentsManager';
import { RfqAnalyticsReport } from '../components/analytics/RfqAnalyticsReport';
import {
  User,
  Shield,
  RefreshCw,
  CheckCircle2,
  Lock,
} from 'lucide-react';

import { SystemHealthCheck } from '../components/analytics/SystemHealthCheck';

export const DashboardPage = () => {
  const { user, profile, refreshProfile } = useAuth();
  
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname.split('/')[1] || 'quotations';
  const activeTab = path;

  const email = profile?.email || user?.email || 'N/A';
  const role = profile?.role || 'sales';
  const isEstimator = role === 'estimator';

  const handleTabChange = (tab: string) => {
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

  const AuthWrapper = ({ children, requireEstimator = false, message }: any) => {
    if (requireEstimator && !isEstimator) {
      return (
        <div className="bg-white border border-[#EAEAEA] rounded-[10px] p-8 text-center space-y-3 max-w-md mx-auto my-12 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-[#FDEBEC] text-[#9F2F2D] flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#111111]">Giới Hạn Quyền Truy Cập</h3>
          <p className="text-xs text-[#787774]">
            {message || 'Tính năng này chỉ dành riêng cho vai trò Cán bộ Kỹ thuật Báo giá (Estimator).'}
          </p>
        </div>
      );
    }
    return children;
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={handleTabChange} pageTitle={getPageTitle()}>
      <Routes>
        <Route path="/" element={<Navigate to="/quotations" replace />} />
        <Route path="/quotations" element={<QuotationsManager />} />
        <Route path="/documents" element={<QuotationDocumentsManager />} />
        <Route path="/forging/:rfqItemId?" element={<PricingCalculatorPage />} />
        <Route path="/casting/:rfqItemId?" element={<PricingCalculatorPage />} />
        <Route path="/master_data" element={<MasterDataContainer />} />
        <Route path="/analytics" element={<RfqAnalyticsReport />} />
        <Route path="/health_check" element={
          <AuthWrapper requireEstimator message="Mục kiểm tra tình trạng kết nối DB chỉ dành riêng cho vai trò Cán bộ Kỹ thuật Báo giá (Estimator).">
            <SystemHealthCheck />
          </AuthWrapper>
        } />
        <Route path="/users" element={
          <AuthWrapper requireEstimator message="Mục quản lý danh sách tài khoản chỉ dành riêng cho vai trò Cán bộ Kỹ thuật Báo giá (Estimator).">
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
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1 flex-shrink-0"></div>
                      <p>
                        <strong className="text-[#111111]">Sales:</strong> Tạo RFQ, điền thông tin khách hàng, yêu cầu báo giá. Không thể can thiệp vào các biến số Master Data.
                      </p>
                    </div>
                    <div className="flex items-start space-x-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1 flex-shrink-0"></div>
                      <p>
                        <strong className="text-[#111111]">Estimator:</strong> Toàn quyền kiểm soát. Có thể cập nhật Master Data (giá vật tư, máy móc), tính toán báo giá nội bộ, và phê duyệt các thông số kỹ thuật.
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
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EAEAEA] text-xs text-[#111111]">
                      <tr className="hover:bg-[#FBFBFA]">
                        <td className="py-3.5 px-4 font-bold text-[#111111] flex items-center space-x-2">
                          <div className="w-6 h-6 rounded-full bg-[#111111] text-white flex items-center justify-center text-[10px] font-bold">
                            {email.charAt(0).toUpperCase()}
                          </div>
                          <span>{email}</span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[11px] text-[#787774]">
                          {user?.id ? `${user.id.substring(0, 18)}...` : 'N/A'}
                        </td>
                        <td className="py-3.5 px-4">
                          <StatusBadge role={role} size="sm" />
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-[#EDF3EC] text-[#346538] border border-[#C6E1C4]">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Đang Hoạt Động
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right text-[11px] text-[#787774]">
                          Tài khoản đang đăng nhập
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </AuthWrapper>
        } />
      </Routes>
    </Layout>
  );
};
