
import React, { useState, useEffect, useRef } from 'react';
import { X, User, History, Shield, ScanText, Mic, Settings, ChevronRight, Moon, Sun, Info, ArrowLeft, Key, Save, Trash2, LogOut, Home, Lightbulb, Sparkles, Cloud, FileEdit } from 'lucide-react';
import { AppView, Theme } from '../types';
import { supabase } from '../lib/supabase';
import { AuthModal } from './AuthModal';

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  theme: Theme;
  onToggleTheme: () => void;
  variant?: 'drawer' | 'sidebar'; // New prop
}

interface NavItemProps {
  id: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

export const SideMenu: React.FC<SideMenuProps> = ({ isOpen, onClose, currentView, onNavigate, theme, onToggleTheme, variant = 'drawer' }) => {
  const [viewMode, setViewMode] = useState<'MENU' | 'SETTINGS' | 'CLOUD_SETTINGS'>('MENU');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  
  // Settings State
  const [apiKey, setApiKey] = useState('');
  const [gClientId, setGClientId] = useState('');
  const [gApiKey, setGApiKey] = useState('');
  const [gAppId, setGAppId] = useState('');
  
  const [activeGestureId, setActiveGestureId] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load Keys
    setApiKey(localStorage.getItem('lex_custom_api_key') || '');
    setGClientId(localStorage.getItem('lex_google_client_id') || '');
    setGApiKey(localStorage.getItem('lex_google_api_key') || '');
    setGAppId(localStorage.getItem('lex_google_app_id') || '');

    // Check Auth
    if (supabase) {
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) setUserEmail(user.email || 'User');
        });
    }

    if (!isOpen && variant === 'drawer') {
        setTimeout(() => setViewMode('MENU'), 300);
    }
  }, [isOpen, variant]);

  const handleNav = (view: any) => {
    onNavigate(view);
    if (variant === 'drawer') onClose();
  };

  const saveSettings = () => {
      localStorage.setItem('lex_custom_api_key', apiKey);
      localStorage.setItem('lex_google_client_id', gClientId);
      localStorage.setItem('lex_google_api_key', gApiKey);
      localStorage.setItem('lex_google_app_id', gAppId);
      alert("Настройки сохранены. Перезагрузите страницу для применения Google Drive.");
  };

  const handleLogout = async () => {
      if (supabase) await supabase.auth.signOut();
      setUserEmail(null);
      window.location.reload();
  };

  // --- Gesture Logic ---
  const handleTouchStart = (e: React.TouchEvent) => {
      detectItem(e.touches[0].clientX, e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
      detectItem(e.touches[0].clientX, e.touches[0].clientY);
  };

  const handleTouchEnd = () => {
      if (activeGestureId) {
          if (activeGestureId === 'SETTINGS') setViewMode('SETTINGS');
          else if (activeGestureId === 'AUTH') { if (!userEmail) setShowAuthModal(true); }
          else handleNav(activeGestureId as AppView);
      }
      setActiveGestureId(null);
  };

  const detectItem = (x: number, y: number) => {
      const target = document.elementFromPoint(x, y);
      const btn = target?.closest('button[data-nav-id]');
      if (btn) {
          const id = btn.getAttribute('data-nav-id');
          if (id && id !== activeGestureId) setActiveGestureId(id);
      }
  };

  // --- Styles based on Variant ---
  const isDrawer = variant === 'drawer';
  
  const containerClasses = isDrawer
    ? `fixed top-4 bottom-4 left-4 z-[210] w-[85vw] max-w-[320px] ios-glass rounded-[32px] shadow-2xl transition-transform duration-[350ms] ease-[cubic-bezier(0.19,1,0.22,1)] will-change-transform flex flex-col overflow-hidden gpu ${isOpen ? 'translate-x-0' : '-translate-x-[120%]'}`
    : `w-full h-full bg-white/50 dark:bg-[#1c1c1e]/50 backdrop-blur-xl border border-white/20 dark:border-white/5 rounded-[32px] flex flex-col overflow-hidden shadow-sm`;

  return (
    <>
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} onLoginSuccess={() => onClose()} />}

      {/* Backdrop (Only for Drawer) */}
      {isDrawer && (
        <div 
            className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-[200] transition-opacity duration-300 ease-out will-change-transform ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            onClick={onClose}
        />
      )}

      {/* Main Container */}
      <div className={containerClasses}>
        
        {/* Close Button (Only for Drawer) */}
        {isDrawer && (
            <div className="absolute top-5 right-5 z-20">
                <button 
                    onClick={onClose}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-white/30 dark:bg-white/10 hover:bg-white/50 dark:hover:bg-white/20 transition-all text-black dark:text-white backdrop-blur-md active:scale-95"
                >
                    <X size={20} />
                </button>
            </div>
        )}

        {viewMode === 'MENU' ? (
            <>
                <div className={`p-8 pb-4 ${isDrawer ? 'mt-4' : 'mt-2'} pointer-events-none`}>
                     <h2 className="text-3xl font-extrabold text-black dark:text-white tracking-tight mb-1">Lex Legal</h2>
                     <p className="text-sm text-gray-500 dark:text-gray-400 font-medium ml-1">AI Office Suite</p>
                </div>

                <div className="px-4 mb-4">
                    {userEmail ? (
                        <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-2xl flex items-center justify-between">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                                    {userEmail[0].toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-gray-500">Аккаунт</p>
                                    <p className="text-sm font-semibold truncate text-black dark:text-white">{userEmail}</p>
                                </div>
                            </div>
                            <button onClick={handleLogout} className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full text-red-500">
                                <LogOut size={16} />
                            </button>
                        </div>
                    ) : (
                        <button 
                            onClick={() => setShowAuthModal(true)}
                            className="w-full py-3 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-bold text-sm shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2"
                        >
                            <User size={16} />
                            Войти
                        </button>
                    )}
                </div>

                <div 
                    ref={listRef}
                    className="px-3 flex-1 flex flex-col gap-2 overflow-y-auto pb-6 scrollbar-hide touch-none"
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >

                <NavItem id="DASHBOARD" icon={<Home size={22} className="text-indigo-500" />} label="Главная" isActive={currentView === 'DASHBOARD'} onClick={() => handleNav('DASHBOARD')} />
                <NavItem id="EDITOR" icon={<FileEdit size={22} className="text-green-500" />} label="Редактор" isActive={currentView === 'EDITOR'} onClick={() => handleNav('EDITOR')} />
                <NavItem id="OCR" icon={<ScanText size={22} className="text-purple-500" />} label="Сканирование" isActive={currentView === 'OCR'} onClick={() => handleNav('OCR')} />
                <NavItem id="AUDIO" icon={<Mic size={22} className="text-pink-500" />} label="Диктофон" isActive={currentView === 'AUDIO'} onClick={() => handleNav('AUDIO')} />
                <NavItem id="AI_CHAT" icon={<Sparkles size={22} className="text-amber-500" />} label="AI Чат" isActive={currentView === 'AI_CHAT'} onClick={() => handleNav('AI_CHAT')} />
                
                <div className="my-2 h-px bg-gray-200 dark:bg-white/10 mx-4" />
                
                <NavItem id="HISTORY" icon={<History size={22} className="text-blue-500" />} label="История" isActive={currentView === 'HISTORY'} onClick={() => handleNav('HISTORY')} />
                <NavItem id="TIPS" icon={<Lightbulb size={22} className="text-yellow-500" />} label="Советы" isActive={currentView === 'TIPS'} onClick={() => handleNav('TIPS')} />
                <NavItem id="SETTINGS" icon={<Settings size={22} className="text-gray-500" />} label="Настройки API" isActive={false} onClick={() => setViewMode('SETTINGS')} />
                <NavItem id="ABOUT" icon={<Info size={22} className="text-gray-500" />} label="О проекте" isActive={currentView === 'ABOUT'} onClick={() => handleNav('ABOUT')} />
                </div>

                <div className="p-6 bg-white/20 dark:bg-black/20 backdrop-blur-lg border-t border-white/20 dark:border-white/5 flex items-center justify-between">
                    <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
                        Open Source • Free
                        <span className="block opacity-50 text-[9px] mt-0.5 normal-case">by Ivan Andreev</span>
                    </div>
                    <button onClick={onToggleTheme} className="w-12 h-12 flex items-center justify-center rounded-full bg-white/40 dark:bg-white/10 transition-all text-black dark:text-white border border-white/20 active:scale-95">
                        {theme === 'light' ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                </div>
            </>
        ) : (
            <div className="flex flex-col h-full bg-transparent animate-slide-in-right">
                <div className="p-6 border-b border-white/20 dark:border-white/10 flex items-center gap-4">
                     <button onClick={() => setViewMode('MENU')} className="p-2 rounded-full hover:bg-white/20 dark:hover:bg-white/10 transition-colors active:scale-95">
                         <ArrowLeft size={20} className="text-black dark:text-white"/>
                     </button>
                     <h2 className="text-xl font-bold text-black dark:text-white">Настройки</h2>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Gemini Config */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-purple-500 uppercase tracking-wider">Google Gemini</h3>
                        <div>
                            <label className="text-xs font-bold text-gray-500 mb-1 block">API Key</label>
                            <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} className="w-full p-3 rounded-xl bg-white/50 dark:bg-black/20 border border-white/30 dark:border-white/10 text-sm font-mono" placeholder="AIzaSy..." />
                        </div>
                    </div>

                    {/* Google Drive Config */}
                    <div className="space-y-4 pt-4 border-t border-dashed border-gray-300 dark:border-white/10">
                        <h3 className="text-sm font-bold text-blue-500 uppercase tracking-wider flex items-center gap-2"><Cloud size={14}/> Google Drive</h3>
                        <p className="text-[10px] text-gray-500">Требуется для работы кнопки "Google Drive"</p>
                        <div>
                            <label className="text-xs font-bold text-gray-500 mb-1 block">Client ID (OAuth)</label>
                            <input value={gClientId} onChange={(e) => setGClientId(e.target.value)} className="w-full p-3 rounded-xl bg-white/50 dark:bg-black/20 border border-white/30 dark:border-white/10 text-sm font-mono" placeholder="xxx.apps.googleusercontent.com" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 mb-1 block">API Key (Drive API)</label>
                            <input value={gApiKey} onChange={(e) => setGApiKey(e.target.value)} className="w-full p-3 rounded-xl bg-white/50 dark:bg-black/20 border border-white/30 dark:border-white/10 text-sm font-mono" placeholder="AIzaSy..." />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 mb-1 block">App ID (Project Number)</label>
                            <input value={gAppId} onChange={(e) => setGAppId(e.target.value)} className="w-full p-3 rounded-xl bg-white/50 dark:bg-black/20 border border-white/30 dark:border-white/10 text-sm font-mono" placeholder="123456789" />
                        </div>
                    </div>

                    <button onClick={saveSettings} className="w-full py-4 rounded-2xl bg-black dark:bg-white text-white dark:text-black font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-lg">
                        <Save size={18} /> Сохранить
                    </button>
                </div>
            </div>
        )}
      </div>
    </>
  );
};

const NavItem: React.FC<NavItemProps> = ({ id, icon, label, isActive, onClick }) => (
  <button 
    data-nav-id={id}
    onClick={onClick}
    className={`w-full relative flex items-center gap-4 px-5 py-4 rounded-[24px] transition-all duration-150 text-left group overflow-hidden ${isActive ? 'bg-white/60 dark:bg-white/10 shadow-sm' : 'hover:bg-white/40 dark:hover:bg-white/5'}`}
  >
    <div className={`relative z-10 transition-transform ${isActive ? 'scale-110' : ''}`}>{icon}</div>
    <span className={`relative z-10 flex-1 font-bold text-[15px] tracking-tight ${isActive ? 'text-black dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}>{label}</span>
    {isActive && <ChevronRight size={18} className="relative z-10 text-black dark:text-white opacity-50" />}
  </button>
);
