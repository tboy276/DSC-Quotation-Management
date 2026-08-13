import { useAuth } from '../context/AuthContext';
import { LogOut, User, ShieldCheck, Factory } from 'lucide-react';

export const Navbar = () => {
  const { user, profile, signOut } = useAuth();

  if (!user) return null;

  const isAdmin = profile?.role === 'admin';

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <Factory className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-wide leading-tight">
              DISOCO <span className="text-blue-400 text-sm font-normal">| DSC Quotation</span>
            </h1>
            <p className="text-xs text-slate-400">Ứng dụng Tính giá Rèn Dập & Đúc Gang</p>
          </div>
        </div>

        {/* User Info & Actions */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3 bg-slate-800/80 px-3.5 py-1.5 rounded-lg border border-slate-700/60">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-300">
              <User className="w-4 h-4" />
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-medium text-slate-200 truncate max-w-[180px]">
                {profile?.email || user.email}
              </p>
              <div className="flex items-center space-x-1 mt-0.5">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                  isAdmin 
                    ? 'bg-amber-100/50 text-amber-700 hover:bg-amber-100 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]' 
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}>
                  <ShieldCheck className="w-3 h-3 mr-1" />
                  {profile?.role || 'sales'}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={signOut}
            className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700 hover:border-slate-600 cursor-pointer"
            title="Đăng xuất"
          >
            <LogOut className="w-4 h-4 text-slate-400" />
            <span className="hidden sm:inline">Đăng xuất</span>
          </button>
        </div>
      </div>
    </header>
  );
};
