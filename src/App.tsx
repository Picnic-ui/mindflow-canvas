import React from 'react';
import { DrawingBoard } from './components/DrawingBoard';
import { Toolbar } from './components/Toolbar';
import { MockupWrapper } from './components/MockupWrapper';

function App() {
  // 设置为 true 时开启 MacBook 边框，录屏结束后可改回 false
  const isRecordingMode = false; 

  return (
    <MockupWrapper isActive={isRecordingMode}>
      <div className="w-full h-[100dvh] bg-[#f4ebd8] overflow-hidden font-serif text-[#4a3f35] relative">
        {/* 纸张纹理遮罩 */}
        <div 
          className="absolute inset-0 z-0 pointer-events-none opacity-40 mix-blend-multiply"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />
        
        <div className="relative z-10 w-full h-full">
          <DrawingBoard />
          <Toolbar />
        </div>
      </div>
    </MockupWrapper>
  );
}

export default App;
