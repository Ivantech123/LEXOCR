
import React, { useState, useRef, useEffect } from 'react';
import { ScanText, AlertCircle, Menu, Mic, History, Command, Sun, Moon, Shield, Info, Trash2, ChevronRight, FileText, Home, Sparkles } from 'lucide-react';
import { AppState, ImageFile, AppView, Theme, HistoryItem } from './types';
import { extractTextFromImages } from './services/geminiService';
import { historyService } from './services/historyService';
import { ImageUploader, ImageUploaderHandle } from './components/ImageUploader';
import { ResultCard } from './components/ResultCard';
import { ImageViewer } from './components/ImageViewer';
import { Button } from './components/Button';
import { StagingArea } from './components/StagingArea';
import { MobileNavBar } from './components/MobileNavBar';
import { SideMenu } from './components/SideMenu';
import { AudioRecorder } from './components/AudioRecorder';
import { IntroAnimation } from './components/IntroAnimation';
import { ProcessingView } from './components/ProcessingView';
import { WelcomeModal } from './components/WelcomeModal';
import { AboutView } from './components/AboutView';
import { Dashboard } from './components/Dashboard';
import { Onboarding } from './components/Onboarding';
import { TipsView } from './components/TipsView';
import { AiChatView } from './components/AiChatView';
import { LegalEditor } from './components/LegalEditor';
import { haptic } from './utils/haptics';

