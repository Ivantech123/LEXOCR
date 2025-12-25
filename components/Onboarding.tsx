
import React, { useState, useEffect } from 'react';
import { ScanText, Sparkles, Shield, ChevronRight, Check, Zap, Globe, Wand2 } from 'lucide-react';
import { Button } from './Button';
import { haptic } from '../utils/haptics';

interface OnboardingProps {
  onComplete: () => void;
}

const slides = [
  {
    id: 1,
    icon: <ScanText size={56} className="text-white drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]" />,
    title: "Сканируй мир",
    desc: "Мгновенно превращайте любые документы, заметки и книги в цифровой текст с точностью 99%.",
    bg: "bg-blue-600",
    gradient: "from-blue-600/20 via-blue-900/10 to-transparent"
  },
  {
    id: 2,
    icon: <Wand2 size={56} className="text-white drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]" />,
    title: "AI Магия",
    desc: "Gemini 2.5 не просто читает. Он исправляет ошибки, делает саммари и переводит на 100+ языков.",
    bg: "bg-purple-600",
    gradient: "from-purple-600/20 via-fuchsia-900/10 to-transparent"
  },
  {
    id: 3,
    icon: <Shield size={56} className="text-white drop-shadow-[0_0_15px_rgba(34,197,94,0.5)]" />,
    title: "Open Source",
    desc: "Полностью бесплатный проект с открытым кодом. Некоммерческий. Автор: Андреев Иван.",
    bg: "bg-green-600",
    gradient: "from-green-600/20 via-emerald-900/10 to-transparent"
  }
];

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setTimeout(() => setIsLoaded(true), 100);
  }, []);

  const handleNext = () => {
    haptic.impactLight();
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      haptic.success();
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-[300] bg-[#f2f2f7] dark:bg-[#000000] flex flex-col items-center justify-between overflow-hidden">
       
       {/* Dynamic Background */}
       <div className="absolute inset-0 pointer-events-none transition-colors duration-700">
           {/* Animated blobs */}
           <div className={`absolute top-[-20%] left-[-20%] w-[140%] h-[80%] rounded-full blur-[100px] bg-gradient-to-b ${slides[currentSlide].gradient} transition-all duration-1000 ease-in-out`} />
           <div className="absolute bottom-[-10%] right-[-10%] w-[80%] h-[50%] bg-white/5 dark:bg-white/5 blur-[80px] rounded-full" />
       </div>

       {/* Progress Bar */}
       <div className="w-full flex justify-center gap-3 pt-12 z-20 px-6">
          {slides.map((_, i) => (
              <div 
                key={i} 
                className={`h-1.5 rounded-full transition-all duration-500 ease-out 
                  ${i === currentSlide ? `w-12 ${slides[currentSlide].bg.replace('bg-', 'bg-')}` : 'w-2 bg-gray-300 dark:bg-gray-800'}`} 
              />
          ))}
       </div>

       {/* Slide Content Area */}
       <div className="flex-1 w-full relative flex items-center justify-center">
          {slides.map((slide, index) => (
             <div 
                key={slide.id}
                className={`absolute inset-0 flex flex-col items-center justify-center text-center px-8 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]
                    ${index === currentSlide 
                        ? 'opacity-100 translate-x-0 scale-100 blur-0' 
                        : (index < currentSlide ? 'opacity-0 -translate-x-[50%] scale-90 blur-md' : 'opacity-0 translate-x-[50%] scale-90 blur-md')}
                `}
             >
                 {/* Icon Container with Parallax Feel */}
                 <div className={`
                    w-40 h-40 rounded-[40px] shadow-2xl flex items-center justify-center mb-12 relative overflow-hidden group
                    ${slide.bg} transition-transform duration-500
                 `}>
                     <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent" />
                     <div className="absolute -inset-full bg-gradient-to-r from-transparent via-white/20 to-transparent rotate-45 animate-shimmer" />
                     <div className="relative z-10 transform transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6">
                         {slide.icon}
                     </div>
                 </div>

                 <h2 className="text-4xl md:text-5xl font-extrabold text-black dark:text-white mb-6 tracking-tight leading-tight">
                     {slide.title}
                 </h2>
                 <p className="text-lg text-gray-600 dark:text-gray-400 font-medium leading-relaxed max-w-sm mx-auto">
                     {slide.desc}
                 </p>
             </div>
          ))}
       </div>

       {/* Bottom Controls */}
       <div className="w-full z-20 p-8 pb-safe-bottom">
           <Button 
             onClick={handleNext}
             className={`w-full py-4 text-lg font-bold shadow-xl transition-all duration-300 active:scale-95
                bg-black dark:bg-white text-white dark:text-black hover:scale-[1.02]
             `}
           >
              {currentSlide === slides.length - 1 ? (
                  <span className="flex items-center gap-3">Начать работу <Check size={22} strokeWidth={3} /></span>
              ) : (
                  <span className="flex items-center gap-3">Далее <ChevronRight size={22} strokeWidth={3} /></span>
              )}
           </Button>
       </div>
       
       <style>{`
         @keyframes shimmer {
            0% { transform: translateX(-150%) rotate(45deg); }
            100% { transform: translateX(150%) rotate(45deg); }
         }
         .animate-shimmer {
            animation: shimmer 3s infinite linear;
         }
       `}</style>
    </div>
  );
};
