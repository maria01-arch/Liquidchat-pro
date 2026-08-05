import React, { useRef, useState, useEffect } from 'react';
import {
  X,
  Crop,
  Edit3,
  ArrowUpRight,
  RotateCcw,
  Download,
  Send,
  Check,
  Undo
} from 'lucide-react';

interface ImageEditorModalProps {
  imageUrl: string;
  fileName: string;
  onSave: (editedDataUrl: string) => void;
  onClose: () => void;
}

type ToolMode = 'none' | 'pen' | 'arrow' | 'crop';
type AspectRatio = 'free' | '1:1' | '4:3' | '16:9';

export const ImageEditorModal: React.FC<ImageEditorModalProps> = ({
  imageUrl,
  fileName,
  onSave,
  onClose,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [activeTool, setActiveTool] = useState<ToolMode>('pen');
  const [color, setColor] = useState<string>('#ef4444'); // Red default
  const [lineWidth, setLineWidth] = useState<number>(4);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('free');

  // History stack for undo
  const [history, setHistory] = useState<ImageData[]>([]);
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);

  // Drawing & Arrow state
  const isDrawingRef = useRef(false);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  const tempCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Crop Box state relative to canvas [0..1] percentages
  const [cropBox, setCropBox] = useState<{ x: number; y: number; w: number; h: number }>({
    x: 0.1,
    y: 0.1,
    w: 0.8,
    h: 0.8,
  });
  const [isDraggingCrop, setIsDraggingCrop] = useState<string | null>(null); // 'move', 'nw', 'ne', 'sw', 'se'
  const dragStartRef = useRef<{ x: number; y: number; box: { x: number; y: number; w: number; h: number } } | null>(null);

  // Initialize canvas with image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;
    img.onload = () => {
      setOriginalImage(img);
      const canvas = canvasRef.current;
      if (!canvas) return;

      const maxDim = 1200;
      let w = img.width;
      let h = img.height;

      if (w > maxDim || h > maxDim) {
        if (w > h) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
      }

      canvas.width = w;
      canvas.height = h;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, w, h);
        const initialData = ctx.getImageData(0, 0, w, h);
        setHistory([initialData]);
      }
    };
  }, [imageUrl]);

  const pushHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory((prev) => [...prev, data]);
  };

  const handleUndo = () => {
    if (history.length <= 1) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const newHistory = [...history];
    newHistory.pop(); // remove current state
    const previousState = newHistory[newHistory.length - 1];
    canvas.width = previousState.width;
    canvas.height = previousState.height;
    ctx.putImageData(previousState, 0, 0);
    setHistory(newHistory);
  };

  const handleReset = () => {
    if (!originalImage || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = originalImage.width;
    let h = originalImage.height;
    const maxDim = 1200;
    if (w > maxDim || h > maxDim) {
      if (w > h) {
        h = Math.round((h * maxDim) / w);
        w = maxDim;
      } else {
        w = Math.round((w * maxDim) / h);
        h = maxDim;
      }
    }
    canvas.width = w;
    canvas.height = h;
    ctx.drawImage(originalImage, 0, 0, w, h);
    const initialData = ctx.getImageData(0, 0, w, h);
    setHistory([initialData]);
    setCropBox({ x: 0.1, y: 0.1, w: 0.8, h: 0.8 });
  };

  // Canvas Mouse / Touch events for Pen & Arrow
  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const handlePointerDown = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (activeTool === 'crop' || activeTool === 'none') return;
    isDrawingRef.current = true;
    const pos = getCanvasCoordinates(e);
    startPosRef.current = pos;

    const canvas = canvasRef.current;
    if (!canvas) return;

    if (activeTool === 'pen') {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    } else if (activeTool === 'arrow') {
      // Create temporary canvas snapshot
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext('2d');
      if (tempCtx) {
        tempCtx.drawImage(canvas, 0, 0);
        tempCanvasRef.current = tempCanvas;
      }
    }
  };

  const handlePointerMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || activeTool === 'crop' || activeTool === 'none') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const pos = getCanvasCoordinates(e);

    if (activeTool === 'pen') {
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    } else if (activeTool === 'arrow' && startPosRef.current && tempCanvasRef.current) {
      // Redraw snapshot then draw arrow
      ctx.drawImage(tempCanvasRef.current, 0, 0);
      drawArrow(ctx, startPosRef.current.x, startPosRef.current.y, pos.x, pos.y, color, lineWidth);
    }
  };

  const handlePointerUp = () => {
    if (isDrawingRef.current) {
      isDrawingRef.current = false;
      pushHistory();
    }
    startPosRef.current = null;
    tempCanvasRef.current = null;
  };

  // Helper to draw clean arrow
  const drawArrow = (
    ctx: CanvasRenderingContext2D,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    arrowColor: string,
    width: number
  ) => {
    const headlen = Math.max(16, width * 3.5);
    const dx = toX - fromX;
    const dy = toY - fromY;
    const angle = Math.atan2(dy, dx);

    ctx.save();
    ctx.strokeStyle = arrowColor;
    ctx.fillStyle = arrowColor;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';

    // Shaft line
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    // Arrowhead
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  // Crop execution
  const applyCrop = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cropX = Math.round(cropBox.x * canvas.width);
    const cropY = Math.round(cropBox.y * canvas.height);
    const cropW = Math.round(cropBox.w * canvas.width);
    const cropH = Math.round(cropBox.h * canvas.height);

    if (cropW < 20 || cropH < 20) return;

    const croppedData = ctx.getImageData(cropX, cropY, cropW, cropH);

    canvas.width = cropW;
    canvas.height = cropH;
    ctx.putImageData(croppedData, 0, 0);

    pushHistory();
    setActiveTool('pen');
    setCropBox({ x: 0.1, y: 0.1, w: 0.8, h: 0.8 });
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `edited-${fileName || 'image.png'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleSend = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    onSave(dataUrl);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col justify-between p-3 sm:p-6 text-slate-100 animate-in fade-in duration-200">
      {/* Top Header Controls */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div>
            <h3 className="font-bold text-sm sm:text-base">Edit Image</h3>
            <p className="text-[11px] text-slate-400 truncate max-w-[180px] sm:max-w-xs">{fileName}</p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleUndo}
            disabled={history.length <= 1}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 disabled:opacity-40 text-slate-200 transition-colors"
            title="Undo"
          >
            <Undo className="w-4 h-4" />
          </button>
          <button
            onClick={handleReset}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 transition-colors"
            title="Reset to Original"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={handleDownload}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-sky-400 hover:text-sky-300 transition-colors flex items-center space-x-1 text-xs font-semibold px-3"
            title="Download Image"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Download</span>
          </button>
          <button
            onClick={handleSend}
            className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs flex items-center space-x-1.5 shadow-lg shadow-sky-500/25 transition-all active:scale-95"
          >
            <Send className="w-4 h-4" />
            <span>Send</span>
          </button>
        </div>
      </div>

      {/* Canvas Workspace Center */}
      <div className="flex-1 flex items-center justify-center p-2 relative overflow-hidden min-h-0 select-none">
        <div className="relative max-w-full max-h-full flex items-center justify-center">
          <canvas
            ref={canvasRef}
            onMouseDown={handlePointerDown}
            onMouseMove={handlePointerMove}
            onMouseUp={handlePointerUp}
            onTouchStart={handlePointerDown}
            onTouchMove={handlePointerMove}
            onTouchEnd={handlePointerUp}
            className={`max-w-full max-h-[60vh] sm:max-h-[68vh] object-contain rounded-lg shadow-2xl border border-slate-800 ${
              activeTool === 'pen' || activeTool === 'arrow' ? 'cursor-crosshair' : 'cursor-default'
            }`}
          />

          {/* Crop Box Overlay */}
          {activeTool === 'crop' && (
            <div
              className="absolute border-2 border-sky-400 bg-sky-500/10 pointer-events-auto shadow-2xl"
              style={{
                left: `${cropBox.x * 100}%`,
                top: `${cropBox.y * 100}%`,
                width: `${cropBox.w * 100}%`,
                height: `${cropBox.h * 100}%`,
              }}
            >
              <div className="absolute top-2 right-2 flex space-x-1">
                <button
                  onClick={applyCrop}
                  className="px-3 py-1 bg-sky-500 text-white font-bold text-xs rounded-lg shadow-md hover:bg-sky-400 flex items-center space-x-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Apply Crop</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Tool Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-xl">
        {/* Tool Mode Toggles */}
        <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTool('pen')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
              activeTool === 'pen' ? 'bg-sky-500 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            <span>Draw</span>
          </button>
          <button
            onClick={() => setActiveTool('arrow')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
              activeTool === 'arrow' ? 'bg-sky-500 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Arrow</span>
          </button>
          <button
            onClick={() => setActiveTool('crop')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
              activeTool === 'crop' ? 'bg-sky-500 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Crop className="w-4 h-4" />
            <span>Crop</span>
          </button>
        </div>

        {/* Color Palette (for Pen and Arrow) */}
        {activeTool !== 'crop' && (
          <div className="flex items-center space-x-2">
            {['#ef4444', '#f59e0b', '#0284c7', '#22c55e', '#ffffff'].map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                style={{ backgroundColor: c }}
                className={`w-6 h-6 rounded-full transition-transform ${
                  color === c ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-slate-900' : 'opacity-80 hover:opacity-100'
                }`}
              />
            ))}

            {/* Stroke Width Selector */}
            <div className="flex items-center space-x-1 ml-2 border-l border-slate-800 pl-3">
              {[
                { label: 'S', w: 3 },
                { label: 'M', w: 6 },
                { label: 'L', w: 10 },
              ].map((sw) => (
                <button
                  key={sw.label}
                  onClick={() => setLineWidth(sw.w)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors ${
                    lineWidth === sw.w ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {sw.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quick Presets for Crop */}
        {activeTool === 'crop' && (
          <div className="flex items-center space-x-1 text-xs text-slate-400">
            <span>Preset:</span>
            {[
              { label: 'Free', aspect: 'free', box: { x: 0.1, y: 0.1, w: 0.8, h: 0.8 } },
              { label: 'Square 1:1', aspect: '1:1', box: { x: 0.15, y: 0.15, w: 0.7, h: 0.7 } },
              { label: 'Wide 16:9', aspect: '16:9', box: { x: 0.05, y: 0.2, w: 0.9, h: 0.5 } },
            ].map((p) => (
              <button
                key={p.label}
                onClick={() => {
                  setAspectRatio(p.aspect as AspectRatio);
                  setCropBox(p.box);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                  aspectRatio === p.aspect ? 'bg-sky-500/20 text-sky-400 font-bold' : 'hover:bg-slate-800 text-slate-300'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
