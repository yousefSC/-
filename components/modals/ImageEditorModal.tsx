import React, { useRef, useEffect, useState, useCallback } from 'react';
import Icon from '../Icon';
import { TranslationKey } from '../../types';
import Tooltip from '../ui/Tooltip';

interface ImageEditorModalProps {
  image: { dataUrl: string; name: string };
  onClose: () => void;
  onComplete: (editedDataUrl: string, name: string) => void;
  t: (key: TranslationKey) => string;
}

const ToolButton: React.FC<{ icon: string; title: string; onClick: () => void; disabled?: boolean; isActive?: boolean }> = ({ icon, title, onClick, disabled, isActive }) => (
    <Tooltip text={title}>
      <button
          onClick={onClick}
          disabled={disabled}
          className={`p-2 rounded-full text-white transition-colors ${
            isActive ? 'bg-white/30' : 'hover:bg-white/20'
          } disabled:opacity-30 disabled:cursor-not-allowed`}
      >
          <Icon name={icon} className="w-5 h-5" />
      </button>
    </Tooltip>
);

const HANDLE_SIZE = 10;
const MIN_CROP_SIZE = 20;

type CropInteractionType = 'move' | 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'drawing';

const getHandles = (rect: { x: number; y: number; width: number; height: number }) => {
    const { x, y, width, height } = rect;
    return {
        nw: { x: x, y: y },
        n: { x: x + width / 2, y: y },
        ne: { x: x + width, y: y },
        w: { x: x, y: y + height / 2 },
        e: { x: x + width, y: y + height / 2 },
        sw: { x: x, y: y + height },
        s: { x: x + width / 2, y: y + height },
        se: { x: x + width, y: y + height },
    };
};

const getHandleAt = (pos: { x: number; y: number }, rect: { x: number; y: number; width: number; height: number }): CropInteractionType | null => {
    const handles = getHandles(rect);
    const handleHitboxRadius = HANDLE_SIZE; 

    for (const key of Object.keys(handles)) {
        const handle = handles[key as keyof typeof handles];
        if (
            pos.x >= handle.x - handleHitboxRadius && pos.x <= handle.x + handleHitboxRadius &&
            pos.y >= handle.y - handleHitboxRadius && pos.y <= handle.y + handleHitboxRadius
        ) {
            return key as CropInteractionType;
        }
    }
    
    if (pos.x >= rect.x && pos.x <= rect.x + rect.width && pos.y >= rect.y && pos.y <= rect.y + rect.height) {
        return 'move';
    }

    return null;
};

