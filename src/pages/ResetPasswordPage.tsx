import { useState, type FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import { Lock, Loader2, BarChart3, CheckCircle2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ResetPasswordPage = () => {
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (password.length < 6) {
      setErrorMsg('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setErrorMsg(error.message);
      } else {
        setSuccessMsg('Đổi mật khẩu thành công! Bạn sẽ được chuyển hướng trong giây lát...');
        setTimeout(() => {
          navigate('/');
        }, 3000);
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
        <div className="flex justify-center mb-3">
          <div className="w-10 h-10 rounded-[6px] bg-[#111111] flex items-center justify-center text-white">
            <BarChart3 className="w-5 h-5 stroke-[2]" />
          </div>
        </div>
        <h2 className="text-center text-xl font-bold text-[#111111] tracking-tight">
          DSC-Quotation-Management
        </h2>
        <p className="mt-1 text-center text-xs text-[#787774]">
          Khôi phục mật khẩu mới
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-7 px-6 border border-[#EAEAEA] rounded-[10px] sm:px-8 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
          <h3 className="text-center text-sm font-bold mb-6">
            Thiết Lập Mật Khẩu Mới
          </h3>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-[6px] bg-[#FDEBEC] border border-[#FADBDC] flex items-start space-x-2 text-[#9F2F2D] text-xs font-medium">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-[6px] bg-[#EDF3EC] border border-[#C6E1C4] flex items-start space-x-2 text-[#346538] text-xs font-medium">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-[11px] font-bold text-[#787774] uppercase tracking-wider mb-1">
                Mật khẩu mới
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
            </div>

            <button
              type="submit"
              disabled={loading || !!successMsg}
              className="w-full flex justify-center items-center py-2.5 px-4 rounded-[6px] text-xs font-bold text-white bg-[#111111] hover:bg-[#333333] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-3"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Lưu Mật Khẩu
                </>
              )}
            </button>
          </form>

          <div className="mt-5 text-center">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="text-[#787774] hover:text-[#111111] text-xs font-medium cursor-pointer"
            >
              Quay lại Đăng nhập
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
