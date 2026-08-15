import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, BarChart3 } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo.componentStack);
  }

  public render() {
    if (this.state.hasError) {
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
          </div>

          <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
            <div className="bg-white py-7 px-6 border border-[#EAEAEA] rounded-[10px] sm:px-8 shadow-[0_2px_8px_rgba(0,0,0,0.03)] text-center">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 rounded-full bg-[#FDEBEC] flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-[#9F2F2D]" />
                </div>
              </div>
              
              <div className="mb-6 p-3 rounded-[6px] bg-[#FDEBEC] border border-[#FADBDC] flex items-start space-x-2 text-[#9F2F2D] text-xs font-medium text-left">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                  <p>Đã có lỗi xảy ra. Vui lòng tải lại trang. Nếu lỗi vẫn tiếp diễn, liên hệ Admin.</p>
                  {this.state.error && (
                    <p className="mt-1 text-[10px] opacity-80 break-words font-mono">
                      {this.state.error.toString()}
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={() => window.location.reload()}
                className="w-full flex justify-center items-center py-2.5 px-4 rounded-[6px] text-xs font-bold text-white bg-[#111111] hover:bg-[#333333] active:scale-[0.98] transition-all cursor-pointer"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Tải Lại Trang
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
