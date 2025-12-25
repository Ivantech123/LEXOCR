import React, { useEffect, useState } from 'react';
import { Command, Sparkles } from 'lucide-react';

interface IntroAnimationProps {
  onComplete: () => void;
}

export const IntroAnimation: React.FC<IntroAnimationProps> = ({ onComplete }) => {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    // Optimized timing sequence
    const timers = [
      setTimeout(() => setStage(1), 100),   // Background
      setTimeout(() => setStage(2), 500),   // Logo Pop
      setTimeout(() => setStage(3), 1300),  // Text Reveal
      setTimeout(() => setStage(4), 2800),  // Exit Start
      setTimeout(() => onComplete(), 3300)  // Unmount
    ];
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center bg-[#f2f2f7] dark:bg-black transition-opacity duration-700 ease-out
      ${stage === 4 ? 'opacity-0 pointer-events-none' : 'opacity-100'}
    `}>
       {/* Ambient Background */}
       <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100vw] h-[100vw] max-w-[800px] max-h-[800px] bg-blue-500/10 dark:bg-blue-900/10 rounded-full blur-[100px] transition-all duration-1000 ease-out 
              ${stage >= 1 ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}
          `} />
       </div>

       <div className={`relative flex flex-col items-center transform transition-transform duration-700 ease-[cubic-bezier(0.7,0,0.3,1)] ${stage === 4 ? 'scale-110' : 'scale-100'}`}>
          
          {/* Logo Container */}
          <div className={`relative flex items-center justify-center transition-all duration-1000 cubic-bezier(0.34, 1.56, 0.64, 1)
              ${stage >= 2 ? 'scale-100 opacity-100 translate-y-0' : 'scale-0 opacity-0 translate-y-12'}
          `}>
              <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-purple-600 rounded-[32px] shadow-2xl shadow-purple-500/30 flex items-center justify-center relative overflow-hidden group">
                  {/* Glare Effect */}
                  <div className={`absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent w-full h-full -translate-x-full transition-transform duration-1000 ease-in-out delay-500 ${stage >= 2 ? 'translate-x-full' : ''}`} />
                  
                  <Command size={48} className="text-white relative z-10 drop-shadow-md" />
              </div>
              
              {/* Floating Sparkle */}
              <div className={`absolute -top-3 -right-3 bg-white dark:bg-[#2c2c2e] p-2 rounded-xl shadow-lg transition-all duration-500 delay-700 cubic-bezier(0.34, 1.56, 0.64, 1)
                  ${stage >= 2 ? 'scale-100 opacity-100 rotate-12' : 'scale-0 opacity-0 -rotate-45'}
              `}>
                  <Sparkles size={20} className="text-amber-400" fill="currentColor" />
              </div>
          </div>

          {/* Text Container with Masking */}
          <div className="mt-8 text-center">
              <h1 className="text-5xl font-extrabold tracking-tight flex gap-3 overflow-hidden py-2">
                  <span className={`inline-block bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 transition-all duration-700 delay-[800ms] cubic-bezier(0.2, 1, 0.3, 1)
                      ${stage >= 3 ? 'translate-y-0 opacity-100' : 'translate-y-[120%] opacity-0'}
                  `}>
                    Lex
                  </span>
                  <span className={`inline-block bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-700 delay-[900ms] cubic-bezier(0.2, 1, 0.3, 1)
                      ${stage >= 3 ? 'translate-y-0 opacity-100' : 'translate-y-[120%] opacity-0'}
                  `}>
                    OCR
                  </span>
              </h1>
              
              {/* Subtitle */}
              <p className={`text-gray-500 dark:text-gray-400 font-medium tracking-wide transition-all duration-700 delay-[1100ms]
                  ${stage >= 3 ? 'opacity-100 translate-y-0 blur-0' : 'opacity-0 translate-y-4 blur-sm'}
              `}>
                  Thinking Visualized
              </p>
          </div>

       </div>
    </div>
  );
};