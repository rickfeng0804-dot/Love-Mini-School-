import React, { useRef, useState, useEffect } from 'react';
import { Palette, Eraser, RotateCcw, Download, Sparkles, Check } from 'lucide-react';

interface DrawingCanvasProps {
  initialImage?: string;
  onSave?: (dataUrl: string) => void;
}

const PASTEL_COLORS = [
  '#FF7E9D', // Sakura Pink
  '#FFA33C', // Warm Orange
  '#FFD23F', // Sunshine Yellow
  '#4EAE63', // Mint Green
  '#3B9EFF', // Sky Blue
  '#9B51E0', // Lavender Purple
  '#5C3D2E', // Soft Brown
  '#222222', // Charcoal
];

const STAMPS = ['💮', '⭐', '🌸', '🐻', '👑', '💖', '🌼', '🐾'];

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({ initialImage, onSave }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#3B9EFF');
  const [brushSize, setBrushSize] = useState(4);
  const [isEraser, setIsEraser] = useState(false);
  const [selectedStamp, setSelectedStamp] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fill background white
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (initialImage) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.src = initialImage;
    }
  }, [initialImage]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    if (selectedStamp) {
      // Stamp sticker
      ctx.font = '36px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(selectedStamp, x, y);
      triggerSave();
      return;
    }

    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || selectedStamp) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.strokeStyle = isEraser ? '#FFFFFF' : color;
    ctx.lineWidth = isEraser ? brushSize * 3 : brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      triggerSave();
    }
  };

  const triggerSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    if (onSave) onSave(dataUrl);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    triggerSave();
  };

  return (
    <div className="bg-[#FFFDE7] border-4 border-[#5D4037] rounded-[2rem] p-5 shadow-[6px_6px_0px_#FFD54F]">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">✋</span>
          <h4 className="font-black text-[#5D4037] text-sm md:text-base italic flex items-center gap-1">
            繪圖紀錄繪畫板
            <span className="text-xs bg-[#FFD54F] text-[#5D4037] border border-[#5D4037] px-2.5 py-0.5 rounded-full font-bold">繪本塗鴉風</span>
          </h4>
        </div>

        {/* Color / Tool Palette */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-white p-1.5 rounded-full border-2 border-[#5D4037] shadow-[2px_2px_0px_#5D4037]">
            {PASTEL_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  setColor(c);
                  setIsEraser(false);
                  setSelectedStamp(null);
                }}
                className={`w-6 h-6 rounded-full transition-transform border-2 ${
                  color === c && !isEraser && !selectedStamp ? 'scale-125 border-[#5D4037] shadow' : 'border-transparent hover:scale-110'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          {/* Rubber Eraser */}
          <button
            type="button"
            onClick={() => {
              setIsEraser(!isEraser);
              setSelectedStamp(null);
            }}
            className={`p-1.5 px-3 rounded-full border-2 border-[#5D4037] text-xs font-black flex items-center gap-1 transition-all ${
              isEraser ? 'bg-[#FF8A65] text-white shadow-[2px_2px_0px_#5D4037]' : 'bg-white text-[#5D4037] hover:bg-[#FFF3E0] shadow-[2px_2px_0px_#5D4037]'
            }`}
          >
            <Eraser className="w-3.5 h-3.5" /> 橡皮擦
          </button>

          {/* Brush Size */}
          <select
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="bg-white border-2 border-[#5D4037] text-xs font-black text-[#5D4037] rounded-xl px-2 py-1 focus:outline-none shadow-[2px_2px_0px_#5D4037]"
          >
            <option value={2}>細筆</option>
            <option value={5}>中筆</option>
            <option value={10}>粗筆</option>
            <option value={20}>蠟筆號</option>
          </select>

          <button
            type="button"
            onClick={handleClear}
            className="p-1.5 px-3 rounded-full bg-[#FFCDD2] text-[#B71C1C] border-2 border-[#5D4037] text-xs font-black flex items-center gap-1 shadow-[2px_2px_0px_#5D4037]"
          >
            <RotateCcw className="w-3.5 h-3.5" /> 重畫
          </button>
        </div>
      </div>

      {/* Cute Anime Stamps Selector */}
      <div className="flex items-center gap-1.5 mb-2 overflow-x-auto pb-1">
        <span className="text-xs text-[#5D4037] font-black flex items-center gap-1 shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-[#FFB74D]" /> 可愛印章:
        </span>
        {STAMPS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => {
              setSelectedStamp(selectedStamp === s ? null : s);
              setIsEraser(false);
            }}
            className={`px-2 py-0.5 rounded-lg text-lg transition-all border-2 border-[#5D4037] ${
              selectedStamp === s ? 'bg-[#FFD54F] scale-110 shadow-[2px_2px_0px_#5D4037]' : 'bg-white hover:bg-[#FFF8E1]'
            }`}
          >
            {s}
          </button>
        ))}
        {selectedStamp && (
          <span className="text-xs text-[#5D4037] font-black bg-[#FFE082] px-2 py-0.5 rounded-md border border-[#5D4037]">
            點擊畫板蓋章 [{selectedStamp}]
          </span>
        )}
      </div>

      {/* Canvas Box */}
      <div className="relative bg-white border-2 border-dashed border-[#5D4037] rounded-2xl overflow-hidden shadow-inner flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={500}
          height={320}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-[260px] md:h-[300px] cursor-crosshair touch-none"
        />
        {saved && (
          <div className="absolute top-2 right-2 bg-[#C8E6C9] border-2 border-[#5D4037] text-[#2E7D32] text-xs font-black px-2.5 py-1 rounded-full flex items-center gap-1 shadow-[2px_2px_0px_#5D4037] animate-fade-in">
            <Check className="w-3.5 h-3.5" /> 已儲存圖稿
          </div>
        )}
      </div>
      <p className="text-[11px] text-[#5D4037] font-bold mt-2 text-center">
        💡 提示：小朋友可以在此繪圖或蓋印章，作品將自動同步於學生的學習歷程報告中！
      </p>
    </div>
  );
};
