import { create } from 'zustand';

export type DrawingMode = 'normal' | 'mandala';
export type BrushType = 'normal' | 'pencil' | 'watercolor';

interface DrawingState {
  color: string;
  brushSize: number;
  clearCanvasSignal: number;
  undoSignal: number;
  mode: DrawingMode;
  brushType: BrushType;
  audioEnabled: boolean;
  mandalaSegments: number;
  isMandalaIntroActive: boolean;
  setColor: (color: string) => void;
  setBrushSize: (size: number) => void;
  clearCanvas: () => void;
  triggerUndo: () => void;
  setMode: (mode: DrawingMode) => void;
  setBrushType: (type: BrushType) => void;
  toggleAudio: () => void;
  setMandalaSegments: (segments: number) => void;
  setMandalaIntroActive: (active: boolean) => void;
}

export const useDrawingStore = create<DrawingState>((set) => ({
  color: '#e27c7c', // default Soft Red
  brushSize: 4, // 默认笔刷调细一点，适合曼陀罗
  clearCanvasSignal: 0,
  undoSignal: 0,
  mode: 'normal',
  brushType: 'normal',
  audioEnabled: false,
  mandalaSegments: 8,
  isMandalaIntroActive: false,
  setColor: (color) => set({ color }),
  setBrushSize: (size) => set({ brushSize: size }),
  clearCanvas: () => set((state) => ({ clearCanvasSignal: state.clearCanvasSignal + 1 })),
  triggerUndo: () => set((state) => ({ undoSignal: state.undoSignal + 1 })),
  setMode: (mode) => set((state) => {
    if (mode === 'mandala' && state.mode !== 'mandala') {
      return { mode, isMandalaIntroActive: true };
    }
    return { mode };
  }),
  setBrushType: (type) => set({ brushType: type }),
  toggleAudio: () => set((state) => ({ audioEnabled: !state.audioEnabled })),
  setMandalaSegments: (segments) => set({ mandalaSegments: segments }),
  setMandalaIntroActive: (active) => set({ isMandalaIntroActive: active }),
}));
