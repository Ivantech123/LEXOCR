
import React, { useRef, useState, useEffect } from 'react';
import { FileImage, AlignLeft, RefreshCw } from 'lucide-react';

interface MobileNavBarProps {
  activeTab: 'image' | 'text';
  onTabChange: (tab: 'image' | 'text') => void;
  onReset: () => void;
}

export const MobileNavBar: React.FC<MobileNavBarProps> = ({ 
  activeTab, 
  onTabChange,
  onReset
}) => {
  // State for gesture handling
  const [previewTab, setPreviewTab] = useState<'image' | 'text'>(activeTab);
  const [isDragging, setIsDragging] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const imageBtnRef = useRef<HTMLButtonElement>(null);
  const textBtnRef = useRef<HTMLButtonElement>(null);

  // Sync preview with prop when not dragging
  useEffect(() => {
    if (!isDragging) {
      setPreviewTab(activeTab);
    }
  }, [activeTab, isDragging]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    updateSelection(e.touches[0].clientX, e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    updateSelection(e.touches[0].clientX, e.touches[0].clientY);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (previewTab !== activeTab) {
      onTabChange(previewTab);
    }
  };

  const updateSelection = (x: number, y: number) => {
    const target = document.elementFromPoint(x, y);
    
    // 1. Direct Element Check (Most accurate)
    if (imageBtnRef.current?.contains(target as Node) || imageBtnRef.current === target) {
      setPreviewTab('image');
      return;
    } 
    if (textBtnRef.current?.contains(target as Node) || textBtnRef.current === target) {
      setPreviewTab('text');
      return;
    }

    // 2. Fallback: Coordinate geometry (If finger is between buttons or slightly off)
    if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        
        // Relaxed hit detection (allow 40px buffer around container)
        const buffer = 40;
        if (y >= rect.top - buffer && y <= rect.bottom + buffer && x >= rect.left - buffer && x <= rect.right + buffer) {
            const centerX = rect.left + rect.width / 2;
            if (x < centerX) setPreviewTab('image');
            else setPreviewTab('text');
        }
    }
  };

  return (
    // Fixed centering: Use 'left-0 right-0 mx-auto' instead of transform to avoid conflict with animate-slide-up
    // Added 'bottom-[calc(1.5rem+env(safe-area-inset-bottom))]' for iOS home indicator safety
    <div className="fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom))] left-0 right-0 mx-auto z-[100] animate-slide-up lg:hidden w-[90%] max-w-[320px]">
      <div className="bg-[#1d1b20]/80 dark:bg-[#e6e1e5]/80 backdrop-blur-3xl saturate-150 text-[#e6e1e5] dark:text-[#1d1b20] p-2 rounded-full shadow-[0_20px_40px_rgba(0,0,0,0.3)] flex items-center justify-between border border-white/10 dark:border-black/5">
        
        {/* Tab Switcher Container */}
        <div 
            ref={containerRef}
            className="flex bg-black/20 dark:bg-white/20 rounded-full p-1 relative touch-none select-none flex-1 mr-2"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
           {/* Active Indicator Background (Fluid Bubble) */}
           <div 
             className={`
                absolute inset-y-1 rounded-full bg-[#d0bcff] dark:bg-[#6750a4] shadow-lg
                transition-all duration-300 cubic-bezier(0.2, 0.8, 0.2, 1) will-change-transform
                ${previewTab === 'image' ? 'left-1 w-[calc(50%-4px)]' : 'left-[50%] w-[calc(50%-4px)]'}
                ${isDragging ? 'scale-95 opacity-90' : 'scale-100 opacity-100'}
             `} 
           />

           <button 
             ref={imageBtnRef}
             onClick={() => onTabChange('image')}
             className={`relative z-10 flex-1 flex items-center gap-2 px-2 py-3 rounded-full text-xs font-bold uppercase tracking-wider transition-colors duration-200 justify-center ${previewTab === 'image' ? 'text-[#381e72] dark:text-white' : 'text-[#cac4d0] dark:text-[#49454f]'}`}
           >
             <FileImage size={16} className="pointer-events-none" />
             <span className="pointer-events-none">Скан</span>
           </button>
           
           <button 
             ref={textBtnRef}
             onClick={() => onTabChange('text')}
             className={`relative z-10 flex-1 flex items-center gap-2 px-2 py-3 rounded-full text-xs font-bold uppercase tracking-wider transition-colors duration-200 justify-center ${previewTab === 'text' ? 'text-[#381e72] dark:text-white' : 'text-[#cac4d0] dark:text-[#49454f]'}`}
           >
             <AlignLeft size={16} className="pointer-events-none" />
             <span className="pointer-events-none">Текст</span>
           </button>
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-white/10 dark:bg-black/10 mx-1" />

        {/* Action Button */}
        <button 
            onClick={onReset}
            className="w-12 h-12 flex items-center justify-center bg-[#e8def8] dark:bg-[#4a4458] text-[#1d192b] dark:text-[#e8def8] rounded-full hover:bg-[#d0bcff] dark:hover:bg-[#6750a4]/80 active:scale-95 transition-all shadow-md"
            title="Новый скан"
        >
            <RefreshCw size={20} />
        </button>

      </div>
    </div>
  );
};
