
import React from 'react';
import { Loader2, Zap } from 'lucide-react';

interface ProcessingViewProps {
  previewUrl?: string;
  text: string;
}

export const ProcessingView: React.FC<ProcessingViewProps> = ({ previewUrl, text }) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center animate-spring-scale h-full w-full relative overflow-hidden">
        
        {/* Scanner Container */}
        <div className="relative w-full max-w-sm aspect-[3/4] rounded-[32px] overflow-hidden shadow-2xl bg-black border-[6px] border-[#1d1b20] dark:border-[#333]">
            {/* Image Layer */}
            {previewUrl && (
                <img 
                    src={previewUrl} 
                    alt="Scanning" 
                    className="w-full h-full object-cover opacity-60"
                />
            )}
            
            {/* Overlay Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,170,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,170,0.1)_1px,transparent_1px)] bg-[size:20px_20px] opacity-30"></div>

            {/* Scanning Beam */}
            <div className="absolute top-0 left-0 w-full h-2 bg-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.8)] animate-scan"></div>
            
            {/* Central Loader */}
            <div className="absolute inset-0 flex flex-col items-center justify-center backdrop-blur-sm bg-black/30">
                <div className="relative">
                    <div className="absolute inset-0 bg-purple-500/30 blur-xl rounded-full animate-pulse"></div>
                    <div className="bg-white/10 backdrop-blur-md p-6 rounded-full shadow-2xl border border-white/20 relative z-10">
                        <Zap className="text-purple-400 animate-pulse" size={32} fill="currentColor" />
                    </div>
                </div>
                
                <div className="mt-8 flex flex-col items-center gap-2">
                    <div className="flex items-center gap-2 text-white font-mono text-sm tracking-widest uppercase">
                        <Loader2 className="animate-spin" size={14} />
                        Обработка AI
                    </div>
                    <span className="text-white/70 text-xs font-medium">{text}</span>
                </div>
            </div>
        </div>

        {/* CSS for Scanner Beam */}
        <style>{`
            @keyframes scan {
                0% { top: 0%; opacity: 0; }
                10% { opacity: 1; }
                90% { opacity: 1; }
                100% { top: 100%; opacity: 0; }
            }
            .animate-scan {
                animation: scan 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
            }
        `}</style>
    </div>
  );
};
