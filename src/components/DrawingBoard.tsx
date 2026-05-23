import React, { useCallback, useEffect, useRef } from 'react';
import { useHandTracking } from '../hooks/useHandTracking';
import { useDrawingStore } from '../store/drawingStore';
import { NormalizedLandmark } from '@mediapipe/tasks-vision';
import { asmrSynth, breathingSynth } from '../utils/audioSynth';

export function DrawingBoard() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerCanvasRef = useRef<HTMLCanvasElement>(null); // New canvas for drawing the static mandala container
  const { color, brushSize, clearCanvasSignal, undoSignal, mode, audioEnabled, mandalaSegments, isMandalaIntroActive, setMandalaIntroActive } = useDrawingStore();
  
  const isDrawingRef = useRef(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  
  // 用于实现阻尼效果的平滑目标位置
  const smoothedPosRef = useRef<{ x: number; y: number } | null>(null);
  
  // Undo history stack
  const historyStackRef = useRef<ImageData[]>([]);

  // Mandala Intro Sequence
  useEffect(() => {
    if (isMandalaIntroActive) {
      breathingSynth.play(); // Start the relaxing drone sound
      
      const timer = setTimeout(() => {
        setMandalaIntroActive(false);
        breathingSynth.stop(); // Fade out the drone sound
      }, 5000); // 5 seconds breathing intro
      
      return () => {
        clearTimeout(timer);
        breathingSynth.stop(); // Ensure it stops if unmounted or interrupted
      };
    }
  }, [isMandalaIntroActive, setMandalaIntroActive]);

  // Draw static mandala container
  useEffect(() => {
    const containerCanvas = containerCanvasRef.current;
    if (!containerCanvas) return;
    const ctx = containerCanvas.getContext('2d');
    if (!ctx) return;

    const handleResize = () => {
      const parent = containerCanvas.parentElement;
      if (parent) {
        containerCanvas.width = parent.clientWidth;
        containerCanvas.height = parent.clientHeight;
        
        ctx.clearRect(0, 0, containerCanvas.width, containerCanvas.height);
        
        if (mode === 'mandala') {
          const cx = containerCanvas.width / 2;
          const cy = containerCanvas.height / 2;
          const radius = Math.min(cx, cy) * 0.95; // increased radius

          // Draw outer glowing ring (Retro Style)
          ctx.beginPath();
          ctx.arc(cx, cy, radius, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(139, 115, 85, 0.4)'; // Warm brown
          ctx.lineWidth = 1;
          // Inner dashed line for a more mystical/drawn feel
          ctx.stroke();
          
          ctx.beginPath();
          ctx.arc(cx, cy, radius - 10, 0, Math.PI * 2);
          ctx.setLineDash([5, 10]);
          ctx.strokeStyle = 'rgba(139, 115, 85, 0.2)';
          ctx.stroke();
          ctx.setLineDash([]); // reset
        }
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, [mode]);

  // Clear canvas effect
  useEffect(() => {
    if (clearCanvasSignal > 0 && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        historyStackRef.current.push(ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height));
        if (historyStackRef.current.length > 20) historyStackRef.current.shift();
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
  }, [clearCanvasSignal]);

  // Undo effect
  useEffect(() => {
    if (undoSignal > 0 && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx && historyStackRef.current.length > 0) {
        const lastState = historyStackRef.current.pop();
        if (lastState) {
          ctx.putImageData(lastState, 0, 0);
        }
      }
    }
  }, [undoSignal]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        const parent = canvas.parentElement;
        if (parent) {
          // Store existing drawing
          const ctx = canvas.getContext('2d');
          const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
          
          canvas.width = parent.clientWidth;
          canvas.height = parent.clientHeight;
          
          if (ctx && imageData) {
            ctx.putImageData(imageData, 0, 0);
          }
          // Reset history on resize to avoid dimension mismatch errors
          historyStackRef.current = [];
        }
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Init size

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleHandUpdate = useCallback((indexFinger: NormalizedLandmark | null, middleFinger: NormalizedLandmark | null) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (!indexFinger || !middleFinger) {
      if (isDrawingRef.current) {
        isDrawingRef.current = false;
        lastPosRef.current = null;
        smoothedPosRef.current = null;
        if (useDrawingStore.getState().audioEnabled) {
          asmrSynth.stopDrawing();
        }
      }
      return;
    }

    const dx = indexFinger.x - middleFinger.x;
    const dy = indexFinger.y - middleFinger.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    const isDrawing = distance > 0.08;

    const targetX = (1 - indexFinger.x) * canvas.width;
    const targetY = indexFinger.y * canvas.height;

    if (isDrawing) {
      const state = useDrawingStore.getState();
      const currentMode = state.mode;
      const isAudioEnabled = state.audioEnabled;

      if (!isDrawingRef.current || !smoothedPosRef.current) {
        // Push current state to history stack BEFORE starting a new stroke
        historyStackRef.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
        if (historyStackRef.current.length > 20) historyStackRef.current.shift();

        isDrawingRef.current = true;
        smoothedPosRef.current = { x: targetX, y: targetY };
        lastPosRef.current = { x: targetX, y: targetY };
        if (isAudioEnabled) {
          asmrSynth.startDrawing();
        }
      }

      // 平滑插值 (Lerp) 实现阻尼感：0.15 的插值系数，数值越小跟随越慢、越柔和
      const lerpFactor = 0.15;
      const x = smoothedPosRef.current.x + (targetX - smoothedPosRef.current.x) * lerpFactor;
      const y = smoothedPosRef.current.y + (targetY - smoothedPosRef.current.y) * lerpFactor;
      smoothedPosRef.current = { x, y };

      // Calculate speed for audio based on smoothed movement
      const moveDx = x - (lastPosRef.current?.x ?? x);
      const moveDy = y - (lastPosRef.current?.y ?? y);
      const speed = Math.sqrt(moveDx * moveDx + moveDy * moveDy);
      
      if (isAudioEnabled) {
        asmrSynth.updateDrawing(speed, indexFinger.y);
      }

      const currentColor = state.color;
      const currentBrushSize = state.brushSize;

      const drawStroke = (startX: number, startY: number, endX: number, endY: number) => {
        const currentBrushType = state.brushType;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        if (currentColor === 'eraser') {
          ctx.globalCompositeOperation = 'destination-out';
          ctx.globalAlpha = 1.0;
          ctx.lineWidth = currentBrushSize * 2;
          ctx.shadowBlur = 0;
          ctx.stroke();
          return;
        }

        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = currentColor;

        if (currentBrushType === 'pencil') {
          // Pencil effect: low opacity, thin lines, slightly offset multiple times to simulate grain
          ctx.globalAlpha = 0.4;
          ctx.lineWidth = currentBrushSize * 0.5;
          ctx.shadowBlur = 0;
          ctx.stroke();
          
          ctx.translate(0.5, 0.5);
          ctx.stroke();
          ctx.translate(-0.5, -0.5);
        } else if (currentBrushType === 'watercolor') {
          // Watercolor effect: very low opacity, large shadow blur, multiple strokes
          ctx.globalAlpha = 0.05;
          ctx.lineWidth = currentBrushSize * 1.5;
          ctx.shadowBlur = currentBrushSize;
          ctx.shadowColor = currentColor;
          for(let j=0; j<3; j++) {
            ctx.stroke();
          }
        } else {
          // Normal mode: ink bleed effect
          ctx.globalAlpha = 0.8;
          ctx.lineWidth = currentBrushSize;
          ctx.shadowBlur = 4;
          ctx.shadowColor = currentColor;
          ctx.stroke();
        }
        
        ctx.globalAlpha = 1.0; // reset
      };

      if (currentMode === 'mandala' && currentColor !== 'eraser') {
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        const segments = useDrawingStore.getState().mandalaSegments;
        const angle = (Math.PI * 2) / segments;
        const radius = Math.min(cx, cy) * 0.95;

        // Container boundary check
        // Calculate distance from center to current and last points
        const distCurrent = Math.sqrt(Math.pow(x - cx, 2) + Math.pow(y - cy, 2));
        
        // If outside container, don't draw
        if (distCurrent > radius) {
          lastPosRef.current = { x, y };
          return;
        }

        // Reset for multiple strokes
        ctx.globalCompositeOperation = 'source-over';

        for (let i = 0; i < segments; i++) {
          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate(i * angle);
          
          // Draw original
          if (lastPosRef.current) {
            drawStroke(lastPosRef.current.x - cx, lastPosRef.current.y - cy, x - cx, y - cy);
            
            // Draw mirrored (for perfect symmetry)
            ctx.scale(-1, 1);
            drawStroke(lastPosRef.current.x - cx, lastPosRef.current.y - cy, x - cx, y - cy);
          }
          
          ctx.restore();
        }
      } else {
        // Normal mode or eraser (eraser doesn't use mandala symmetry to avoid confusion)
        if (lastPosRef.current) {
          drawStroke(lastPosRef.current.x, lastPosRef.current.y, x, y);
        }
      }

      // Reset composite operation
      ctx.globalCompositeOperation = 'source-over';

      lastPosRef.current = { x, y };
    } else {
      if (isDrawingRef.current) {
        isDrawingRef.current = false;
        lastPosRef.current = null;
        smoothedPosRef.current = null;
        if (useDrawingStore.getState().audioEnabled) {
          asmrSynth.stopDrawing();
        }
      }
    }
  }, []);

  const { videoRef, status, errorMessage } = useHandTracking({ onHandUpdate: handleHandUpdate });

  return (
    <div className="relative w-full h-[100dvh] overflow-hidden flex items-center justify-center bg-[#4a3f35]">
      {/* Video Layer - Use object-contain to prevent cropping */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-contain scale-x-[-1] opacity-60"
        playsInline
        muted
      />
      
      {/* Light overlay for retro paper feel instead of dark overlay */}
      <div className="absolute inset-0 bg-[#f4ebd8]/70 pointer-events-none" />

      {/* Static Container Layer (e.g. Mandala Ring) */}
      <canvas
        ref={containerCanvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-10 transition-opacity duration-1000"
        style={{ opacity: mode === 'mandala' ? 1 : 0 }}
      />

      {/* Canvas Layer (ID used for export query) */}
      <canvas
        id="drawing-canvas"
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-20 mix-blend-multiply"
      />

      {/* Mandala Breathing Intro */}
      {isMandalaIntroActive && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-40 pointer-events-none bg-[#f4ebd8]/80 backdrop-blur-md transition-opacity duration-1000">
          <div className="w-64 h-64 rounded-full border border-[#8b7355]/30 flex items-center justify-center animate-[ping_4s_ease-in-out_infinite] shadow-[0_0_40px_rgba(139,115,85,0.15)]">
            <div className="w-48 h-48 rounded-full bg-[#8b7355]/5 flex items-center justify-center">
              <p className="text-[#5c4a3d] tracking-widest text-lg font-serif text-center">
                吸气...<br />呼气...<br />
                <span className="text-sm mt-4 block text-[#8b7355]">此刻你想表达的情绪是什么？</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Status Overlay */}
      {status !== 'ready' && (
        <div className="absolute top-10 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full bg-white/80 backdrop-blur-md border border-[#8b7355]/20 text-[#5c4a3d] shadow-lg flex items-center gap-3 font-serif">
          {status === 'loading' && (
            <>
              <div className="w-4 h-4 border-2 border-[#8b7355] border-t-transparent rounded-full animate-spin" />
              <span>正在感知纸张与笔触...</span>
            </>
          )}
          {status === 'error' && (
            <span className="text-red-700">错误: {errorMessage}</span>
          )}
          {status === 'no-permission' && (
            <span className="text-[#b8703c]">请在浏览器中允许摄像头权限</span>
          )}
        </div>
      )}
    </div>
  );
}
