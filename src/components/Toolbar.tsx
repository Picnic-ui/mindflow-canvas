import React, { useState, useRef, useEffect } from 'react';
import { useDrawingStore } from '../store/drawingStore';
import { Eraser, Trash2, Download, Palette, Sparkles, Volume2, VolumeX, PenTool, X, Pencil, Brush, Undo2, BookImage, Trash } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { paperTearSynth } from '../utils/audioSynth';
import { saveArtwork, getAllArtworks, deleteArtwork, Artwork } from '../utils/galleryDB';

const COLORS = [
  '#e27c7c', // 柔和红
  '#f0a868', // 柔和橙
  '#e8ca74', // 柔和黄
  '#93b584', // 柔和绿
  '#79a7c2', // 柔和蓝
  '#9e8ab8', // 柔和靛
  '#c483a9', // 柔和紫
];

export function Toolbar() {
  const { color, brushSize, setColor, setBrushSize, clearCanvas, triggerUndo, mode, setMode, brushType, setBrushType, audioEnabled, toggleAudio, mandalaSegments, setMandalaSegments } = useDrawingStore();
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  
  // New Modal States
  const [feelingColors, setFeelingColors] = useState('');
  const [feelingAssoc, setFeelingAssoc] = useState('');
  const [feelingChange, setFeelingChange] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    if (showGalleryModal) {
      loadArtworks();
    }
  }, [showGalleryModal]);

  const loadArtworks = async () => {
    const data = await getAllArtworks();
    // sort by id descending (newest first)
    setArtworks(data.sort((a, b) => (b.id || 0) - (a.id || 0)));
  };

  const handleDeleteArtwork = async (id: number) => {
    await deleteArtwork(id);
    await loadArtworks();
  };

  const executeDownload = async (withCard: boolean) => {
    // Explicitly target the canvas by ID to avoid capturing the wrong canvas
    const canvas = document.getElementById('drawing-canvas') as HTMLCanvasElement;
    if (!canvas) return;
    
    const tempCanvas = document.createElement('canvas');
    const padding = withCard ? 100 : 0;
    const bottomPadding = withCard ? 400 : 0; // Increased to 400 to ensure all text fits
    
    tempCanvas.width = canvas.width + padding * 2;
    tempCanvas.height = canvas.height + padding + bottomPadding;
    const ctx = tempCanvas.getContext('2d');
    if (!ctx) return;

    // Draw background (Retro paper style instead of dark)
    ctx.fillStyle = '#f4ebd8'; 
    ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

    // Draw mandala ring if in mandala mode (draw this BEFORE the strokes)
    if (mode === 'mandala') {
      const cx = tempCanvas.width / 2;
      const cy = padding + canvas.height / 2;
      const radius = Math.min(canvas.width / 2, canvas.height / 2) * 0.85;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(139, 115, 85, 0.4)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Draw the actual drawing strokes
    ctx.drawImage(canvas, padding, padding);

    if (withCard) {
      // Add polaroid style text
      ctx.fillStyle = '#4a3f35';
      ctx.font = 'normal 48px serif';
      ctx.textAlign = 'center';
      ctx.fillText('心灵日记卡', tempCanvas.width / 2, canvas.height + padding + 60);

      ctx.font = 'normal 20px serif';
      ctx.fillStyle = '#8b7355';
      ctx.textAlign = 'left';
      
      const textStartX = tempCanvas.width / 2 - 350;
      let textY = canvas.height + padding + 130;

      ctx.fillText('Q: 我用了哪些色彩？', textStartX, textY);
      ctx.fillStyle = '#4a3f35';
      ctx.fillText('A: ' + (feelingColors || '...'), textStartX, textY + 35);
      
      textY += 90;
      ctx.fillStyle = '#8b7355';
      ctx.fillText('Q: 这些色彩让我联想到什么？', textStartX, textY);
      ctx.fillStyle = '#4a3f35';
      ctx.fillText('A: ' + (feelingAssoc || '...'), textStartX, textY + 35);

      textY += 90;
      ctx.fillStyle = '#8b7355';
      ctx.fillText('Q: 创作过程中我的情绪有什么变化？', textStartX, textY);
      ctx.fillStyle = '#4a3f35';
      ctx.fillText('A: ' + (feelingChange || '...'), textStartX, textY + 35);
      
      ctx.textAlign = 'right';
      const date = new Date().toLocaleDateString();
      ctx.fillStyle = '#8b7355';
      ctx.fillText(date, tempCanvas.width / 2 + 350, tempCanvas.height - 80); // Moved date up slightly to fit in padding
    }

    // Trigger download
    const dataUrl = tempCanvas.toDataURL('image/png');
    
    // Save to Gallery DB
    await saveArtwork({
      name: feelingColors ? '曼陀罗卡片' : '自由涂鸦',
      feeling: feelingChange || '平静',
      date: new Date().toLocaleDateString(),
      dataUrl
    });

    const link = document.createElement('a');
    link.download = `mandala-${new Date().getTime()}.png`;
    link.href = dataUrl;
    document.body.appendChild(link);
    
    // Play paper tear sound if saving with card
    if (withCard) {
      paperTearSynth.play();
    }
    
    link.click();
    document.body.removeChild(link);
    
    setShowSaveModal(false);
    
    // Show preview modal immediately after downloading
    setPreviewImage(dataUrl);
  };

  const handleDownloadClick = () => {
    if (mode === 'mandala') {
      setShowSaveModal(true);
    } else {
      executeDownload(false);
    }
  };

  return (
    <>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-wrap justify-center items-center gap-x-4 gap-y-2 px-6 py-3 bg-[#fffaf0]/80 backdrop-blur-xl border border-[#8b7355]/20 rounded-3xl shadow-[0_8px_32px_rgba(139,115,85,0.15)] max-w-[95vw] w-max">
        
        {/* Mode & Audio Switcher */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setMode('normal')}
            className={twMerge(
              clsx(
                "p-2.5 rounded-xl transition-all duration-300",
                mode === 'normal' ? "bg-[#8b7355] text-white shadow-md" : "bg-[#8b7355]/5 text-[#8b7355]/60 hover:bg-[#8b7355]/15"
              )
            )}
            title="基础画笔"
          >
            <PenTool className="w-5 h-5" />
          </button>
          <button
            onClick={() => setMode('mandala')}
            className={twMerge(
              clsx(
                "p-2.5 rounded-xl transition-all duration-300",
                mode === 'mandala' ? "bg-[#d4a373] text-white shadow-[0_0_15px_rgba(212,163,115,0.4)]" : "bg-[#8b7355]/5 text-[#8b7355]/60 hover:bg-[#8b7355]/15"
              )
            )}
            title="万花筒模式"
          >
            <Sparkles className="w-5 h-5" />
          </button>
          
          <div className="w-px h-6 bg-[#8b7355]/20 mx-1" />

          <button
            onClick={toggleAudio}
            className={twMerge(
              clsx(
                "p-2.5 rounded-xl transition-all duration-300",
                audioEnabled ? "bg-[#556b2f]/20 text-[#556b2f] shadow-inner" : "bg-[#8b7355]/5 text-[#8b7355]/60 hover:bg-[#8b7355]/15"
              )
            )}
            title="ASMR 绘画音效"
          >
            {audioEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
        </div>
 
        <div className="hidden md:block w-px h-8 bg-[#8b7355]/20 mx-1" />

        {/* Brush Types Switcher */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setBrushType('normal')}
            className={twMerge(
              clsx(
                "p-2.5 rounded-xl transition-all duration-300",
                brushType === 'normal' ? "bg-[#8b7355] text-white shadow-md" : "bg-[#8b7355]/5 text-[#8b7355]/60 hover:bg-[#8b7355]/15"
              )
            )}
            title="基础墨水"
          >
            <PenTool className="w-4 h-4" />
          </button>
          <button
            onClick={() => setBrushType('pencil')}
            className={twMerge(
              clsx(
                "p-2.5 rounded-xl transition-all duration-300",
                brushType === 'pencil' ? "bg-[#8b7355] text-white shadow-md" : "bg-[#8b7355]/5 text-[#8b7355]/60 hover:bg-[#8b7355]/15"
              )
            )}
            title="铅笔"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => setBrushType('watercolor')}
            className={twMerge(
              clsx(
                "p-2.5 rounded-xl transition-all duration-300",
                brushType === 'watercolor' ? "bg-[#8b7355] text-white shadow-md" : "bg-[#8b7355]/5 text-[#8b7355]/60 hover:bg-[#8b7355]/15"
              )
            )}
            title="水彩"
          >
            <Brush className="w-4 h-4" />
          </button>
        </div>
 
        <div className="hidden md:block w-px h-8 bg-[#8b7355]/20 mx-1" />

        {/* Colors */}
        <div className="flex items-center gap-2 relative">
          <div className="relative flex items-center justify-center cursor-pointer">
            <input 
              type="color" 
              value={color === 'eraser' ? '#000000' : color}
              onChange={(e) => setColor(e.target.value)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              title="自定义颜色"
            />
            <div className="p-2 rounded-xl bg-[#8b7355]/5 hover:bg-[#8b7355]/15 text-[#8b7355]/60 transition-colors pointer-events-none">
              <Palette className="w-5 h-5" />
            </div>
          </div>
          
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={twMerge(
                clsx(
                  "w-6 h-6 sm:w-7 sm:h-7 rounded-full transition-all duration-300 border-2",
                  color === c ? "scale-125 border-[#f4ebd8] shadow-[0_0_10px_rgba(0,0,0,0.1)]" : "border-transparent hover:scale-110 opacity-80"
                )
              )}
              style={{ backgroundColor: c }}
              aria-label={`Select color ${c}`}
            />
          ))}
        </div>

        <div className="hidden md:block w-px h-8 bg-[#8b7355]/20 mx-1" />

        {/* Brush Size / Mandala Segments */}
        <div className="flex items-center gap-3 w-[120px] sm:w-[150px]">
          {mode === 'mandala' ? (
            <>
              <span className="text-[#8b7355] text-sm whitespace-nowrap font-serif">轴数: {mandalaSegments}</span>
              <input
                type="range"
                min="4"
                max="12"
                step="2"
                value={mandalaSegments}
                onChange={(e) => setMandalaSegments(Number(e.target.value))}
                className="w-full accent-[#d4a373]"
              />
            </>
          ) : (
            <>
              <div 
                className="w-3 h-3 rounded-full bg-[#8b7355] transition-all" 
                style={{ transform: `scale(${Math.max(0.2, brushSize / 20)})` }} 
              />
              <input
                type="range"
                min="0.5"
                max="40"
                step="0.5"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="w-full accent-[#8b7355]"
              />
            </>
          )}
        </div>

        <div className="hidden md:block w-px h-8 bg-[#8b7355]/20 mx-1" />

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={triggerUndo}
            className="p-2.5 rounded-xl bg-[#8b7355]/5 hover:bg-[#8b7355]/15 text-[#8b7355]/70 transition-colors"
            title="撤回上一步"
          >
            <Undo2 className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => setColor('eraser')}
            className={twMerge(
              clsx(
                "p-2.5 rounded-xl transition-colors",
                color === 'eraser' ? "bg-[#8b7355]/20 text-[#8b7355]" : "bg-[#8b7355]/5 hover:bg-[#8b7355]/15 text-[#8b7355]/70"
              )
            )}
            title="橡皮擦"
          >
            <Eraser className="w-5 h-5" />
          </button>
          
          <button
            onClick={clearCanvas}
            className="p-2.5 rounded-xl bg-[#8b7355]/5 hover:bg-red-900/10 text-[#8b7355]/70 hover:text-red-800 transition-colors"
            title="清空画板"
          >
            <Trash2 className="w-5 h-5" />
          </button>

          <button
            onClick={handleDownloadClick}
            className="p-2.5 rounded-xl bg-[#8b7355] hover:bg-[#705c44] text-white transition-colors shadow-sm ml-1"
            title="保存作品"
          >
            <Download className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => setShowGalleryModal(true)}
            className="p-2.5 rounded-xl bg-[#8b7355]/10 hover:bg-[#8b7355]/20 text-[#8b7355] transition-colors shadow-sm"
            title="我的画稿"
          >
            <BookImage className="w-5 h-5" />
          </button>
        </div>

      </div>

      {/* Mandala Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#4a3f35]/60 backdrop-blur-sm font-serif">
          <div className="bg-[#fffaf0] border border-[#8b7355]/20 p-8 rounded-3xl w-full max-w-md shadow-2xl relative bg-[url('data:image/svg+xml,%3Csvg viewBox=\\'0 0 200 200\\' xmlns=\\'http://www.w3.org/2000/svg\\'%3E%3Cfilter id=\\'noiseFilter\\'%3E%3CfeTurbulence type=\\'fractalNoise\\' baseFrequency=\\'0.65\\' numOctaves=\\'3\\' stitchTiles=\\'stitch\\'/%3E%3C/filter%3E%3Crect width=\\'100%25\\' height=\\'100%25\\' filter=\\'url(%23noiseFilter)\\' opacity=\\'0.05\\'/%3E%3C/svg%3E')]">
            <button 
              onClick={() => setShowSaveModal(false)}
              className="absolute top-4 right-4 text-[#8b7355]/60 hover:text-[#8b7355] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h2 className="text-2xl font-normal text-[#4a3f35] mb-6 text-center border-b border-[#8b7355]/20 pb-4">保存心灵日记</h2>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm text-[#8b7355] mb-2">我用了哪些色彩？</label>
                <input 
                  type="text"
                  placeholder="例如：柔和的蓝色和粉色"
                  value={feelingColors}
                  onChange={(e) => setFeelingColors(e.target.value)}
                  className="w-full bg-[#f4ebd8]/50 border border-[#8b7355]/30 rounded-xl px-4 py-3 text-[#4a3f35] placeholder:text-[#8b7355]/50 focus:outline-none focus:border-[#d4a373] focus:bg-white transition-colors"
                  maxLength={30}
                />
              </div>
              
              <div>
                <label className="block text-sm text-[#8b7355] mb-2">这些色彩让我联想到什么？</label>
                <input 
                  type="text"
                  placeholder="例如：雨后的清晨"
                  value={feelingAssoc}
                  onChange={(e) => setFeelingAssoc(e.target.value)}
                  className="w-full bg-[#f4ebd8]/50 border border-[#8b7355]/30 rounded-xl px-4 py-3 text-[#4a3f35] placeholder:text-[#8b7355]/50 focus:outline-none focus:border-[#d4a373] focus:bg-white transition-colors"
                  maxLength={40}
                />
              </div>

              <div>
                <label className="block text-sm text-[#8b7355] mb-2">创作过程中我的情绪有什么变化？</label>
                <textarea 
                  placeholder="一开始我感到...后来..."
                  value={feelingChange}
                  onChange={(e) => setFeelingChange(e.target.value)}
                  className="w-full bg-[#f4ebd8]/50 border border-[#8b7355]/30 rounded-xl px-4 py-3 text-[#4a3f35] placeholder:text-[#8b7355]/50 focus:outline-none focus:border-[#d4a373] focus:bg-white transition-colors resize-none h-20"
                  maxLength={60}
                />
              </div>
            </div>

            <button
              onClick={() => executeDownload(true)}
              className="w-full mt-8 bg-[#8b7355] text-white py-3 rounded-xl font-medium hover:bg-[#705c44] transition-colors shadow-md flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              撕下这页日记并保存
            </button>
          </div>
        </div>
      )}

      {/* Gallery Modal */}
      {showGalleryModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#4a3f35]/60 backdrop-blur-sm font-serif">
          <div className="bg-[#fffaf0] border border-[#8b7355]/20 p-8 rounded-3xl w-full max-w-4xl h-[80vh] shadow-2xl relative flex flex-col bg-[url('data:image/svg+xml,%3Csvg viewBox=\\'0 0 200 200\\' xmlns=\\'http://www.w3.org/2000/svg\\'%3E%3Cfilter id=\\'noiseFilter\\'%3E%3CfeTurbulence type=\\'fractalNoise\\' baseFrequency=\\'0.65\\' numOctaves=\\'3\\' stitchTiles=\\'stitch\\'/%3E%3C/filter%3E%3Crect width=\\'100%25\\' height=\\'100%25\\' filter=\\'url(%23noiseFilter)\\' opacity=\\'0.05\\'/%3E%3C/svg%3E')]">
            <button 
              onClick={() => setShowGalleryModal(false)}
              className="absolute top-6 right-6 text-[#8b7355]/60 hover:text-[#8b7355] transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            
            <h2 className="text-3xl font-normal text-[#4a3f35] mb-8 text-center border-b border-[#8b7355]/20 pb-4">我的心灵画稿</h2>
            
            <div className="flex-1 overflow-y-auto pr-4 space-y-6">
              {artworks.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-[#8b7355]/60">
                  <BookImage className="w-16 h-16 mb-4 opacity-50" />
                  <p>还未保存过任何画稿</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {artworks.map(art => (
                    <div key={art.id} className="bg-white/50 border border-[#8b7355]/20 p-4 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative group">
                      <img 
                        src={art.dataUrl} 
                        alt={art.name} 
                        className="w-full h-auto rounded-xl mb-4 bg-zinc-950 cursor-pointer hover:opacity-90 transition-opacity" 
                        onClick={() => setPreviewImage(art.dataUrl)}
                        title="点击查看大图"
                      />
                      <h3 className="text-lg text-[#4a3f35] font-medium truncate">{art.name}</h3>
                      <p className="text-sm text-[#8b7355] mt-1">{art.date}</p>
                      
                      <button 
                        onClick={() => art.id && handleDeleteArtwork(art.id)}
                        className="absolute top-6 right-6 p-2 bg-white/80 rounded-full text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
                        title="删除画稿"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-[110] flex items-center justify-center bg-[#4a3f35]/80 backdrop-blur-md font-serif p-4 sm:p-8 cursor-pointer"
          onClick={() => setPreviewImage(null)}
          title="点击任意处关闭"
        >
          <div 
            className="relative max-w-full max-h-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setPreviewImage(null)}
              className="absolute -top-12 right-0 text-white/70 hover:text-white transition-colors bg-black/20 p-2 rounded-full backdrop-blur-sm"
            >
              <X className="w-6 h-6" />
            </button>
            <img 
              src={previewImage} 
              alt="日记卡预览" 
              className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl ring-1 ring-white/20"
            />
          </div>
        </div>
      )}
    </>
  );
}
