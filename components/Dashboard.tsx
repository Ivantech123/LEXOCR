
import React, { useEffect, useState, useRef } from 'react';
import { ScanText, Mic, History, Sparkles, ChevronRight, Camera, FileText, ArrowUpRight, Cloud, Sun, Moon, Trash2 } from 'lucide-react';
import { HistoryItem } from '../types';
import { historyService } from '../services/historyService'; // Import needed for delete logic
import { haptic } from '../utils/haptics';

interface DashboardProps {
  history: HistoryItem[];
  onNavigate: (view: any) => void;
  onQuickAction: (action: 'scan' | 'camera' | 'audio') => void;
}

// Swipeable Item Component
const SwipeableHistoryItem: React.FC<{ 
    item: HistoryItem, 
    onDelete: (id: string) => void, 
    onClick: () => void 
}> = ({ item, onDelete, onClick }) => {
    const [offsetX, setOffsetX] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);
    const startXRef = useRef<number | null>(null);

    const handleTouchStart = (e: React.TouchEvent) => {
        startXRef.current = e.touches[0].clientX;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (startXRef.current === null) return;
        const currentX = e.touches[0].clientX;
        const diff = currentX - startXRef.current;
        
        // Only allow swiping left
        if (diff < 0) {
            // Resistance effect
            setOffsetX(Math.max(diff, -120));
        }
    };

    const handleTouchEnd = () => {
        if (offsetX < -80) {
            // Trigger delete
            setIsDeleting(true);
            haptic.impactMedium();
            setTimeout(() => onDelete(item.id), 300); // Wait for animation
        } else {
            // Reset
            setOffsetX(0);
        }
        startXRef.current = null;
    };

    if (isDeleting) return null; // Or return a collapsing spacer

    return (
        <div className="relative overflow-hidden rounded-[28px]">
            {/* Background Action (Delete) */}
            <div className="absolute inset-0 bg-red-500 flex items-center justify-end pr-8 rounded-[28px]">
                <Trash2 className="text-white" size={24} />
            </div>

            {/* Foreground Content */}
            <div 
                className="relative bg-white dark:bg-[#1c1c1e] transition-transform duration-200 ease-out will-change-transform"
                style={{ transform: `translateX(${offsetX}px)` }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onClick={() => {
                    if (offsetX === 0) {
                        haptic.impactLight();
                        onClick();
                    } else {
                        setOffsetX(0);
                    }
                }}
            >
                <div className="flex items-center gap-5 p-5 border border-gray-100 dark:border-white/5 rounded-[28px]">
                    <div className={`w-14 h-14 rounded-[20px] flex items-center justify-center shrink-0 ${item.type === 'OCR' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'}`}>
                        {item.type === 'OCR' ? <FileText size={24} /> : <Mic size={24} />}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-900 dark:text-white text-base truncate mb-1">
                            {item.summary || "Без названия"}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                            {new Date(item.date).toLocaleDateString()} • {new Date(item.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center">
                        <ChevronRight size={18} className="text-black dark:text-white opacity-50" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export const Dashboard: React.FC<DashboardProps & { onDeleteHistory?: (id: string) => void }> = ({ history, onNavigate, onQuickAction, onDeleteHistory }) => {
  const [greeting, setGreeting] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now);
      const hour = now.getHours();
      if (hour < 6) setGreeting('Доброй ночи');
      else if (hour < 12) setGreeting('Доброе утро');
      else if (hour < 18) setGreeting('Добрый день');
      else setGreeting('Добрый вечер');
    };
    updateTime();
    const timer = setInterval(updateTime, 60000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden pb-32 px-4 md:px-0 animate-spring-up">
      
      {/* Header Section with Time */}
      <div className="pt-2 mb-8 flex items-end justify-between">
        <div>
            <h1 className="text-4xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-500 dark:from-white dark:to-gray-400 tracking-tight mb-1">
            {greeting}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-lg font-medium ml-1">
            Ваш личный AI ассистент
            </p>
        </div>
        <div className="hidden md:block text-right">
             <div className="text-3xl font-bold text-gray-300 dark:text-gray-600 font-mono">
                 {currentTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
             </div>
        </div>
      </div>

      {/* Hero Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-10">
        
        {/* Main Action: Scan */}
        <div 
           onClick={() => { haptic.impactLight(); onQuickAction('scan'); }}
           className="md:col-span-2 relative h-72 rounded-[40px] bg-white dark:bg-[#1c1c1e] overflow-hidden group cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-500 active:scale-[0.98] border border-white/40 dark:border-white/5"
        >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-600/10 group-hover:opacity-100 transition-opacity duration-700" />
            
            {/* Fluid Background Blob */}
            <div className="absolute -right-20 -top-20 w-80 h-80 bg-blue-400/20 dark:bg-blue-600/20 rounded-full blur-[80px] group-hover:scale-150 transition-transform duration-1000 ease-out" />
            <div className="absolute bottom-[-50px] left-[-50px] w-60 h-60 bg-purple-400/20 dark:bg-purple-600/20 rounded-full blur-[60px] animate-pulse" />

            <div className="absolute top-8 left-8 z-10">
                <div className="w-14 h-14 rounded-[20px] bg-black dark:bg-white text-white dark:text-black flex items-center justify-center mb-6 shadow-xl shadow-blue-500/10 group-hover:rotate-6 transition-transform duration-300">
                    <ScanText size={28} />
                </div>
                <h3 className="text-3xl font-bold text-black dark:text-white mb-2 tracking-tight">Сканировать</h3>
                <p className="text-gray-500 dark:text-gray-400 font-medium text-base max-w-[200px] leading-relaxed">
                    Распознавание текста с фото, PDF и скриншотов.
                </p>
            </div>

            <div className="absolute bottom-8 right-8 bg-black/5 dark:bg-white/10 backdrop-blur-xl px-6 py-3 rounded-full text-sm font-bold text-black dark:text-white flex items-center gap-2 group-hover:bg-black/10 dark:group-hover:bg-white/20 transition-all shadow-sm">
                Начать <ArrowUpRight size={16} />
            </div>
        </div>

        {/* Secondary Action: Audio */}
        <div 
           onClick={() => { haptic.impactLight(); onQuickAction('audio'); }}
           className="relative h-72 rounded-[40px] bg-[#f2f2f7] dark:bg-[#2c2c2e] overflow-hidden group cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-500 active:scale-[0.98] border border-white/40 dark:border-white/5"
        >
             <div className="absolute inset-0 bg-gradient-to-t from-red-500/5 to-transparent" />
             
             <div className="absolute top-8 left-8 z-10">
                <div className="w-14 h-14 rounded-[20px] bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Mic size={28} />
                </div>
                <h3 className="text-3xl font-bold text-black dark:text-white mb-2 tracking-tight">Диктофон</h3>
                <p className="text-gray-500 dark:text-gray-400 font-medium text-base">
                    Запись, транскрипция и умное саммари.
                </p>
            </div>

            {/* Audio Wave Visual */}
            <div className="absolute bottom-0 left-0 right-0 h-32 flex items-end justify-center pb-8 gap-1.5 opacity-40 group-hover:opacity-80 transition-opacity">
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="w-2 bg-red-500 rounded-full animate-liquid-pulse" style={{ height: `${20 + Math.random() * 60}%`, animationDelay: `${i * 0.15}s` }} />
                ))}
            </div>
        </div>
      </div>

      {/* Tool Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-12">
          
          <button 
             onClick={() => { haptic.impactLight(); onQuickAction('camera'); }}
             className="col-span-1 h-44 rounded-[32px] bg-white/60 dark:bg-[#1c1c1e]/60 backdrop-blur-md p-6 flex flex-col justify-between hover:bg-white dark:hover:bg-[#2c2c2e] transition-all shadow-sm hover:shadow-lg border border-white/20 dark:border-white/5 group active:scale-95"
          >
              <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Camera size={22} />
              </div>
              <div>
                  <span className="font-bold text-lg text-black dark:text-white block">Камера</span>
                  <span className="text-xs text-gray-400">Быстрый снимок</span>
              </div>
          </button>

          <div 
             onClick={() => { haptic.impactLight(); onNavigate('HISTORY'); }}
             className="col-span-1 h-44 rounded-[32px] bg-white/60 dark:bg-[#1c1c1e]/60 backdrop-blur-md p-6 flex flex-col justify-between hover:bg-white dark:hover:bg-[#2c2c2e] transition-all shadow-sm hover:shadow-lg border border-white/20 dark:border-white/5 cursor-pointer group active:scale-95"
          >
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <History size={22} />
              </div>
              <div>
                  <span className="font-bold text-lg text-black dark:text-white block">История</span>
                  <span className="text-xs text-gray-400">{history.length} файлов</span>
              </div>
          </div>

          <div 
              onClick={() => { haptic.impactLight(); onNavigate('AI_CHAT'); }}
              className="col-span-2 h-44 rounded-[32px] bg-gradient-to-tr from-amber-500 to-orange-600 p-8 flex flex-col justify-center relative overflow-hidden shadow-xl group cursor-pointer active:scale-98"
          >
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/20 rounded-full blur-[50px] group-hover:scale-125 transition-transform duration-700" />
              
              <div className="flex items-center gap-2 text-white/90 text-xs font-bold uppercase tracking-wider mb-3">
                  <Sparkles size={12} /> AI Service
              </div>
              <h3 className="text-white font-bold text-2xl leading-tight max-w-[90%] mb-1">
                  AI Assistant
              </h3>
              <p className="text-white/70 text-sm mb-4">Ваш умный помощник всегда под рукой.</p>
          </div>
      </div>

      {/* Recent History List */}
      <div>
          <div className="flex items-center justify-between mb-6 px-2">
              <h2 className="text-2xl font-bold text-black dark:text-white tracking-tight">Недавнее</h2>
              <button 
                onClick={() => { haptic.impactLight(); onNavigate('HISTORY'); }}
                className="text-purple-600 dark:text-purple-400 text-sm font-bold bg-purple-50 dark:bg-purple-900/10 px-4 py-2 rounded-full hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
              >
                  См. все
              </button>
          </div>
          
          <div className="space-y-3">
              {history.slice(0, 3).map((item, i) => (
                  <SwipeableHistoryItem 
                     key={item.id} 
                     item={item} 
                     onDelete={(id) => onDeleteHistory && onDeleteHistory(id)}
                     onClick={() => onNavigate('HISTORY')}
                  />
              ))}
              
              {history.length === 0 && (
                  <div className="text-center py-12 bg-white/50 dark:bg-white/5 rounded-[32px] border border-dashed border-gray-200 dark:border-white/10 backdrop-blur-sm">
                      <div className="w-16 h-16 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Cloud size={24} className="text-gray-400" />
                      </div>
                      <p className="text-gray-500 dark:text-gray-400 font-medium">История пуста. Самое время начать!</p>
                  </div>
              )}
          </div>
      </div>
    </div>
  );
};
