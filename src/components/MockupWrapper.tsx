import React from 'react';

interface MockupWrapperProps {
  children: React.ReactNode;
  isActive: boolean; // 用于控制是否开启包装
}

export const MockupWrapper: React.FC<MockupWrapperProps> = ({ children, isActive }) => {
  if (!isActive) return <>{children}</>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-200 to-gray-400 flex items-center justify-center p-4 sm:p-10 relative overflow-hidden">
      {/* 极简风背景装饰 */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white/20 blur-[100px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-black/10 blur-[80px] rounded-full pointer-events-none"></div>

      {/* MacBook Pro 外框 */}
      <div className="relative w-full max-w-[1200px] aspect-[16/10] bg-[#1a1a1a] rounded-[2rem] p-3 sm:p-4 shadow-2xl ring-1 ring-gray-400/30">
        
        {/* 摄像头刘海 (Camera Notch) */}
        <div className="absolute top-3 sm:top-4 left-1/2 -translate-x-1/2 w-32 sm:w-48 h-6 sm:h-8 bg-[#1a1a1a] rounded-b-2xl z-50 flex justify-center items-center">
           {/* 摄像头绿灯 */}
           <div className="w-2 h-2 rounded-full bg-blue-900/40 flex items-center justify-center ml-4">
             <div className="w-[4px] h-[4px] rounded-full bg-green-400 shadow-[0_0_6px_#4ade80]"></div>
           </div>
        </div>

        {/* 屏幕内容区（这里放入原本的 App 内容） */}
        <div className="relative w-full h-full bg-white rounded-lg sm:rounded-xl overflow-hidden shadow-inner">
          {children}
        </div>

        {/* 屏幕底部金属转轴底座 */}
        <div className="absolute -bottom-4 sm:-bottom-6 left-1/2 -translate-x-1/2 w-[110%] h-4 sm:h-6 bg-gradient-to-b from-[#d4d4d8] to-[#a1a1aa] rounded-b-[2rem] -z-10 shadow-2xl">
           <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/4 h-1 sm:h-2 bg-[#94a3b8] rounded-b-md"></div>
        </div>
      </div>
    </div>
  );
};
