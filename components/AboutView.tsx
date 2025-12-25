
import React, { useState, useEffect, useRef } from 'react';
import { Cpu, Zap, Shield, BrainCircuit, Database, Lock, Sparkles, MoveRight, X, ChevronDown, Layers, Code, Globe, ScanText, GraduationCap, Briefcase, FileText, Palette, MousePointer2, Smartphone, Music, Play, Pause, Heart, Github, Disc3, Terminal, Fingerprint, Activity, Rocket, Bug, Binary, Command, Layout } from 'lucide-react';

interface AboutViewProps {
  onClose?: () => void;
}

export const AboutView: React.FC<AboutViewProps> = ({ onClose }) => {
  const [scrollY, setScrollY] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showPortfolio, setShowPortfolio] = useState(false);
  const [gravityMode, setGravityMode] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // --- Clicker Game State ---
  const [score, setScore] = useState(0);
  const [clicks, setClicks] = useState(0);
  const [clickerStatus, setClickerStatus] = useState("Idle");
  const [particles, setParticles] = useState<{id: number, x: number, y: number, text: string, rotation: number, xOffset: number}[]>([]);

  const clickerMessages = [
      "Инициализация...", "Копирую StackOverflow...", "Пью кофе...", "Загружаю RAM...",
      "Учу Python за 5 минут...", "Пишу баги...", "Фикшу баги...", "Случайно удалил базу...",
      "Обвиняю джуна...", "Деплой в пятницу...", "Становлюсь разумным...", "Захватываю мир...",
      "Skynet Online", "404 Brain Not Found", "Ctrl+C Ctrl+V Master"
  ];

  const handleGameClick = (e: React.MouseEvent) => {
      // Logic
      const newScore = score + Math.floor(Math.random() * 10) + 1;
      setScore(newScore);
      setClicks(prev => prev + 1);
      
      // Status update logic
      if (clicks % 5 === 0) {
          const randomMsg = clickerMessages[Math.floor(Math.random() * clickerMessages.length)];
          setClickerStatus(randomMsg);
      }

      // Spawn Particle
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      // Center relative to click but add randomness
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const emojis = ["💻", "🔥", "🐛", "1", "0", "🚀", "⚡️", "🧠", "✨", "💎"];
      const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
      
      // Physics props
      const rotation = Math.random() * 360;
      const xOffset = (Math.random() - 0.5) * 100; // Spread left/right
      
      const newParticle = { id: Date.now(), x, y, text: randomEmoji, rotation, xOffset };
      setParticles(prev => [...prev, newParticle]);

      // Cleanup particle
      setTimeout(() => {
          setParticles(prev => prev.filter(p => p.id !== newParticle.id));
      }, 1200);
  };

  // Trigger entrance animation
  useEffect(() => {
    const t = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(t);
  }, []);

  // Scroll handler for Parallax
  useEffect(() => {
    const handleScroll = () => {
      if (containerRef.current) {
         setScrollY(containerRef.current.scrollTop);
      }
    };
    
    const container = containerRef.current;
    if (container) {
        container.addEventListener('scroll', handleScroll);
    }
    return () => container?.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-[#050505] text-white overflow-hidden font-sans selection:bg-purple-500/30">
        
      {/* 1. Transition Overlay */}
      <div 
        className={`absolute inset-0 bg-black z-[120] pointer-events-none transition-opacity duration-1000 ease-in-out ${isLoaded ? 'opacity-0' : 'opacity-100'}`}
      />

      {/* 2. Close Button (Strictly Icon Only) */}
      <button 
        onClick={() => {
            setIsLoaded(false);
            setTimeout(() => onClose && onClose(), 800);
        }}
        className={`fixed top-6 right-6 z-[115] p-3 rounded-full bg-black/50 hover:bg-white/20 backdrop-blur-md border border-white/10 text-white transition-all duration-500 hover:rotate-90 ${isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}
        title="Закрыть"
      >
        <X size={24} />
      </button>

      {/* 3. Global Background Effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' opacity=\'0.2\'/%3E%3C/svg%3E')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
          
          {/* Parallax Stars/Particles */}
          <div 
            className="absolute top-0 left-0 w-full h-full opacity-40 transition-transform duration-100 ease-out"
            style={{ transform: `translateY(${scrollY * -0.2}px)` }}
          >
              <div className="absolute top-[10%] left-[20%] w-1 h-1 bg-white rounded-full shadow-[0_0_10px_white]"></div>
              <div className="absolute top-[30%] right-[20%] w-2 h-2 bg-blue-400 rounded-full blur-[2px]"></div>
              <div className="absolute top-[60%] left-[50%] w-1.5 h-1.5 bg-purple-400 rounded-full blur-[1px]"></div>
          </div>

          {/* Deep Gradients */}
          <div 
            className="absolute top-[-20%] left-[-20%] w-[80vw] h-[80vw] bg-blue-900/20 rounded-full blur-[120px] mix-blend-screen transition-transform duration-700"
            style={{ transform: `translate(${scrollY * -0.05}px, ${scrollY * 0.05}px)` }}
          />
          <div 
            className="absolute bottom-[-20%] right-[-20%] w-[80vw] h-[80vw] bg-purple-900/10 rounded-full blur-[150px] mix-blend-screen transition-transform duration-700"
            style={{ transform: `translate(${scrollY * 0.05}px, ${scrollY * -0.05}px)` }}
          />
      </div>

      {/* 4. Scrollable Content Container */}
      <div 
        ref={containerRef}
        className={`relative h-full overflow-y-auto overflow-x-hidden scrollbar-hide perspective-1000 ${gravityMode ? 'overflow-hidden' : ''}`}
      >
        
        {/* --- HERO SECTION --- */}
        <div className={`min-h-screen flex flex-col items-center justify-center p-6 relative transition-transform duration-1000 ${gravityMode ? 'rotate-180 scale-75' : ''}`}>
             <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-px h-[40vh] bg-gradient-to-b from-transparent via-white/50 to-transparent transition-all duration-[2000ms] ${isLoaded ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0'}`} />

             <div className="relative z-10 text-center max-w-5xl">
                 <div className={`flex flex-col items-center gap-6 transition-all duration-1000 delay-300 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                     
                     <h1 className="text-4xl md:text-[8rem] font-bold tracking-tighter leading-[1.1] md:leading-[0.9] text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/40 mb-6">
                         <span className="block blur-reveal delay-100">TRANSFORM</span>
                         <span className="block blur-reveal delay-300">PIXELS TO</span>
                         <span className="block blur-reveal delay-500 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">KNOWLEDGE</span>
                     </h1>

                     <p className="text-base md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed font-light mt-4 blur-reveal delay-700">
                         Полностью бесплатный Open Source инструмент. Некоммерческий проект. Автор: Андреев Иван.
                     </p>
                 </div>
             </div>
        </div>

        {/* --- PHILOSOPHY --- */}
        <RevealSection className="min-h-[60vh] flex items-center justify-center py-12 md:py-24 px-6">
             <div className="max-w-4xl text-center relative">
                 <div className="absolute -top-20 -left-20 w-40 h-40 bg-purple-500/20 rounded-full blur-[50px] animate-pulse"></div>
                 
                 <span className="text-purple-400 text-sm font-mono uppercase tracking-widest mb-6 block">Философия</span>
                 <h2 className="text-2xl md:text-5xl font-bold leading-tight mb-8">
                     "Лучший интерфейс — это <br/> <span className="text-white border-b border-white/20">отсутствие интерфейса</span>."
                 </h2>
                 <p className="text-base md:text-xl text-gray-400 font-light leading-relaxed max-w-2xl mx-auto">
                     Мы устали от сложных меню и долгих загрузок. Идея Lex OCR родилась из желания сделать магию доступной. 
                     Вы просто перетаскиваете файл — и через секунду получаете результат.
                 </p>
             </div>
        </RevealSection>

        {/* --- FOR WHOM (Mobile Optimized) --- */}
        <RevealSection className="py-12 md:py-24 px-6">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-10 md:mb-16">
                     <span className="text-green-400 text-sm font-mono uppercase tracking-widest mb-4 block">Target Audience</span>
                     <h2 className="text-3xl md:text-6xl font-bold">Для кого это сделано?</h2>
                </div>

                {/* Stacks vertically on mobile */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    {/* Students */}
                    <div className="p-6 md:p-8 rounded-[32px] bg-white/5 border border-white/5 hover:border-blue-500/30 hover:bg-white/10 transition-all duration-300 group">
                        <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <GraduationCap size={24} />
                        </div>
                        <h3 className="text-xl font-bold mb-3">Студенты</h3>
                        <p className="text-gray-400 text-sm">
                            Мгновенно превращайте фото конспектов в редактируемый текст.
                        </p>
                    </div>

                    {/* Developers */}
                    <div className="p-6 md:p-8 rounded-[32px] bg-white/5 border border-white/5 hover:border-purple-500/30 hover:bg-white/10 transition-all duration-300 group">
                        <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <Code size={24} />
                        </div>
                        <h3 className="text-xl font-bold mb-3">Разработчики</h3>
                        <p className="text-gray-400 text-sm">
                            Lex сохраняет отступы и синтаксис при сканировании кода.
                        </p>
                    </div>

                    {/* Business */}
                    <div className="p-6 md:p-8 rounded-[32px] bg-white/5 border border-white/5 hover:border-amber-500/30 hover:bg-white/10 transition-all duration-300 group">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <Briefcase size={24} />
                        </div>
                        <h3 className="text-xl font-bold mb-3">Бизнес</h3>
                        <p className="text-gray-400 text-sm">
                            Оцифровка договоров за секунды. Экспорт в PDF и Word.
                        </p>
                    </div>

                    {/* Privacy */}
                    <div className="p-6 md:p-8 rounded-[32px] bg-white/5 border border-white/5 hover:border-red-500/30 hover:bg-white/10 transition-all duration-300 group">
                        <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <Shield size={24} />
                        </div>
                        <h3 className="text-xl font-bold mb-3">Приватность</h3>
                        <p className="text-gray-400 text-sm">
                            Данные не хранятся на серверах. Безопасность превыше всего.
                        </p>
                    </div>
                </div>
            </div>
        </RevealSection>

        {/* --- DESIGN DNA (Mobile Optimized) --- */}
        <RevealSection className="py-12 md:py-24 px-6 bg-gradient-to-b from-transparent via-[#0a0a0f] to-transparent">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-10 md:mb-16">
                    <span className="text-blue-400 text-sm font-mono uppercase tracking-widest mb-4 block">ДНК Дизайна</span>
                    <h2 className="text-3xl md:text-6xl font-bold">Стоим на плечах гигантов</h2>
                    <p className="text-gray-400 mt-6 max-w-2xl mx-auto">
                        Визуальный язык Lex OCR — это синтез лучших практик индустрии.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Google Card */}
                    <div className="group relative p-8 rounded-[32px] bg-white/5 border border-white/5 overflow-hidden backdrop-blur-md hover:bg-white/10 transition-all duration-500 hover:-translate-y-2">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-red-500/10 to-yellow-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <div className="relative z-10">
                            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-6 text-white group-hover:scale-110 transition-transform">
                                <Palette size={28} />
                            </div>
                            <h3 className="text-2xl font-bold mb-2">Google Material</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                Использование концепции "Material You". Большие скругления и адаптивность.
                            </p>
                        </div>
                    </div>

                    {/* Apple Card */}
                    <div className="group relative p-8 rounded-[32px] bg-white/5 border border-white/5 overflow-hidden backdrop-blur-md hover:bg-white/10 transition-all duration-500 hover:-translate-y-2">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <div className="relative z-10">
                            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-6 text-white group-hover:scale-110 transition-transform">
                                <Layout size={28} />
                            </div>
                            <h3 className="text-2xl font-bold mb-2">Apple HIG</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                "Fluid Interfaces". Плавные анимации и ощущение физического веса элементов.
                            </p>
                        </div>
                    </div>

                    {/* Braun/Minimalism Card */}
                    <div className="group relative p-8 rounded-[32px] bg-white/5 border border-white/5 overflow-hidden backdrop-blur-md hover:bg-white/10 transition-all duration-500 hover:-translate-y-2">
                        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <div className="relative z-10">
                            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-6 text-white group-hover:scale-110 transition-transform">
                                <Command size={28} />
                            </div>
                            <h3 className="text-2xl font-bold mb-2">Dieter Rams</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                "Less but better". Мы убрали всё лишнее. Оставили только контент.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </RevealSection>

        {/* --- DESIGN CODE (Mobile Optimized) --- */}
        <RevealSection className="min-h-screen py-12 md:py-24 px-6">
             <div className="max-w-6xl mx-auto">
                 <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-center mb-16">
                     <div className="flex-1 text-center md:text-left">
                         <span className="text-cyan-400 text-sm font-mono uppercase tracking-widest mb-4 block">Design Code</span>
                         <h2 className="text-4xl md:text-6xl font-bold mb-6">Живой <br/> Стекломорфизм</h2>
                         <p className="text-gray-400 text-lg leading-relaxed">
                             Интерфейс, который чувствуется как реальный объект.
                         </p>
                     </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                      {/* Features optimized for mobile stacking */}
                      <div className="p-8 rounded-[32px] bg-white/5 border border-white/5 hover:bg-white/10 transition-colors backdrop-blur-md">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl mb-6 shadow-lg shadow-blue-500/20 flex items-center justify-center">
                              <Layers size={24} className="text-white"/>
                          </div>
                          <h3 className="text-xl font-bold mb-3">Глубина</h3>
                          <p className="text-gray-400 text-sm">
                              Многослойные тени и размытие фона создают иерархию.
                          </p>
                      </div>

                      <div className="p-8 rounded-[32px] bg-white/5 border border-white/5 hover:bg-white/10 transition-colors backdrop-blur-md">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl mb-6 shadow-lg shadow-purple-500/20 flex items-center justify-center">
                              <MousePointer2 size={24} className="text-white"/>
                          </div>
                          <h3 className="text-xl font-bold mb-3">Реактивность</h3>
                          <p className="text-gray-400 text-sm">
                              Кнопки "дышат" при наведении. Интерфейс живой.
                          </p>
                      </div>

                       <div className="p-8 rounded-[32px] bg-white/5 border border-white/5 hover:bg-white/10 transition-colors backdrop-blur-md">
                          <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl mb-6 shadow-lg shadow-orange-500/20 flex items-center justify-center">
                              <Smartphone size={24} className="text-white"/>
                          </div>
                          <h3 className="text-xl font-bold mb-3">Адаптивность</h3>
                          <p className="text-gray-400 text-sm">
                              Удобно и на телефоне, и на большом экране.
                          </p>
                      </div>
                 </div>
             </div>
        </RevealSection>

        {/* --- AUTHOR SECTION (CLICKABLE) --- */}
        <RevealSection className="min-h-screen py-12 md:py-24 px-6 flex items-center justify-center relative">
             <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-900/10 to-transparent pointer-events-none"></div>
             
             <div 
                onClick={() => setShowPortfolio(true)}
                className="w-full max-w-5xl bg-white/5 backdrop-blur-xl border border-white/10 rounded-[48px] p-6 md:p-12 shadow-2xl relative overflow-hidden group cursor-pointer transition-transform hover:scale-[1.01] active:scale-[0.99]"
             >
                 {/* Decorative background for card */}
                 <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-bl from-purple-600/20 to-transparent rounded-full blur-[80px] group-hover:opacity-75 transition-opacity"></div>
                 
                 <div className="absolute top-8 right-8 text-white/30 group-hover:text-white transition-colors">
                     <span className="text-xs uppercase tracking-widest font-bold border border-white/20 px-3 py-1 rounded-full bg-black/20 flex items-center gap-2">
                         <span className="hidden md:inline">Открыть Портфолио</span>
                         <MoveRight size={12} />
                     </span>
                 </div>

                 <div className="relative z-10 flex flex-col md:flex-row gap-8 md:gap-12 items-center">
                     
                     {/* Photo */}
                     <div className="flex flex-col gap-6 w-full md:w-1/3">
                         <div className="relative aspect-square rounded-[32px] overflow-hidden border-2 border-white/10 shadow-2xl bg-black">
                             <img 
                                src="/avatar.png" 
                                onError={(e) => { e.currentTarget.src = "https://cdn-icons-png.flaticon.com/512/4140/4140048.png"; }}
                                alt="Ivan Andreev" 
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                             />
                             <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                                 <span className="inline-block px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold border border-white/10">
                                     Создатель
                                 </span>
                             </div>
                         </div>
                     </div>

                     {/* Text Column */}
                     <div className="flex-1 text-center md:text-left">
                         <h2 className="text-3xl md:text-6xl font-bold mb-2">Иван Андреев</h2>
                         <p className="text-purple-400 font-mono text-lg mb-8 tracking-wide">19 лет • Developer</p>
                         
                         <blockquote className="text-lg md:text-2xl font-light leading-relaxed text-gray-200 mb-8 border-l-4 border-purple-500 pl-6 italic">
                             "Хочу сделать мир чуточку лучше. Код — это мой инструмент."
                         </blockquote>

                         <div className="space-y-6">
                             <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                                 <Tag icon={<Code size={16}/>} label="Fullstack" />
                                 <Tag icon={<Music size={16}/>} label="Music" />
                                 <Tag icon={<Heart size={16}/>} label="OS Lover" />
                             </div>
                         </div>
                     </div>
                 </div>
             </div>
        </RevealSection>

        {/* --- INTERACTIVE PLAYGROUND FOOTER --- */}
        <RevealSection className="py-24 px-6 flex flex-col items-center border-t border-white/5 bg-[#0a0a0f] relative overflow-hidden">
             
             <div className="relative z-10 flex flex-col items-center">
                <h3 className="text-2xl font-bold mb-8 flex items-center gap-2">
                    <Terminal className="text-green-500" />
                    <span>Neural Playground</span>
                </h3>
                <p className="text-gray-500 mb-8 max-w-md text-center">Лаборатория безумия.</p>

                <div className="flex flex-wrap gap-4 md:gap-6 justify-center max-w-4xl">
                    <InteractiveButton 
                        label="Gravity" 
                        icon={<Globe size={18} />} 
                        color="blue" 
                        active={gravityMode}
                        onClick={() => setGravityMode(!gravityMode)}
                    />
                    
                    {/* --- AI TRAINER GAME --- */}
                    <div 
                        className="bg-white/5 border border-white/10 p-6 rounded-[24px] flex flex-col items-center gap-4 hover:bg-white/10 transition-colors relative group select-none cursor-pointer active:scale-95"
                        onClick={handleGameClick}
                    >
                        <div className="text-xs text-gray-400 font-mono uppercase tracking-widest">AI Trainer Clicker</div>
                        <div className={`text-4xl font-bold flex items-center gap-2 ${clicks > 10 ? 'animate-pulse' : ''}`}>
                            <BrainCircuit className="text-purple-500" size={32} />
                            <span>{score.toLocaleString()}</span>
                            <span className="text-sm font-normal text-gray-500 self-end mb-1">TFLOPS</span>
                        </div>
                        
                        <div className="text-xs text-center text-green-400 font-mono h-4 min-w-[200px]">
                            {">"} {clickerStatus}
                        </div>

                        <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[24px]">
                            {particles.map(p => (
                                <div 
                                    key={p.id}
                                    className="absolute text-xl font-bold animate-float-pop pointer-events-none"
                                    style={{ 
                                        left: p.x, 
                                        top: p.y,
                                        '--tw-rotate': `${p.rotation}deg`,
                                        '--tw-translate-x': `${p.xOffset}px`
                                    } as React.CSSProperties}
                                >
                                    {p.text}
                                </div>
                            ))}
                        </div>
                    </div>

                    <InteractiveButton label="Glitch" icon={<Bug size={18} />} color="red" onClick={() => alert("Вы сломали интернет.")} />
                </div>

                <div className="mt-20 text-center opacity-40 hover:opacity-100 transition-opacity duration-500">
                    <p className="text-sm font-medium tracking-tight text-white">Lex OCR — Open Source & Free</p>
                    <p className="text-xs mt-2 font-mono text-gray-600">2025 • Автор: Андреев Иван</p>
                </div>
             </div>
        </RevealSection>

      </div>

      {/* --- PORTFOLIO MODAL --- */}
      {showPortfolio && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/80 backdrop-blur-xl animate-fade-in" onClick={() => setShowPortfolio(false)} />
              
              <div className="relative bg-[#1c1c1e] border border-white/10 rounded-[32px] w-full max-w-2xl max-h-[80vh] overflow-y-auto p-8 shadow-2xl animate-spring-up">
                  <button onClick={() => setShowPortfolio(false)} className="absolute top-4 right-4 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
                      <X size={20} />
                  </button>
                  
                  <div className="text-center mb-8">
                      <div className="w-24 h-24 mx-auto rounded-full overflow-hidden border-2 border-purple-500 mb-4 shadow-xl shadow-purple-500/20">
                          <img 
                             src="/avatar.png" 
                             onError={(e) => { e.currentTarget.src = "https://cdn-icons-png.flaticon.com/512/4140/4140048.png"; }}
                             alt="Avatar" 
                             className="w-full h-full object-cover" 
                          />
                      </div>
                      <h2 className="text-2xl font-bold">Иван Андреев</h2>
                      <p className="text-purple-400 text-sm font-mono mt-1">Fullstack Developer • UI/UX Designer</p>
                  </div>

                  <div className="space-y-6">
                      <SkillGroup title="Tech Stack сайта" skills={[
                          { name: 'React 19 & TypeScript', level: 98 },
                          { name: 'Tailwind CSS & Glassmorphism', level: 100 },
                          { name: 'Google Gemini 2.5 API', level: 95 },
                          { name: 'Web Audio API & Canvas', level: 85 }
                      ]} />
                      
                      <SkillGroup title="Core Skills" skills={[
                          { name: 'Node.js Architecture', level: 80 },
                          { name: 'UI/UX & Animation', level: 92 },
                          { name: 'System Design', level: 75 },
                      ]} />

                       <SkillGroup title="Tools" skills={[
                          { name: 'Figma', level: 88 },
                          { name: 'Vite', level: 90 },
                          { name: 'Git', level: 85 },
                      ]} />
                  </div>

                  <div className="mt-8 pt-8 border-t border-white/10 text-center">
                      <button onClick={() => setShowPortfolio(false)} className="w-full py-4 bg-white text-black font-bold rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                          <span>Круто, закрыть</span>
                          <Rocket size={18} className="text-purple-600" />
                      </button>
                  </div>
              </div>
          </div>
      )}

      <style>{`
        .blur-reveal {
            animation: blurReveal 1s cubic-bezier(0.2, 1, 0.3, 1) forwards;
            opacity: 0;
            filter: blur(10px);
            transform: translateY(20px);
        }
        @keyframes blurReveal {
            to {
                opacity: 1;
                filter: blur(0);
                transform: translateY(0);
            }
        }
        .animate-spin-slow {
            animation: spin 8s linear infinite;
        }
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        .animate-float-pop {
            animation: floatPop 1.2s ease-out forwards;
        }
        @keyframes floatPop {
            0% { transform: translate(0, 0) scale(0.5) rotate(0deg); opacity: 0; }
            20% { opacity: 1; transform: translate(var(--tw-translate-x), -40px) scale(1.2) rotate(var(--tw-rotate)); }
            100% { transform: translate(var(--tw-translate-x), -120px) scale(0.8) rotate(calc(var(--tw-rotate) + 90deg)); opacity: 0; }
        }
        .delay-100 { animation-delay: 100ms; }
        .delay-300 { animation-delay: 300ms; }
        .delay-500 { animation-delay: 500ms; }
        .delay-700 { animation-delay: 700ms; }
      `}</style>
    </div>
  );
};

// --- Helper Components ---

const RevealSection: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className }) => {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) setIsVisible(true);
            },
            { threshold: 0.15 }
        );
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);

    return (
        <div ref={ref} className={`${className} transition-all duration-1000 transform ${isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-20 scale-95'}`}>
            {children}
        </div>
    );
};

const Tag: React.FC<{ icon: React.ReactNode, label: string }> = ({ icon, label }) => (
    <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/5 text-sm font-medium text-gray-300 hover:bg-white/10 hover:text-white transition-colors cursor-default">
        {icon}
        <span>{label}</span>
    </div>
);

const SkillGroup: React.FC<{ title: string, skills: {name: string, level: number}[] }> = ({ title, skills }) => (
    <div>
        <h4 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-3">{title}</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {skills.map(s => (
                <div key={s.name} className="bg-white/5 p-3 rounded-xl flex items-center justify-between">
                    <span className="font-medium">{s.name}</span>
                    <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500" style={{ width: `${s.level}%` }}></div>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

const InteractiveButton: React.FC<{ label: string, icon: React.ReactNode, color: 'blue'|'red'|'green'|'purple', onClick?: () => void, active?: boolean }> = ({ label, icon, color, onClick, active }) => {
    const [localActive, setLocalActive] = useState(false);
    const isActive = active !== undefined ? active : localActive;
    
    const handleClick = () => {
        if (onClick) onClick();
        else setLocalActive(!localActive);
    };

    const colors = {
        blue: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
        red: 'bg-red-500/20 text-red-400 border-red-500/50',
        green: 'bg-green-500/20 text-green-400 border-green-500/50',
        purple: 'bg-purple-500/20 text-purple-400 border-purple-500/50',
    };

    return (
        <button 
            onClick={handleClick}
            className={`
                flex items-center gap-3 px-6 py-4 rounded-2xl border transition-all duration-200 active:scale-90 select-none
                ${isActive ? colors[color] + ' shadow-[0_0_30px_rgba(255,255,255,0.1)]' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}
            `}
        >
            {icon}
            <span className="font-bold">{label}</span>
            <div className={`w-2 h-2 rounded-full transition-colors ${isActive ? 'bg-current animate-pulse' : 'bg-gray-600'}`} />
        </button>
    );
};
