
import React, { useState, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, Maximize, Move, ChevronLeft, ChevronRight } from 'lucide-react';
import { haptic } from '../utils/haptics';

interface ImageViewerProps {
  imageUrl: string;
  pageIndex?: number;
  totalPages?: number;
  onNextPage?: () => void;
  onPrevPage?: () => void;
  scrollPercent?: number; // 0 to 1
  onZoomChange?: (isZoomed: boolean) => void;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({ 
  imageUrl, 
  pageIndex = 0, 
  totalPages = 1,
  onNextPage,
  onPrevPage,
  scrollPercent = 0,
  onZoomChange
}) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  
  // Refs for high-performance dragging
  const dragStartRef = useRef({ x: 0, y: 0 });
  const positionRef = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastTapRef = useRef<number>(0); // For double tap detection

  // Reset view when image changes
  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    positionRef.current = { x: 0, y: 0 };
    if (onZoomChange) onZoomChange(false);
  }, [imageUrl]);

  // Handle auto-scroll based on text position
  useEffect(() => {
    if (containerRef.current && scrollPercent >= 0) {
        const container = containerRef.current;
        const scrollHeight = container.scrollHeight;
        const clientHeight = container.clientHeight;
        const targetScroll = (scrollHeight - clientHeight) * scrollPercent;
        container.scrollTo({ top: targetScroll, behavior: 'smooth' });
    }
  }, [scrollPercent, scale]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent default text selection
    
    // Double Tap Logic
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
        haptic.impactMedium();
        if (scale > 1) {
            resetView();
        } else {
            setScale(2.5); // Zoom in
            if (onZoomChange) onZoomChange(true);
        }
    }
    lastTapRef.current = now;

    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - positionRef.current.x, y: e.clientY - positionRef.current.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    // Optimization: Use requestAnimationFrame to limit updates to screen refresh rate
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    
    animationFrameRef.current = requestAnimationFrame(() => {
        const newX = e.clientX - dragStartRef.current.x;
        const newY = e.clientY - dragStartRef.current.y;
        positionRef.current = { x: newX, y: newY };
        setPosition({ x: newX, y: newY });
    });
  };

  const handleMouseUp = () => {
      setIsDragging(false);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
  };

  const adjustScale = (delta: number) => {
    haptic.impactLight();
    setScale(prev => {
        const newScale = Math.min(Math.max(0.5, prev + delta), 4);
        if (onZoomChange) {
            onZoomChange(newScale > 1.1);
        }
        return newScale;
    });
  };

  const resetView = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    positionRef.current = { x: 0, y: 0 };
    if (onZoomChange) onZoomChange(false);
  };

  return (
    <div className="flex flex-col h-full bg-[#1d1b20] dark:bg-black rounded-none md:rounded-[28px] overflow-hidden shadow-none md:shadow-md relative group select-none">
      
      {/* Page Navigation Overlay */}
      {totalPages > 1 && (
        <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 flex justify-between px-4 z-10 pointer-events-none">
            <button 
                onClick={onPrevPage} 
                disabled={pageIndex === 0}
                className="pointer-events-auto p-2 rounded-full bg-black/40 text-white hover:bg-black/60 disabled:opacity-0 transition-all active:scale-95"
            >
                <ChevronLeft size={24} />
            </button>
            <button 
                onClick={onNextPage} 
                disabled={pageIndex === totalPages - 1}
                className="pointer-events-auto p-2 rounded-full bg-black/40 text-white hover:bg-black/60 disabled:opacity-0 transition-all active:scale-95"
            >
                <ChevronRight size={24} />
            </button>
        </div>
      )}
      
      {/* Page Indicator */}
      {totalPages > 1 && (
         <div className="absolute top-4 left-4 z-20">
             <span className="bg-black/50 backdrop-blur text-white text-xs font-medium px-3 py-1 rounded-full">
                 Страница {pageIndex + 1} из {totalPages}
             </span>
         </div>
      )}

      {/* Toolbar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-[#2b2930]/90 backdrop-blur-md p-1.5 rounded-full border border-white/10 z-20 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <button 
          onClick={() => adjustScale(-0.25)}
          className="p-2 text-[#e6e0e9] hover:bg-white/10 rounded-full transition-colors active:scale-90"
        >
          <ZoomOut size={20} />
        </button>
        <span className="text-xs font-mono text-[#cac4d0] w-12 text-center">
          {Math.round(scale * 100)}%
        </span>
        <button 
          onClick={() => adjustScale(0.25)}
          className="p-2 text-[#e6e0e9] hover:bg-white/10 rounded-full transition-colors active:scale-90"
        >
          <ZoomIn size={20} />
        </button>
        <div className="w-px h-4 bg-white/20 mx-1" />
        <button 
          onClick={resetView}
          className="p-2 text-[#d0bcff] hover:bg-white/10 rounded-full transition-colors active:scale-90"
        >
          <Maximize size={20} />
        </button>
      </div>

      {/* Canvas */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-auto relative cursor-move bg-[radial-gradient(#2b2930_1px,transparent_1px)] [background-size:16px_16px]"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={(e) => adjustScale(e.deltaY * -0.001)}
      >
        <div 
          className="min-w-full min-h-full flex items-center justify-center p-4 md:p-8 will-change-transform"
          style={{
            transform: `translate3d(${position.x}px, ${position.y}px, 0) scale(${scale})`,
            transformOrigin: 'center top'
          }}
        >
          <img 
            src={imageUrl} 
            alt="Workspace" 
            className="shadow-2xl rounded-lg bg-white pointer-events-none select-none"
            style={{ 
                maxHeight: 'none', 
                maxWidth: '100%', 
                width: 'auto',
                display: 'block'
            }}
            draggable={false}
          />
        </div>
      </div>
      
      <div className="hidden md:block absolute bottom-4 right-4 pointer-events-none">
        <div className="flex items-center gap-2 text-white/50 text-xs bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-sm">
           <Move size={12} /> Панорамирование
        </div>
      </div>
    </div>
  );
};
