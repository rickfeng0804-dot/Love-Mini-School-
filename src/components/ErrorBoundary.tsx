import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public props!: Props;
  public state: State = {
    hasError: false,
  };

  constructor(props: Props) {
    super(props);
  }

  public static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error intercepted by ErrorBoundary:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FFFBF0] flex items-center justify-center p-4 text-[#5D4037]">
          <div className="bg-[#FFFDE7] border-4 border-[#5D4037] rounded-[2rem] p-6 sm:p-8 max-w-md w-full text-center shadow-[6px_6px_0px_#FFD54F]">
            <div className="w-14 h-14 bg-[#FFCDD2] text-[#B71C1C] rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-[#5D4037] shadow-[2px_2px_0px_#5D4037]">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-[#5D4037] mb-2">畫面操作重置</h2>
            <p className="text-xs font-bold text-[#5D4037]/80 mb-6 leading-relaxed">
              系統已自動截獲操作異常，點擊下方按鈕即可快速恢復頁面！
            </p>
            <button
              onClick={this.handleReload}
              className="w-full bg-[#FF8A65] active:bg-[#FF7043] text-white font-black text-sm py-3 px-6 rounded-full border-3 border-[#5D4037] shadow-[3px_3px_0px_#5D4037] flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" /> 重新載入畫面
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

