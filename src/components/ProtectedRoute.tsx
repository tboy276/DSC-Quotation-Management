import type { ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';
import { AuthPage } from '../pages/AuthPage';
import { Loader2, AlertCircle } from 'lucide-react';

export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { user, loading, isConfigured } = useAuth();

  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-900">
        <div className="max-w-lg w-full bg-white border border-amber-200 rounded-2xl p-6 shadow-xs text-slate-800">
          <div className="flex items-center space-x-3 text-amber-600 mb-4">
            <AlertCircle className="w-6 h-6 flex-shrink-0" />
            <h2 className="text-lg font-bold text-slate-900">Chưa cấu hình Supabase</h2>
          </div>
          <p className="text-xs text-slate-600 mb-4 leading-relaxed">
            Vui lòng điền giá trị <code className="bg-slate-100 text-amber-800 px-1.5 py-0.5 rounded border border-slate-200">VITE_SUPABASE_URL</code> và <code className="bg-slate-100 text-amber-800 px-1.5 py-0.5 rounded border border-slate-200">VITE_SUPABASE_ANON_KEY</code> chính xác trong file <code className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded border border-slate-200">.env</code>.
          </p>
          <div className="bg-slate-900 p-4 rounded-xl text-xs font-mono text-slate-300 space-y-1">
            <p className="text-slate-500"># Mẫu trong file .env:</p>
            <p className="text-blue-300">VITE_SUPABASE_URL=https://your-project.supabase.co</p>
            <p className="text-emerald-300">VITE_SUPABASE_ANON_KEY=sb_publishable_...</p>
          </div>
          <p className="text-xs text-slate-500 mt-4 text-center">
            Sau khi điền file <code className="text-slate-900 font-semibold">.env</code>, hãy tải lại trang này (F5).
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-700 space-y-3 font-sans">
        <Loader2 className="w-7 h-7 animate-spin text-slate-900" />
        <p className="text-xs font-medium text-slate-500">Đang tải thông tin xác thực...</p>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return <>{children}</>;
};
