import { useState, type FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import { Mail, Lock, LogIn, UserPlus, CheckCircle2, AlertCircle, Loader2, BarChart3 } from 'lucide-react';

export const AuthPage = () => {
  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email || !password) {
      setErrorMsg('Vui lòng nhập đầy đủ Email và Mật khẩu.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        // Đăng ký tài khoản
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) {
          setErrorMsg(error.message);
        } else {
          if (data.session) {
            setSuccessMsg('Đăng ký thành công! Đang chuyển hướng...');
          } else {
            setSuccessMsg(
              'Đăng ký thành công! Vui lòng kiểm tra email nếu dự án yêu cầu xác nhận.'
            );
          }
        }
      } else {
        // Đăng nhập tài khoản
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            setErrorMsg('Email hoặc mật khẩu không chính xác.');
          } else {
            setErrorMsg(error.message);
          }
        }
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F6F3] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans antialiased text-[#111111]">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo: Off-black rounded box #111111 */}
        <div className="flex justify-center mb-3">
          <div className="w-10 h-10 rounded-[6px] bg-[#111111] flex items-center justify-center text-white">
            <BarChart3 className="w-5 h-5 stroke-[2]" />
          </div>
        </div>
        <h2 className="text-center text-xl font-bold text-[#111111] tracking-tight">
          DSC-Quotation-Management
        </h2>
        <p className="mt-1 text-center text-xs text-[#787774]">
          DISOCO — Workspace Báo Giá & Tính Giá Sản Xuất
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-7 px-6 border border-[#EAEAEA] rounded-[10px] sm:px-8 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
          {/* Tabs header */}
          <div className="flex border-b border-[#EAEAEA] mb-5">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(false);
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 pb-2.5 text-center text-xs font-bold transition-colors border-b-2 cursor-pointer ${
                !isSignUp
                  ? 'border-[#111111] text-[#111111]'
                  : 'border-transparent text-[#787774] hover:text-[#111111]'
              }`}
            >
              Đăng nhập
            </button>
            <button
              type="button"
              onClick={() => {
                setIsSignUp(true);
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 pb-2.5 text-center text-xs font-bold transition-colors border-b-2 cursor-pointer ${
                isSignUp
                  ? 'border-[#111111] text-[#111111]'
                  : 'border-transparent text-[#787774] hover:text-[#111111]'
              }`}
            >
              Đăng ký tài khoản
            </button>
          </div>

          {/* Alert Error - Pale Red */}
          {errorMsg && (
            <div className="mb-4 p-3 rounded-[6px] bg-[#FDEBEC] border border-[#FADBDC] flex items-start space-x-2 text-[#9F2F2D] text-xs font-medium">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Alert Success - Pale Green */}
          {successMsg && (
            <div className="mb-4 p-3 rounded-[6px] bg-[#EDF3EC] border border-[#C6E1C4] flex items-start space-x-2 text-[#346538] text-xs font-medium">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-[11px] font-bold text-[#787774] uppercase tracking-wider mb-1">
                Địa chỉ Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#787774]">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nhanvien@disoco.com.vn"
                  className="block w-full pl-9 pr-3 py-2 bg-[#FFFFFF] border border-[#EAEAEA] rounded-[6px] text-[#111111] text-xs placeholder-[#787774] focus:outline-none focus:border-[#111111]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#787774] uppercase tracking-wider mb-1">
                Mật khẩu
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#787774]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-9 pr-3 py-2 bg-[#FFFFFF] border border-[#EAEAEA] rounded-[6px] text-[#111111] text-xs placeholder-[#787774] focus:outline-none focus:border-[#111111]"
                />
              </div>
              {isSignUp && (
                <p className="mt-1 text-[11px] text-[#787774]">
                  Tài khoản mới sẽ mặc định mang vai trò <span className="font-bold text-[#111111]">viewer</span> (chỉ xem). Liên hệ Admin để được cấp thêm quyền.
                </p>
              )}
            </div>

            {/* Primary CTA Button: #111111, rounded-[6px], active scale scale(0.98) */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-2.5 px-4 rounded-[6px] text-xs font-bold text-white bg-[#111111] hover:bg-[#333333] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-3"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isSignUp ? (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Đăng ký ngay
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4 mr-2" />
                  Đăng nhập
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