const App: React.FC = () => {
  // Theme State - Auto Detect System Theme
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  const [showIntro, setShowIntro] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);

  // App View State
  const [currentView, setCurrentView] = useState<AppView>('DASHBOARD');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Data State
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // OCR State
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [pages, setPages] = useState<ImageFile[]>([]);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [extractedText, setExtractedText] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isConvertingPdf, setIsConvertingPdf] = useState(false);
  const [syncScrollPercent, setSyncScrollPercent] = useState<number>(0);
  const [isImageZoomed, setIsImageZoomed] = useState(false);
  
  // Mobile View State (Result)
  const [mobileTab, setMobileTab] = useState<'image' | 'text'>('text');
  
  // Refs
  const uploaderRef = useRef<ImageUploaderHandle>(null);
  const touchStartRef = useRef<number | null>(null);
  const minSwipeDistance = 50;

  // Initialize Theme Listener
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    if (theme === 'dark') document.body.classList.add('dark');
    else document.body.classList.remove('dark');

    // History Load
    setHistory(historyService.getAll());

    // System Theme Listener
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
        setTheme(e.matches ? 'dark' : 'light');
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  // Global Paste Handler
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
        if (!e.clipboardData) return;
        const items = e.clipboardData.items;
        const newImages: ImageFile[] = [];

        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const file = items[i].getAsFile();
                if (file) {
                    await new Promise<void>((resolve) => {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                            const result = reader.result as string;
                            newImages.push({
                                id: `paste-${Date.now()}-${i}`,
                                file: file,
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
        }

        if (newImages.length > 0) {
            handleImagesAdded(newImages);
        }
    };
    
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const toggleTheme = () => {
      haptic.impactLight();
      setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleIntroComplete = () => {
    setShowIntro(false);
    
    // Check onboarding status
    if (!historyService.hasSeenWelcome()) {
        setShowOnboarding(true);
    }
  };

  const handleOnboardingComplete = () => {
      historyService.markWelcomeSeen();
      setShowOnboarding(false);
  };

  // --- Handlers ---

  const handleImagesAdded = (newPages: ImageFile[]) => {
    haptic.success();
    setPages(prev => [...prev, ...newPages]);
    setErrorMsg(null);
    setAppState(AppState.IDLE);
    setCurrentView('OCR'); 
  };

  const handleReorder = (reorderedPages: ImageFile[]) => {
      setPages(reorderedPages);
  };

  const handleRemovePage = (id: string) => {
      haptic.impactMedium();
      setPages(prev => prev.filter(p => p.id !== id));
  };

  const handleUpdatePage = (id: string, updates: Partial<ImageFile>) => {
      setPages(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const handleStartProcessing = async () => {
    if (pages.length === 0) return;

    haptic.impactMedium();
    setActivePageIndex(0);
    setAppState(AppState.PROCESSING);
    setErrorMsg(null);

    try {
      const text = await extractTextFromImages(pages);
      setExtractedText(text);
      setAppState(AppState.SUCCESS);
      setMobileTab('text'); 
      haptic.success();
      
      const newItem: HistoryItem = {
          id: Date.now().toString(),
          date: Date.now(),
          type: 'OCR',
          preview: pages[0].previewUrl, 
          summary: text.slice(0, 80).replace(/\n/g, ' ') + '...',
          fullText: text
      };
      const updatedHistory = historyService.add(newItem);
      setHistory(updatedHistory);

    } catch (err: any) {
      console.error(err);
      haptic.error();
      setErrorMsg(err.message || "Не удалось распознать текст.");
      setAppState(AppState.ERROR);
    }
  };

  const restoreHistoryItem = (item: HistoryItem) => {
      haptic.impactLight();
      if (item.type === 'OCR') {
          setExtractedText(item.fullText);
          setPages([]); 
          setAppState(AppState.SUCCESS);
          setCurrentView('OCR');
          setMobileTab('text');
      }
  };

  const handleDeleteHistoryItem = (id: string) => {
      // Optimistic UI update
      const updated = history.filter(i => i.id !== id);
      setHistory(updated);
      
      // Update storage
      localStorage.setItem('lex_ocr_history_v1', JSON.stringify(updated));
  };

  const clearHistory = () => {
      if (confirm('Вы уверены? История будет удалена безвозвратно.')) {
        haptic.impactMedium();
        historyService.clear();
        setHistory([]);
      }
  };

  const resetApp = () => {
    setAppState(AppState.IDLE);
    setPages([]);
    setExtractedText("");
    setErrorMsg(null);
    setActivePageIndex(0);
    setSyncScrollPercent(0);
    setIsImageZoomed(false);
  };

  const handleQuickAction = (action: 'scan' | 'camera' | 'audio') => {
      if (action === 'audio') {
          setCurrentView('AUDIO');
      } else {
          setCurrentView('OCR');
          setTimeout(() => {
              if (action === 'camera') uploaderRef.current?.openCamera();
              if (action === 'scan') uploaderRef.current?.openFile();
          }, 100);
      }
  };

  // --- Gestures ---
  const handleTouchStart = (e: React.TouchEvent) => {
    if (appState !== AppState.SUCCESS || isImageZoomed) return;
    touchStartRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (appState !== AppState.SUCCESS || touchStartRef.current === null || isImageZoomed) return;
    
    const touchEnd = e.changedTouches[0].clientX;
    const distance = touchStartRef.current - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && mobileTab === 'image') {
        haptic.impactLight();
        setMobileTab('text');
    } else if (isRightSwipe && mobileTab === 'text') {
        haptic.impactLight();
        setMobileTab('image');
    }
    touchStartRef.current = null;
  };

  // --- Render Helpers ---

  const renderContent = () => {
    switch (currentView) {
      case 'DASHBOARD':
        return (
            <Dashboard 
                history={history} 
                onNavigate={setCurrentView}
                onQuickAction={handleQuickAction}
                onDeleteHistory={handleDeleteHistoryItem}
            />
        );
      
      case 'AI_CHAT':
        return <AiChatView />;
        
      case 'EDITOR':
        return <LegalEditor />;
      
      case 'TIPS':
        return <TipsView onClose={() => setCurrentView('DASHBOARD')} />;

      case 'AUDIO':
        return <AudioRecorder onOpenMenu={() => setIsMenuOpen(true)} onExit={() => setCurrentView('DASHBOARD')} />;
      
      case 'ABOUT':
        return <AboutView onClose={() => setCurrentView('DASHBOARD')} />;

      case 'HISTORY':
        return (
          <div className="flex-1 flex flex-col px-4 md:px-0 animate-spring-up overflow-hidden" key="history">
             <div className="flex items-center justify-between mb-6 py-4">
                 <h2 className="text-3xl font-bold text-black dark:text-white">История</h2>
                 {history.length > 0 && (
                     <button onClick={clearHistory} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors" title="Очистить историю">
                         <Trash2 size={20} />
                     </button>
                 )}
             </div>
             
             {history.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                    <div className="w-24 h-24 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-4 animate-scale-in-bounce">
                        <History size={40} />
                    </div>
                    <p className="animate-fade-in">Пока пусто</p>
                    <Button onClick={() => setCurrentView('OCR')} variant="text" className="mt-4">Начать сканирование</Button>
                </div>
             ) : (
                 <div className="flex-1 overflow-y-auto pb-24 space-y-4">
                     {history.map((item, index) => (
                         <div 
                            key={item.id}
                            onClick={() => restoreHistoryItem(item)}
                            className="bg-white dark:bg-[#1c1c1e] p-4 rounded-[24px] flex items-center gap-4 shadow-sm hover:shadow-md transition-all active:scale-98 cursor-pointer animate-slide-in-right will-change-transform"
                            style={{ animationDelay: `${index * 50}ms` }}
                         >
                             <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${item.type === 'OCR' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' : 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400'}`}>
                                 {item.type === 'OCR' ? <FileText size={24} /> : <Mic size={24} />}
                             </div>
                             <div className="flex-1 min-w-0">
                                 <div className="flex justify-between items-center mb-1">
                                     <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                         {new Date(item.date).toLocaleDateString()}
                                     </span>
                                     <span className="text-xs bg-gray-100 dark:bg-white/10 px-2 py-0.5 rounded text-gray-500">
                                         {item.type}
                                     </span>
                                 </div>
                                 <p className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2 leading-relaxed">
                                     {item.summary}
                                 </p>
                             </div>
                             <ChevronRight size={20} className="text-gray-300 dark:text-gray-600" />
                         </div>
                     ))}
                 </div>
             )}
          </div>
        );

      case 'PRIVACY':
        return (
          <div className="flex-1 overflow-y-auto px-4 md:px-0 pb-40" key="privacy">
             <div className="max-w-4xl mx-auto ios-glass p-8 md:p-12 rounded-[40px] shadow-sm animate-spring-up mb-24 mt-4 bg-white/50 dark:bg-black/40">
                 <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 rounded-2xl">
                        <Shield size={32} />
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold text-black dark:text-white tracking-tight">Политика конфиденциальности</h2>
                 </div>
                 
                 <div className="space-y-8 text-gray-700 dark:text-gray-300 text-base leading-relaxed">
                   <p>Настоящая политика описывает порядок обработки данных приложением Lex OCR.</p>
                   
                   <div className="bg-white/50 dark:bg-white/5 p-6 rounded-3xl space-y-4 border border-white/20">
                        <div>
                            <strong className="text-black dark:text-white block mb-1">1. Хранение данных</strong>
                            <p className="text-sm">История сканирований и аудиозаписей хранится в облачной базе данных Supabase (если выполнен вход) или локально в браузере. Мы используем защищенное соединение для синхронизации.</p>
                        </div>
                        <div>
                            <strong className="text-black dark:text-white block mb-1">2. Обработка AI</strong>
                            <p className="text-sm">Текст и изображения передаются в Google Gemini API только на момент обработки. Google не использует эти данные для обучения своих моделей (согласно политике API).</p>
                        </div>
                        <div>
                            <strong className="text-black dark:text-white block mb-1">3. Аккаунт</strong>
                            <p className="text-sm">Для синхронизации используется email и зашифрованный пароль. Вы можете запросить удаление аккаунта в любое время.</p>
                        </div>
                   </div>

                   <div className="pt-6 border-t border-gray-200 dark:border-white/10">
                       <Button onClick={() => setCurrentView('DASHBOARD')} variant="filled" className="w-full md:w-auto">Вернуться</Button>
                   </div>
                 </div>
              </div>
          </div>
        );

      case 'OCR':
      default:
        return renderOCR();
    }
  };

  const renderOCR = () => {
    if (appState === AppState.IDLE && !isConvertingPdf) {
      return (
        <div className="flex-1 flex flex-col h-full w-full relative animate-spring-up overflow-hidden px-2 md:px-0" key="ocr-idle">
          {pages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center">
                  <div className="w-full max-w-xl md:max-w-none md:h-auto flex items-center justify-center px-4 md:px-0">
                    <ImageUploader ref={uploaderRef} onImagesSelected={handleImagesAdded} onLoading={setIsConvertingPdf} />
                  </div>
                  <div className="mt-8">
                      <Button variant="text" onClick={() => setCurrentView('DASHBOARD')}>Вернуться назад</Button>
                  </div>
              </div>
          ) : (
              <>
                  <StagingArea 
                      pages={pages}
                      onReorder={handleReorder}
                      onRemove={handleRemovePage}
                      onUpdatePage={handleUpdatePage}
                      onProcess={handleStartProcessing}
                      onClear={resetApp}
                      onAddFile={() => uploaderRef.current?.openFile()}
                      onAddCamera={() => uploaderRef.current?.openCamera()}
                  />
                  <div className="hidden">
                      <ImageUploader ref={uploaderRef} onImagesSelected={handleImagesAdded} onLoading={setIsConvertingPdf} compact />
                  </div>
              </>
          )}
        </div>
      );
    }

    if (appState === AppState.PROCESSING || isConvertingPdf) {
       return (
          <ProcessingView 
             key="processing"
             previewUrl={pages.length > 0 ? pages[0].previewUrl : undefined} 
             text={isConvertingPdf ? "Конвертация PDF..." : "Анализ изображения..."} 
          />
       );
    }

    if (appState === AppState.SUCCESS) {
        return (
          <div key="success" className="h-full w-full">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full animate-spring-up pb-32 md:pb-6 relative px-0 md:px-0">
              <div className={`${mobileTab === 'image' ? 'block' : 'hidden'} lg:block h-full rounded-none md:rounded-[28px] overflow-hidden shadow-xl border-0 md:border border-white/20 dark:border-white/10 bg-black`}>
                 {pages.length > 0 ? (
                    <ImageViewer 
                        imageUrl={pages[activePageIndex].previewUrl} 
                        totalPages={pages.length}
                        pageIndex={activePageIndex}
                        onNextPage={() => setActivePageIndex(p => Math.min(p + 1, pages.length - 1))}
                        onPrevPage={() => setActivePageIndex(p => Math.max(p - 1, 0))}
                        scrollPercent={syncScrollPercent}
                        onZoomChange={setIsImageZoomed}
                    />
                 ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-500">
                        <FileText size={48} className="mb-4 opacity-50"/>
                        <p>Исходное изображение не сохранено в истории</p>
                    </div>
                 )}
              </div>
              <div className={`${mobileTab === 'text' ? 'block' : 'hidden'} lg:block h-full overflow-hidden`}>
                <ResultCard 
                  text={extractedText} 
                  onTextChange={setExtractedText} 
                  onReset={resetApp} 
                  pageCount={pages.length}
                  onPageSelect={(idx) => setActivePageIndex(idx)}
                  onScrollSync={setSyncScrollPercent}
                />
              </div>
            </div>
            <MobileNavBar activeTab={mobileTab} onTabChange={setMobileTab} onReset={resetApp} />
          </div>
        );
    }

    return (
        <div key="error" className="flex-1 flex flex-col items-center justify-center animate-spring-up px-6">
            <div className="bg-[#ffdad6] dark:bg-[#93000a] p-8 rounded-[32px] text-[#410002] dark:text-[#ffdad6] shadow-xl flex flex-col items-center text-center relative overflow-hidden max-w-md w-full">
              <div className="relative z-10 flex flex-col items-center w-full">
                  <AlertCircle size={56} className="mb-4 text-[#ba1a1a] dark:text-[#ffb4ab]" />
                  <h3 className="text-2xl font-bold mb-2">Ошибка</h3>
                  <p className="opacity-90 mb-8 font-medium">{errorMsg}</p>
                  <div className="flex gap-4 w-full">
                      <Button onClick={() => setAppState(AppState.IDLE)} variant="tonal" className="flex-1 !bg-white/50 dark:!bg-black/20 justify-center">Отмена</Button>
                      <Button onClick={handleStartProcessing} className="flex-1 !bg-[#ba1a1a] !text-white dark:!bg-[#ffb4ab] dark:!text-[#690005] justify-center">Повторить</Button>
                  </div>
              </div>
            </div>
        </div>
    );
  };

  return (
    <>
      {showIntro && <IntroAnimation onComplete={handleIntroComplete} />}
      {showOnboarding && <Onboarding onComplete={handleOnboardingComplete} />}
      {showWelcome && !showOnboarding && <WelcomeModal onClose={() => setShowWelcome(false)} />}
      
      <div 
          className={`
              relative overflow-hidden w-full h-[100dvh] flex
              transition-all duration-1000 ease-[cubic-bezier(0.32,0.72,0,1)]
              ${showIntro ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}
              bg-[#f2f2f7] dark:bg-black
          `}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
      >
        <div className="fixed inset-0 pointer-events-none z-0">
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-400/10 dark:bg-blue-600/10 rounded-full blur-[120px] animate-float will-change-transform" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-purple-400/10 dark:bg-purple-600/10 rounded-full blur-[120px] animate-float animation-delay-2000 will-change-transform" />
        </div>

        {/* --- DESKTOP SIDEBAR --- */}
        <div className="hidden lg:flex w-72 shrink-0 p-4 z-40">
             <SideMenu 
                isOpen={true}
                onClose={() => {}} 
                currentView={currentView}
                onNavigate={setCurrentView}
                theme={theme}
                onToggleTheme={toggleTheme}
                variant="sidebar"
             />
        </div>

        {/* --- MAIN CONTENT --- */}
        <div className="flex-1 flex flex-col relative h-full min-w-0">
            {/* Header is now managed per-view or hidden for immersion */}
            {currentView !== 'EDITOR' && (
                <header className="flex-none relative z-30 flex items-center justify-between px-4 md:px-6 pt-safe-top pb-2 md:py-6 max-w-6xl mx-auto w-full transition-all duration-500">
                  <div className="flex items-center gap-4">
                    {/* Mobile Menu Button - Hide on Desktop */}
                    <button 
                      onClick={() => setIsMenuOpen(true)}
                      className="lg:hidden p-3 rounded-full bg-white/80 dark:bg-[#1c1c1e]/80 md:bg-white/50 dark:md:bg-white/5 hover:scale-105 active:scale-95 transition-all shadow-sm backdrop-blur-md group"
                      title="Меню"
                    >
                      <Menu size={24} className="text-black dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors" />
                    </button>
                    
                    <div className="flex items-center gap-4 backdrop-blur-md bg-white/40 dark:bg-black/40 px-5 py-2.5 rounded-full border border-white/20 shadow-sm transition-all duration-300">
                       <div className={`p-2 rounded-xl shadow-sm ${currentView === 'AUDIO' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300' : 'bg-gradient-to-tr from-blue-100 to-purple-100 text-purple-600 dark:from-blue-900/30 dark:to-purple-900/30 dark:text-purple-300'}`}>
                          {currentView === 'AUDIO' ? <Mic size={20} /> : (currentView === 'DASHBOARD' ? <Home size={20} /> : (currentView === 'AI_CHAT' ? <Sparkles size={20} /> : <ScanText size={20} />))}
                       </div>
                       <div>
                          <h1 className="font-bold text-black dark:text-white text-lg leading-none tracking-tight">
                            Lex {currentView === 'AUDIO' ? 'Audio' : (currentView === 'DASHBOARD' ? 'Home' : (currentView === 'ABOUT' ? 'Info' : (currentView === 'TIPS' ? 'Советы' : (currentView === 'AI_CHAT' ? 'Chat' : 'OCR'))))}
                          </h1>
                       </div>
                    </div>
                  </div>
                  
                  <div className="hidden md:flex items-center gap-4">
                     <button 
                        onClick={toggleTheme}
                        className="p-3 rounded-full bg-white/40 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 transition-all text-black dark:text-white border border-transparent hover:border-white/20 active:scale-95"
                        title="Переключить тему"
                     >
                        {theme === 'light' ? <Sun size={24} /> : <Moon size={24} />}
                     </button>

                     <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center font-bold text-lg shadow-lg border-2 border-white/20">
                        L
                     </div>
                  </div>
                </header>
            )}

            <main 
                key={currentView}
                className={`flex-1 relative z-10 w-full ${currentView === 'EDITOR' ? 'h-full max-w-full' : 'max-w-6xl mx-auto flex flex-col min-h-0 pb-safe-bottom'} overflow-hidden`}
            >
               {renderContent()}
            </main>
        </div>

        {/* --- MOBILE DRAWER --- */}
        <div className="lg:hidden">
            <SideMenu 
              isOpen={isMenuOpen} 
              onClose={() => setIsMenuOpen(false)} 
              currentView={currentView}
              onNavigate={setCurrentView}
              theme={theme}
              onToggleTheme={toggleTheme}
              variant="drawer"
            />
        </div>
      </div>
    </>
  );
};

export default App;