const ImageEditorModal: React.FC<ImageEditorModalProps> = ({ image, onClose, onComplete, t }) => {
  const imageCanvasRef = useRef<HTMLCanvasElement>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushColor] = useState('#FFFFFF');
  const [brushSize] = useState(4);
  
  const [mode, setMode] = useState<'idle' | 'draw' | 'crop'>('idle');
  const [cropRect, setCropRect] = useState<{ x: number, y: number, width: number, height: number } | null>(null);
  const [cropInteraction, setCropInteraction] = useState<{
      type: CropInteractionType;
      startX: number;
      startY: number;
      startRect: { x: number; y: number; width: number; height: number };
  } | null>(null);
  const [cursor, setCursor] = useState('default');

  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  const canUndo = historyIndex >= 0;
  const canRedo = historyIndex < history.length - 1;

  const drawImageToCanvas = useCallback((source: HTMLImageElement | string) => {
    const img = source instanceof HTMLImageElement ? source : new Image();
    
    const onload = () => {
      const canvas = imageCanvasRef.current;
      const drawingCanvas = drawingCanvasRef.current;
      if (!canvas || !drawingCanvas) return;

      const container = canvas.parentElement;
      if (!container) return;
      
      const containerAspect = container.clientWidth / container.clientHeight;
      const imgAspect = img.width / img.height;
      
      let newWidth, newHeight;
      if (containerAspect > imgAspect) {
        newHeight = container.clientHeight;
        newWidth = newHeight * imgAspect;
      } else {
        newWidth = container.clientWidth;
        newHeight = newWidth / imgAspect;
      }

      canvas.width = newWidth;
      canvas.height = newHeight;
      drawingCanvas.width = newWidth;
      drawingCanvas.height = newHeight;

      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, newWidth, newHeight);
    };

    if (typeof source === 'string') {
        img.src = source;
        img.onload = onload;
        img.onerror = () => console.error("Failed to load image for canvas.");
    } else if (img.complete) {
        onload();
    } else {
        img.onload = onload;
    }
  }, []);

  const clearDrawing = useCallback(() => {
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
    setHistory([]);
    setHistoryIndex(-1);
  }, []);

  const drawCropOverlay = useCallback((rect: { x: number, y: number, width: number, height: number } | null) => {
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (rect) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.clearRect(rect.x, rect.y, rect.width, rect.height);
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 1;
      ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
      ctx.setLineDash([]);

      const handles = getHandles(rect);
      ctx.fillStyle = 'white';
      Object.values(handles).forEach(handle => {
          ctx.fillRect(handle.x - HANDLE_SIZE / 2, handle.y - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE);
      });
    }
  }, []);

  const redrawCanvasFromHistory = useCallback((index: number) => {
    const canvas = drawingCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (index > -1 && history[index]) {
      ctx.putImageData(history[index], 0, 0);
    }
  }, [history]);

  useEffect(() => {
    drawImageToCanvas(image.dataUrl);
    const handler = () => drawImageToCanvas(image.dataUrl);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [image.dataUrl, drawImageToCanvas]);

  useEffect(() => {
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (mode === 'crop') {
        drawCropOverlay(cropRect);
    } else {
        redrawCanvasFromHistory(historyIndex);
    }
  }, [mode, cropRect, drawCropOverlay, redrawCanvasFromHistory, historyIndex]);

  const getCoords = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    const canvas = drawingCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const startDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const ctx = drawingCanvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCoords(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  }, []);

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    const ctx = drawingCanvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCoords(e);
    ctx.lineTo(x, y);
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 2;
    ctx.stroke();
  }, [isDrawing, brushColor, brushSize]);

  const stopDrawing = useCallback(() => {
    const ctx = drawingCanvasRef.current?.getContext('2d');
    if (!isDrawing || !ctx || !drawingCanvasRef.current) return;
    ctx.closePath();
    setIsDrawing(false);
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(ctx.getImageData(0, 0, drawingCanvasRef.current.width, drawingCanvasRef.current.height));
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [isDrawing, history, historyIndex]);

  const handleStartInteraction = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const pos = getCoords(e);
    if (mode === 'draw') {
        startDrawing(e);
        return;
    }
    if (mode === 'crop') {
        if (cropRect) {
            const handle = getHandleAt(pos, cropRect);
            if (handle) {
                setCropInteraction({ type: handle, startX: pos.x, startY: pos.y, startRect: { ...cropRect } });
                return;
            }
        }
        setCropInteraction({ type: 'drawing', startX: pos.x, startY: pos.y, startRect: { x: pos.x, y: pos.y, width: 0, height: 0 } });
        setCropRect({ x: pos.x, y: pos.y, width: 0, height: 0 });
    }
  }, [mode, startDrawing, cropRect]);

  const handleMoveInteraction = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const pos = getCoords(e);
    let newCursor = 'default';
    if (mode === 'crop') newCursor = 'crosshair';
    if (mode === 'draw') newCursor = 'crosshair';
    if (mode === 'crop' && !cropInteraction && cropRect) {
        const handle = getHandleAt(pos, cropRect);
        if (handle === 'move') newCursor = 'move';
        else if (handle === 'n' || handle === 's') newCursor = 'ns-resize';
        else if (handle === 'e' || handle === 'w') newCursor = 'ew-resize';
        else if (handle === 'nw' || handle === 'se') newCursor = 'nwse-resize';
        else if (handle === 'ne' || handle === 'sw') newCursor = 'nesw-resize';
    }
    setCursor(newCursor);

    if (mode === 'draw') {
        draw(e);
        return;
    }

    if (mode === 'crop' && cropInteraction) {
        e.preventDefault();
        const { type, startX, startY, startRect } = cropInteraction;
        const dx = pos.x - startX;
        const dy = pos.y - startY;

        let { x, y, width, height } = startRect;

        if (type === 'drawing') {
            x = Math.min(startX, pos.x);
            y = Math.min(startY, pos.y);
            width = Math.abs(pos.x - startX);
            height = Math.abs(pos.y - startY);
        } else if (type === 'move') {
            x += dx;
            y += dy;
        } else { // Resizing
            if (type.includes('n')) { const newY = startRect.y + dy; const newH = startRect.height - dy; if (newH > MIN_CROP_SIZE) { y = newY; height = newH; } }
            if (type.includes('s')) { const newH = startRect.height + dy; if (newH > MIN_CROP_SIZE) height = newH; }
            if (type.includes('w')) { const newX = startRect.x + dx; const newW = startRect.width - dx; if (newW > MIN_CROP_SIZE) { x = newX; width = newW; } }
            if (type.includes('e')) { const newW = startRect.width + dx; if (newW > MIN_CROP_SIZE) width = newW; }
        }
        setCropRect({ x, y, width, height });
    }
  }, [mode, draw, cropInteraction, cropRect]);

  const handleStopInteraction = useCallback(() => {
    if (mode === 'draw') { stopDrawing(); return; }
    if (mode === 'crop' && cropInteraction) {
        if (cropRect && (cropRect.width < MIN_CROP_SIZE || cropRect.height < MIN_CROP_SIZE)) {
            setCropRect(null);
        }
        setCropInteraction(null);
    }
  }, [mode, stopDrawing, cropInteraction, cropRect]);

  const applyCrop = () => {
    if (!cropRect || !imageCanvasRef.current || !drawingCanvasRef.current || cropRect.width < 1 || cropRect.height < 1) return;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = imageCanvasRef.current.width;
    tempCanvas.height = imageCanvasRef.current.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    tempCtx.drawImage(imageCanvasRef.current, 0, 0);
    tempCtx.drawImage(drawingCanvasRef.current, 0, 0);

    const finalCroppedCanvas = document.createElement('canvas');
    finalCroppedCanvas.width = cropRect.width;
    finalCroppedCanvas.height = cropRect.height;
    const finalCtx = finalCroppedCanvas.getContext('2d');
    if (!finalCtx) return;

    finalCtx.drawImage(tempCanvas, cropRect.x, cropRect.y, cropRect.width, cropRect.height, 0, 0, cropRect.width, cropRect.height);
    
    const newDataUrl = finalCroppedCanvas.toDataURL('image/jpeg', 0.9);
    const newImage = new Image();
    newImage.src = newDataUrl;
    newImage.onload = () => {
        drawImageToCanvas(newImage);
        clearDrawing();
        setCropRect(null);
        setMode('idle');
    };
  };

  const handleUndo = useCallback(() => {
    if (canUndo) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        redrawCanvasFromHistory(newIndex);
    }
  }, [canUndo, historyIndex, redrawCanvasFromHistory]);

  const handleRedo = useCallback(() => {
    if (canRedo) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        redrawCanvasFromHistory(newIndex);
    }
  }, [canRedo, historyIndex, redrawCanvasFromHistory]);

  const handleDone = () => {
    const finalCanvas = document.createElement('canvas');
    const imageCanvas = imageCanvasRef.current;
    const drawingCanvas = drawingCanvasRef.current;
    if (!imageCanvas || !drawingCanvas) return;
    finalCanvas.width = imageCanvas.width;
    finalCanvas.height = imageCanvas.height;
    const ctx = finalCanvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(imageCanvas, 0, 0);
    ctx.drawImage(drawingCanvas, 0, 0);
    const dataUrl = finalCanvas.toDataURL('image/jpeg', 0.9);
    onComplete(dataUrl, image.name);
  };

  const handleCancelTool = () => {
    setMode('idle');
    clearDrawing();
    setCropRect(null);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center animate-fade-in p-4">
      <div className="w-full h-full flex flex-col relative">
        <header className="absolute top-0 left-0 right-0 p-4 flex justify-end items-center z-30 bg-gradient-to-b from-black/50 to-transparent pointer-events-none">
            <Tooltip text={t('cancel')}>
              <button onClick={onClose} className="p-2 rounded-full bg-black/40 text-white backdrop-blur-sm md:hover:bg-black/60 transition-colors pointer-events-auto">
                  <Icon name="x" className="w-6 h-6" />
              </button>
            </Tooltip>
        </header>
        
        <main 
          className="flex-1 flex items-center justify-center overflow-hidden relative"
          style={{ cursor: mode !== 'idle' ? cursor : 'default' }}
          onMouseDown={mode !== 'idle' ? handleStartInteraction : undefined}
          onMouseMove={handleMoveInteraction}
          onMouseUp={mode !== 'idle' ? handleStopInteraction : undefined}
          onMouseLeave={mode !== 'idle' ? handleStopInteraction : undefined}
          onTouchStart={mode !== 'idle' ? handleStartInteraction : undefined}
          onTouchMove={handleMoveInteraction}
          onTouchEnd={mode !== 'idle' ? handleStopInteraction : undefined}
        >
            <canvas ref={imageCanvasRef} className="absolute z-0" />
            <canvas ref={drawingCanvasRef} className="absolute z-10" />
        </main>

        <footer className="absolute bottom-0 left-0 right-0 p-4 flex justify-between items-center z-30 pointer-events-none">
            <div className="flex items-center gap-3 pointer-events-auto">
                {mode === 'idle' ? (
                    <div className="flex items-center gap-2 p-1.5 bg-black/40 backdrop-blur-sm rounded-full">
                        <ToolButton icon="brush" title={t('drawOnImage')} onClick={() => setMode('draw')} />
                        <ToolButton icon="crop" title={t('cropImage')} onClick={() => setMode('crop')} />
                    </div>
                ) : (
                    <div className="flex items-center gap-2 p-1.5 bg-black/40 backdrop-blur-sm rounded-full">
                        <ToolButton icon="x" title={t('cancel')} onClick={handleCancelTool} />
                        <div className="w-px h-6 bg-white/20"></div>
                        {mode === 'draw' ? (
                            <>
                                <ToolButton icon="undo-2" title={t('undo')} onClick={handleUndo} disabled={!canUndo} />
                                <ToolButton icon="redo-2" title={t('redo')} onClick={handleRedo} disabled={!canRedo} />
                                <ToolButton icon="eraser" title={t('clearDrawing')} onClick={clearDrawing} disabled={history.length === 0} />
                            </>
                        ) : (
                             <>
                                <ToolButton icon="check" title={t('applyCrop')} onClick={applyCrop} disabled={!cropRect || cropRect.width < 1} />
                            </>
                        )}
                    </div>
                )}
            </div>

            <div className="pointer-events-auto">
                <Tooltip text={t('done')}>
                  <button
                      onClick={handleDone}
                      className="w-14 h-14 flex items-center justify-center bg-neutral-700 text-white rounded-full shadow-lg hover:bg-neutral-600 active:scale-95 transition-all"
                  >
                      <Icon name="check" className="w-7 h-7" />
                  </button>
                </Tooltip>
            </div>
        </footer>
      </div>
    </div>
  );
};

export default ImageEditorModal;