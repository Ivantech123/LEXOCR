
import React, { useState } from 'react';
import { X, FileStack, Play, Plus, Camera, ImagePlus, Eye, RotateCw, Trash2, ArrowLeft, Maximize, Minimize } from 'lucide-react';
import { ImageFile } from '../types';
import { Button } from './Button';

interface StagingAreaProps {
  pages: ImageFile[];
  onReorder: (newOrder: ImageFile[]) => void;
  onRemove: (id: string) => void;
  onUpdatePage: (id: string, updates: Partial<ImageFile>) => void;
  onProcess: () => void;
  onClear: () => void;
  onAddFile: () => void;
  onAddCamera: () => void;
}

export const StagingArea: React.FC<StagingAreaProps> = ({ 
  pages, 
  onReorder, 
  onRemove, 
  onUpdatePage,
  onProcess, 
  onClear,
  onAddFile,
  onAddCamera
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    const img = new Image();
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    e.dataTransfer.setDragImage(img, 0, 0);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newPages = [...pages];
    const draggedItem = newPages[draggedIndex];
    newPages.splice(draggedIndex, 1);
    newPages.splice(index, 0, draggedItem);

    onReorder(newPages);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleRotate = (id: string) => {
      const page = pages.find(p => p.id === id);
      if (page) {
          const currentRotation = page.rotation || 0;
          onUpdatePage(id, { rotation: (currentRotation + 90) % 360 });
      }
  };

  const selectedPage = pages.find(p => p.id === selectedPageId);

  return (
    <div className="w-full h-full flex flex-col relative overflow-hidden px-2 md:px-0 perspective-1000">
      
      {/* Header Actions - Floating Liquid Glass Pill */}
      <div className="flex-none flex flex-col sm:flex-row sm:items-center justify-between mb-4 md:mb-8 gap-4 ios-glass p-4 md:p-5 rounded-[32px] shadow-lg animate-slide-in-right z-20">
        <div className="flex items-center gap-4">
           <div className="bg-white dark:bg-[#333] p-3 rounded-2xl text-black dark:text-white shadow-md transform -rotate-3">
             <FileStack size={24} className="icon-animate" />
           </div>
           <div>
             <h2 className="text-xl font-bold text-black dark:text-white tracking-tight">
               Рабочий стол
             </h2>
             <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
               {pages.length} {pages.length === 1 ? 'файл' : (pages.length < 5 ? 'файла' : 'файлов')}
             </p>
           </div>
        </div>

        {/* Buttons - Desktop Visibility */}
        <div className="hidden sm:flex gap-3 w-full sm:w-auto">
            <Button 
                variant="tonal" 
                onClick={onClear} 
                title="Удалить все страницы"
                className="flex-1 sm:flex-none hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-300 dark:bg-[#333]"
            >
                Очистить
            </Button>
            <Button 
                variant="filled"
                onClick={onProcess} 
                title="Начать распознавание"
                icon={<Play size={18} fill="currentColor" />} 
                animateIcon
                className="flex-1 sm:flex-none shadow-xl shadow-purple-500/20 hover:shadow-purple-500/40 hover:-translate-y-1 transition-all"
            >
                Распознать
            </Button>
        </div>
      </div>

      {/* Grid Container - Scrollable with 3D feel */}
      <div className="flex-1 overflow-y-auto min-h-0 pb-40 sm:pb-8 perspective-1000">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-8 p-2">
            {pages.map((page, index) => (
            <div 
                key={page.id}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                onClick={() => { setSelectedPageId(page.id); setIsFullscreen(false); }}
                title="Нажмите для просмотра и редактирования"
                style={{ animationDelay: `${index * 50}ms` }}
                className={`
                relative group rounded-[24px] overflow-hidden transition-all duration-300 ease-out cursor-pointer physical-card hover:z-20
                ${draggedIndex === index 
                    ? 'opacity-20 scale-90 grayscale' 
                    : 'bg-white dark:bg-[#252529] shadow-lg border border-white/40 dark:border-white/5 hover:scale-[1.03] hover:shadow-2xl'
                }
                `}
            >
                {/* Polaroid Effect Container */}
                <div className="p-3 pb-12 sm:pb-14 h-full flex flex-col pointer-events-none">
                    <div className="aspect-[3/4] relative bg-gray-100 dark:bg-black/40 rounded-[16px] overflow-hidden shadow-inner">
                        <img 
                            src={page.previewUrl} 
                            alt={`Page ${index + 1}`} 
                            className="w-full h-full object-cover transition-transform duration-300"
                            style={{ transform: `rotate(${page.rotation || 0}deg)` }}
                        />
                        
                        {/* Page Number Badge */}
                        <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-lg">
                            #{index + 1}
                        </div>

                         {/* View Icon Overlay (Hover) */}
                        <div className="hidden sm:flex absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity items-center justify-center backdrop-blur-[2px]">
                            <Eye className="text-white drop-shadow-lg scale-110 icon-animate" size={32} />
                        </div>
                    </div>

                    {/* Footer / Caption Area */}
                    <div className="absolute bottom-0 left-0 right-0 h-12 sm:h-14 flex items-center justify-between px-4 pointer-events-auto">
                        <span className="text-[10px] sm:text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                           {page.mimeType.includes('pdf') ? 'PDF Document' : 'Image Scan'}
                        </span>
                        
                        <button 
                            onClick={(e) => { e.stopPropagation(); onRemove(page.id); }}
                            className="p-2 -mr-2 text-gray-300 hover:text-red-500 transition-colors"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>
            </div>
            ))}
            
            {/* "Add File" Ghost Card */}
            <div 
                onClick={onAddFile}
                title="Добавить файлы"
                className="hidden sm:flex aspect-[3/4] rounded-[24px] border-2 border-dashed border-gray-300 dark:border-gray-700 flex-col items-center justify-center text-gray-400 dark:text-gray-500 bg-white/20 dark:bg-white/5 cursor-pointer hover:border-purple-400 dark:hover:border-purple-500 hover:bg-purple-50/30 dark:hover:bg-purple-900/10 transition-all duration-300 group animate-scale-in-bounce delay-200 hover:scale-105 active:scale-95"
            >
                <div className="w-16 h-16 rounded-full bg-white dark:bg-gray-800 shadow-lg flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-90 transition-all duration-500">
                    <Plus size={32} className="text-purple-500 icon-animate" />
                </div>
                <span className="text-sm font-bold tracking-wide">Добавить</span>
            </div>
        </div>
      </div>

      {/* Mobile Fixed Bottom Bar (Glassy & Floating) */}
      <div className="fixed bottom-6 left-4 right-4 z-[50] sm:hidden flex flex-col gap-3 animate-slide-up">
          
          <div className="ios-glass p-2 rounded-[24px] shadow-2xl flex gap-2">
              <button 
                onClick={onAddCamera}
                className="flex-1 py-3 rounded-[18px] bg-gray-100 dark:bg-[#2c2c2e] text-black dark:text-white font-semibold flex items-center justify-center gap-2 active:scale-95 transition-transform"
              >
                  <Camera size={20} />
                  <span>Камера</span>
              </button>
              <button 
                onClick={onAddFile}
                className="flex-1 py-3 rounded-[18px] bg-gray-100 dark:bg-[#2c2c2e] text-black dark:text-white font-semibold flex items-center justify-center gap-2 active:scale-95 transition-transform"
              >
                  <ImagePlus size={20} />
                  <span>Файл</span>
              </button>
              <button 
                 onClick={onClear}
                 className="aspect-square rounded-[18px] bg-red-50 dark:bg-red-900/20 text-red-500 flex items-center justify-center active:scale-95 transition-transform"
              >
                 <X size={20} />
              </button>
          </div>

          <button 
             onClick={onProcess}
             className="w-full py-4 rounded-[24px] bg-[#1d1b20] dark:bg-white text-white dark:text-black font-bold text-lg flex items-center justify-center gap-3 shadow-2xl shadow-black/20 active:scale-95 transition-transform"
          >
             <Play size={22} fill="currentColor" />
             <span>Распознать</span>
          </button>
      </div>

      {/* === Page Details Modal (Liquid Glass Overlay) === */}
      {selectedPage && (
          <div className={`fixed inset-0 z-[200] flex items-center justify-center p-4 perspective-1000 ${isFullscreen ? 'p-0' : ''}`}>
              <div 
                className="absolute inset-0 bg-black/80 backdrop-blur-md animate-fade-in"
                onClick={() => setSelectedPageId(null)}
              />
              
              <div className={`
                  relative ios-glass overflow-hidden shadow-2xl animate-spring-up flex flex-col
                  ${isFullscreen ? 'w-full h-full rounded-none' : 'w-full max-w-lg rounded-[40px] max-h-[85vh]'}
              `}>
                  
                  {/* Header */}
                  <div className="p-5 flex items-center justify-between border-b border-white/20 dark:border-white/10 z-20">
                      <div className="flex items-center gap-3">
                          <button onClick={() => setSelectedPageId(null)} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                              <ArrowLeft size={20} />
                          </button>
                          <span className="font-bold text-lg">Просмотр</span>
                      </div>
                      
                      <div className="flex gap-2">
                        <button 
                            onClick={() => setIsFullscreen(!isFullscreen)}
                            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10"
                            title={isFullscreen ? "Свернуть" : "На весь экран"}
                        >
                            {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
                        </button>
                        <button 
                            onClick={() => { onRemove(selectedPage.id); setSelectedPageId(null); }}
                            className="p-2 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500/20"
                        >
                            <Trash2 size={20} />
                        </button>
                      </div>
                  </div>

                  {/* Image Canvas */}
                  <div className="flex-1 bg-black/5 dark:bg-black/20 flex items-center justify-center p-0 md:p-8 overflow-auto relative">
                       {/* Background Texture */}
                      <div className="absolute inset-0 bg-[radial-gradient(#00000010_1px,transparent_1px)] dark:bg-[radial-gradient(#ffffff10_1px,transparent_1px)] [background-size:16px_16px] opacity-20 pointer-events-none"></div>
                      
                      <img 
                          src={selectedPage.previewUrl} 
                          alt="Full Preview" 
                          className={`
                             object-contain shadow-2xl rounded-lg transition-transform duration-300
                             ${isFullscreen ? 'max-w-none w-auto h-auto min-h-full' : 'max-w-full max-h-[50vh]'}
                          `}
                          style={{ transform: `rotate(${selectedPage.rotation || 0}deg)` }}
                      />
                  </div>

                  {/* Actions */}
                  <div className="p-6 border-t border-white/20 dark:border-white/10 flex justify-center gap-4 z-20 bg-white/20 dark:bg-black/20 backdrop-blur-md">
                      <button 
                          onClick={() => handleRotate(selectedPage.id)}
                          className="flex items-center gap-2 px-6 py-4 rounded-2xl bg-white/40 dark:bg-white/5 hover:bg-white/60 dark:hover:bg-white/10 active:scale-95 transition-all w-full justify-center font-medium"
                      >
                          <RotateCw size={20} className="icon-animate" />
                          <span>Повернуть</span>
                      </button>
                      <button 
                          onClick={() => setSelectedPageId(null)}
                          className="flex items-center gap-2 px-6 py-4 rounded-2xl bg-black dark:bg-white text-white dark:text-black hover:opacity-90 active:scale-95 transition-all w-full justify-center font-bold"
                      >
                          Готово
                      </button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};
