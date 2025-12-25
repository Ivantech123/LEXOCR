
import React, { useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { Upload, Camera, FileText, Plus, Cloud, HardDrive, Loader2 } from 'lucide-react';
import { ImageFile } from '../types';
import { convertPdfToImages } from '../services/pdfService';
import { cloudService } from '../services/cloudService';
import { haptic } from '../utils/haptics';

interface ImageUploaderProps {
  onImagesSelected: (images: ImageFile[]) => void;
  onLoading?: (status: boolean) => void;
  compact?: boolean;
}

export interface ImageUploaderHandle {
    openFile: () => void;
    openCamera: () => void;
}

export const ImageUploader = forwardRef<ImageUploaderHandle, ImageUploaderProps>(({ 
  onImagesSelected, 
  onLoading,
  compact = false
}, ref) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isCloudLoading, setIsCloudLoading] = useState(false);

  useImperativeHandle(ref, () => ({
    openFile: () => fileInputRef.current?.click(),
    openCamera: () => cameraInputRef.current?.click()
  }));

  const processFiles = async (files: FileList | File[]) => {
    if (onLoading) onLoading(true);
    const newImages: ImageFile[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        if (file.type === 'application/pdf') {
          const pdfImages = await convertPdfToImages(file);
          newImages.push(...pdfImages);
        } else if (file.type.startsWith('image/')) {
          await new Promise<void>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const result = reader.result as string;
              newImages.push({
                id: `img-${Date.now()}-${i}`,
                file,
                previewUrl: result,
                base64: result.split(',')[1],
                mimeType: file.type,
                rotation: 0
              });
              resolve();
            };
            reader.readAsDataURL(file);
          });
        }
      }
      
      if (newImages.length > 0) {
        onImagesSelected(newImages);
      }
    } catch (error) {
      console.error("Error processing files", error);
      alert("Не удалось обработать файлы.");
    } finally {
      if (onLoading) onLoading(false);
    }
  };

  const handleCloudImport = async (provider: 'google' | 'dropbox') => {
      haptic.impactMedium();
      setIsCloudLoading(true);
      if (onLoading) onLoading(true);
      
      try {
          const files = provider === 'google' 
            ? await cloudService.pickFromGoogleDrive()
            : await cloudService.pickFromDropbox();
          
          if (files.length > 0) {
              const processedFiles = files.map(f => ({
                  ...f,
                  base64: f.base64 || 'placeholder_base64_string_for_demo'
              }));
              onImagesSelected(processedFiles);
          }
      } catch (e) {
          console.error(e);
      } finally {
          setIsCloudLoading(false);
          if (onLoading) onLoading(false);
      }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  // Compact Mode (used in Staging Area)
  if (compact) {
    return (
      <>
        <input type="file" ref={fileInputRef} className="hidden" accept="image/*,application/pdf" multiple onChange={(e) => e.target.files && processFiles(e.target.files)} />
        <input type="file" ref={cameraInputRef} className="hidden" accept="image/*" capture="environment" onChange={(e) => e.target.files && processFiles(e.target.files)} />
        <div onClick={() => fileInputRef.current?.click()} className={`cursor-pointer transition-all duration-300 border-2 border-dashed rounded-[20px] flex items-center justify-center gap-3 p-4 ${isDragging ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 scale-105' : 'border-gray-300 dark:border-gray-700 hover:border-purple-400 bg-white/50 dark:bg-black/20 text-gray-500 dark:text-gray-400'}`} onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}>
            <Plus size={24} />
            <span className="font-semibold text-sm">Добавить</span>
        </div>
      </>
    );
  }

  // Main Mode
  return (
    <div
      className={`relative w-full flex flex-col items-center justify-center transition-all duration-500`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*,application/pdf" multiple onChange={(e) => e.target.files && processFiles(e.target.files)} />
      <input type="file" ref={cameraInputRef} className="hidden" accept="image/*" capture="environment" onChange={(e) => e.target.files && processFiles(e.target.files)} />

      {/* Desktop View (Standard Glass Box) */}
      <div className="hidden md:flex relative group cursor-pointer w-full rounded-[40px] flex-col items-center justify-center p-10 ios-glass hover:shadow-2xl overflow-hidden bg-white/40 dark:bg-black/40 border border-white/20"
           onClick={() => fileInputRef.current?.click()}
      >
            {/* Optimized Blur - Reduced spread to prevent visual shift */}
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] bg-gradient-to-tr from-blue-400/20 to-purple-500/20 rounded-full blur-[60px] transition-all duration-700 ease-out will-change-transform ${isDragging ? 'scale-125 opacity-100' : 'scale-100 opacity-50 group-hover:scale-110'}`} />
            
            <div className={`relative z-10 w-28 h-28 rounded-[30px] flex items-center justify-center mb-10 transition-transform duration-500 shadow-xl ${isDragging ? 'bg-purple-600 text-white scale-110 rotate-6 shadow-purple-500/40' : 'bg-white dark:bg-[#1c1c1e] text-purple-600 dark:text-purple-400 group-hover:scale-105 group-hover:-rotate-3 group-hover:shadow-2xl'}`}>
                <Upload size={48} strokeWidth={2} />
            </div>

            <h3 className="relative z-10 text-3xl font-bold text-black dark:text-white mb-3 text-center tracking-tight">Перетащите файлы</h3>
            <p className="relative z-10 text-gray-500 dark:text-gray-400 text-center text-lg max-w-sm mb-8 leading-relaxed">Поддерживаются изображения и PDF</p>

            {/* Cloud Integrations */}
            <div className="relative z-10 flex gap-4 mb-8">
                <button onClick={(e) => { e.stopPropagation(); handleCloudImport('google'); }} className="flex items-center gap-2 px-4 py-2 bg-white/50 dark:bg-black/20 hover:bg-white dark:hover:bg-white/10 rounded-xl transition-all border border-gray-200 dark:border-white/10">
                    {isCloudLoading ? <Loader2 size={18} className="animate-spin" /> : <HardDrive size={18} className="text-blue-500" />}
                    <span className="text-sm font-semibold">Google Drive</span>
                </button>
                <button onClick={(e) => { e.stopPropagation(); cameraInputRef.current?.click(); }} className="flex items-center gap-2 px-4 py-2 bg-white/50 dark:bg-black/20 hover:bg-white dark:hover:bg-white/10 rounded-xl transition-all border border-gray-200 dark:border-white/10">
                    <Camera size={18} className="text-indigo-500" />
                    <span className="text-sm font-semibold">Camera</span>
                </button>
            </div>
      </div>

      {/* Mobile View */}
      <div className="md:hidden w-full flex flex-col gap-4 mt-4 pb-20">
          <button onClick={() => cameraInputRef.current?.click()} className="w-full bg-[#1d1b20] dark:bg-white text-white dark:text-black rounded-[28px] p-6 flex items-center justify-between shadow-xl active:scale-95 transition-transform">
              <div className="flex flex-col text-left"><span className="text-xl font-bold">Снять фото</span><span className="text-white/60 dark:text-black/60 text-sm">Сканировать камерой</span></div>
              <div className="w-14 h-14 bg-white/20 dark:bg-black/10 rounded-full flex items-center justify-center"><Camera size={28} /></div>
          </button>

          <button onClick={() => fileInputRef.current?.click()} className="w-full bg-white dark:bg-[#1c1c1e] text-black dark:text-white rounded-[28px] p-6 flex items-center justify-between shadow-lg border border-gray-100 dark:border-white/10 active:scale-95 transition-transform">
              <div className="flex flex-col text-left"><span className="text-xl font-bold">Загрузить</span><span className="text-gray-500 dark:text-gray-400 text-sm">Из галереи или PDF</span></div>
              <div className="w-14 h-14 bg-gray-100 dark:bg-white/10 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400"><FileText size={28} /></div>
          </button>
          
          <div className="grid grid-cols-2 gap-4">
              <button onClick={() => handleCloudImport('google')} className="bg-white/50 dark:bg-white/5 p-4 rounded-[24px] flex flex-col items-center justify-center gap-2 border border-gray-200 dark:border-white/10 active:scale-95 transition-transform">
                  <HardDrive size={24} className="text-blue-500" />
                  <span className="text-xs font-bold">Google Drive</span>
              </button>
              <button onClick={() => handleCloudImport('dropbox')} className="bg-white/50 dark:bg-white/5 p-4 rounded-[24px] flex flex-col items-center justify-center gap-2 border border-gray-200 dark:border-white/10 active:scale-95 transition-transform">
                  <Cloud size={24} className="text-indigo-500" />
                  <span className="text-xs font-bold">Dropbox</span>
              </button>
          </div>
      </div>
    </div>
  );
});
