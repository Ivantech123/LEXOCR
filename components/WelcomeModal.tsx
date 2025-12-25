
import React, { useState } from 'react';
import { ShieldCheck, Zap, AlertTriangle, Key, ChevronRight, CheckCircle2, X } from 'lucide-react';
import { Button } from './Button';

interface WelcomeModalProps {
  onClose: () => void;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({ onClose }) => {
  const [step, setStep] = useState<'INFO' | 'KEY_INPUT'>('INFO');
  const [apiKey, setApiKey] = useState('');
  
  const handleSaveKey = () => {
      if(apiKey.trim()) {
          localStorage.setItem('lex_custom_api_key', apiKey.trim());
      }
      onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md animate-fade-in" />
      
      <div className="relative bg-[#fdf7ff] dark:bg-[#1c1c1e] w-full sm:max-w-md h-[90dvh] sm:h-auto sm:max-h-[85vh] sm:rounded-[40px] rounded-t-[32px] shadow-2xl overflow-hidden animate-spring-up flex flex-col">
        
        {/* Header Visual */}
        <div className="relative h-32 bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-600 shrink-0">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-40 mix-blend-overlay"></div>
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-20 h-20 bg-white dark:bg-[#2c2c2e] rounded-[24px] shadow-xl flex items-center justify-center transform rotate-3">
                 <Zap className="text-amber-500" size={36} fill="currentColor" />
            </div>
            
            {/* Close button for mobile accessibility */}
            <button 
                onClick={onClose} 
                className="absolute top-4 right-4 p-2 bg-black/20 text-white rounded-full hover:bg-black/40 sm:hidden"
            >
                <X size={20} />
            </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 pt-12">
            
            {step === 'INFO' ? (
                <div className="flex flex-col items-center text-center space-y-6 animate-slide-in-right">
                    <div>
                        <h2 className="text-2xl font-bold text-black dark:text-white mb-2">
                            Lex OCR 3.0
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed max-w-[260px] mx-auto">
                            Полностью бесплатный Open Source инструмент. Некоммерческий проект.<br/>
                            Автор: <strong>Андреев Иван</strong>.
                        </p>
                    </div>

                    {/* Stability Status Card */}
                    <div className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl p-4 text-left space-y-3">
                         <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
                             <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                             Статус системы
                         </div>
                         
                         <div className="flex items-start gap-3">
                             <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={18} />
                             <div>
                                 <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100">Демо-режим (Нестабильно)</h4>
                                 <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                                     Общий ключ может быть перегружен (ошибка 429). Скорость и доступность не гарантируются.
                                 </p>
                             </div>
                         </div>
                         
                         <div className="h-px bg-gray-200 dark:bg-white/10 w-full" />

                         <div className="flex items-start gap-3">
                             <ShieldCheck className="text-green-500 shrink-0 mt-0.5" size={18} />
                             <div>
                                 <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100">Ваш ключ (Стабильно)</h4>
                                 <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                                     Используйте свой Gemini API Key для максимальной скорости и приватности.
                                 </p>
                             </div>
                         </div>
                    </div>

                    <div className="w-full space-y-3 pt-2">
                        <Button 
                            onClick={() => setStep('KEY_INPUT')}
                            className="w-full justify-center bg-black dark:bg-white text-white dark:text-black py-4 rounded-xl shadow-lg shadow-purple-500/10"
                        >
                            <Key size={18} />
                            Ввести свой ключ
                        </Button>
                        <button 
                            onClick={onClose}
                            className="w-full py-3 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
                        >
                            Попробовать демо (Риск 429)
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col space-y-6 animate-slide-in-right">
                    <div className="text-center">
                        <h3 className="text-xl font-bold text-black dark:text-white">Настройка ключа</h3>
                        <p className="text-xs text-gray-500 mt-1">Ключ сохраняется только в вашем браузере.</p>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 ml-1">Google Gemini API Key</label>
                            <input 
                                type="text" 
                                placeholder="AIzaSy..."
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                className="w-full p-4 rounded-xl bg-gray-100 dark:bg-black/30 border-2 border-transparent focus:border-purple-500 outline-none text-sm font-mono text-black dark:text-white transition-all"
                            />
                        </div>
                        
                        <div className="bg-blue-50 dark:bg-blue-900/10 p-3 rounded-xl flex gap-3 items-start">
                             <div className="text-blue-500 shrink-0 mt-0.5">ℹ️</div>
                             <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                                 Получить ключ можно бесплатно в <a href="https://aistudio.google.com/app/apikey" target="_blank" className="underline font-bold">Google AI Studio</a>.
                             </p>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button 
                            variant="tonal"
                            onClick={() => setStep('INFO')}
                            className="flex-1 justify-center"
                        >
                            Назад
                        </Button>
                        <Button 
                            onClick={handleSaveKey}
                            disabled={apiKey.length < 10}
                            className="flex-1 justify-center bg-green-600 text-white hover:bg-green-700"
                        >
                            <CheckCircle2 size={18} />
                            Сохранить
                        </Button>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
