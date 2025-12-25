
import React, { useState } from 'react';
import { Mail, Lock, LogIn, UserPlus, X, Cloud, Loader2, ArrowRight, CheckCircle2 } from 'lucide-react';
import { supabase, updateSupabaseConfig } from '../lib/supabase';
import { historyService } from '../services/historyService';

interface AuthModalProps {
  onClose: () => void;
  onLoginSuccess: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose, onLoginSuccess }) => {
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER' | 'CONFIG'>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  // Config state
  const [configUrl, setConfigUrl] = useState(localStorage.getItem('lex_supabase_url') || '');
  const [configKey, setConfigKey] = useState(localStorage.getItem('lex_supabase_key') || '');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase && mode !== 'CONFIG') {
        setError("Пожалуйста, настройте подключение к базе данных (нажмите шестеренку или 'Настройка').");
        setMode('CONFIG');
        return;
    }
    
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
        const { data, error } = mode === 'LOGIN' 
            ? await supabase!.auth.signInWithPassword({ email, password })
            : await supabase!.auth.signUp({ email, password });

        if (error) throw error;

        if (mode === 'REGISTER' && !data.session) {
            setSuccessMsg("Проверьте почту для подтверждения регистрации!");
            setLoading(false);
            return;
        }

        // Trigger Sync
        await historyService.syncWithCloud();
        
        onLoginSuccess();
        onClose();
    } catch (err: any) {
        setError(err.message);
    } finally {
        setLoading(false);
    }
  };

  const handleSaveConfig = () => {
      updateSupabaseConfig(configUrl, configKey);
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[#000000]/40 backdrop-blur-xl animate-fade-in" onClick={onClose} />
      
      {/* Card */}
      <div className="relative bg-white dark:bg-[#0f0f11] w-full max-w-[400px] rounded-[32px] shadow-2xl overflow-hidden animate-spring-up flex flex-col min-h-[500px] border border-white/20 dark:border-white/5">
        
        {/* Artistic Background Header */}
        <div className="relative h-32 w-full overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 opacity-90"></div>
             <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/20 rounded-full blur-[40px]"></div>
             <div className="absolute top-10 left-10 w-20 h-20 bg-blue-300/30 rounded-full blur-[30px]"></div>
             
             <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors bg-black/10 hover:bg-black/30 p-2 rounded-full backdrop-blur-md">
                <X size={18} />
            </button>
            
            <div className="absolute bottom-6 left-8 text-white">
                <h2 className="text-2xl font-bold tracking-tight">
                    {mode === 'CONFIG' ? 'Database' : (mode === 'LOGIN' ? 'Welcome Back' : 'Join Lex')}
                </h2>
                <p className="text-white/70 text-sm font-medium">
                    {mode === 'CONFIG' ? 'Connection Settings' : 'Sync your history across devices'}
                </p>
            </div>
        </div>

        <div className="flex-1 p-8 flex flex-col">
            {mode === 'CONFIG' ? (
                <div className="space-y-5 animate-slide-in-right">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                        <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                            Введите URL и Anon Key из вашего проекта Supabase для включения облачной синхронизации.
                        </p>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-gray-400 tracking-wider ml-2">Project URL</label>
                            <input 
                                className="w-full p-4 bg-gray-50 dark:bg-[#18181b] rounded-2xl outline-none border border-gray-200 dark:border-white/5 focus:border-purple-500 focus:bg-white dark:focus:bg-black transition-all text-sm font-mono" 
                                value={configUrl} 
                                onChange={e => setConfigUrl(e.target.value)} 
                                placeholder="https://xyz.supabase.co" 
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-gray-400 tracking-wider ml-2">Anon Key</label>
                            <input 
                                className="w-full p-4 bg-gray-50 dark:bg-[#18181b] rounded-2xl outline-none border border-gray-200 dark:border-white/5 focus:border-purple-500 focus:bg-white dark:focus:bg-black transition-all text-sm font-mono" 
                                type="password" 
                                value={configKey} 
                                onChange={e => setConfigKey(e.target.value)} 
                                placeholder="eyJhbG..." 
                            />
                        </div>
                    </div>

                    <div className="pt-4">
                        <button onClick={handleSaveConfig} className="w-full py-4 bg-black dark:bg-white text-white dark:text-black font-bold rounded-2xl shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2">
                             <CheckCircle2 size={18} /> Сохранить
                        </button>
                        <button onClick={() => setMode('LOGIN')} className="w-full py-4 text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors">
                            Отмена
                        </button>
                    </div>
                </div>
            ) : (
                <form onSubmit={handleAuth} className="flex-1 flex flex-col space-y-5 animate-slide-in-right">
                    
                    {successMsg ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 py-8">
                             <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center text-green-500">
                                 <CheckCircle2 size={32} />
                             </div>
                             <h3 className="text-xl font-bold text-gray-900 dark:text-white">Готово!</h3>
                             <p className="text-sm text-gray-500 max-w-xs">{successMsg}</p>
                             <button type="button" onClick={() => setMode('LOGIN')} className="text-purple-600 font-bold text-sm">Вернуться ко входу</button>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-4">
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Mail className="text-gray-400 group-focus-within:text-purple-500 transition-colors" size={20} />
                                    </div>
                                    <input 
                                        type="email" 
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Email address"
                                        className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-[#18181b] rounded-2xl outline-none border-2 border-transparent focus:border-purple-500/50 focus:bg-white dark:focus:bg-black transition-all text-gray-900 dark:text-gray-100 placeholder-gray-400"
                                        required
                                    />
                                </div>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Lock className="text-gray-400 group-focus-within:text-purple-500 transition-colors" size={20} />
                                    </div>
                                    <input 
                                        type="password" 
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Password"
                                        className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-[#18181b] rounded-2xl outline-none border-2 border-transparent focus:border-purple-500/50 focus:bg-white dark:focus:bg-black transition-all text-gray-900 dark:text-gray-100 placeholder-gray-400"
                                        required
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="text-red-500 text-xs text-center font-medium bg-red-50 dark:bg-red-900/10 p-3 rounded-xl border border-red-100 dark:border-red-900/20">
                                    {error}
                                </div>
                            )}

                            <div className="pt-4 mt-auto">
                                <button 
                                    type="submit" 
                                    disabled={loading}
                                    className="w-full py-4 bg-black dark:bg-white text-white dark:text-black font-bold rounded-[22px] shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed group relative overflow-hidden"
                                >
                                    {loading ? (
                                        <Loader2 className="animate-spin" />
                                    ) : (
                                        <>
                                            <span>{mode === 'LOGIN' ? "Войти" : "Создать аккаунт"}</span>
                                            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </button>
                            </div>

                            <div className="text-center pt-2">
                                <button 
                                    type="button"
                                    onClick={() => setMode(mode === 'LOGIN' ? 'REGISTER' : 'LOGIN')}
                                    className="text-sm text-gray-500 hover:text-purple-600 dark:hover:text-purple-400 transition-colors font-medium"
                                >
                                    {mode === 'LOGIN' ? "Нет аккаунта? Зарегистрироваться" : "Уже есть аккаунт? Войти"}
                                </button>
                            </div>
                        </>
                    )}
                </form>
            )}
            
            {mode !== 'CONFIG' && !successMsg && (
                <div className="mt-6 pt-4 border-t border-gray-100 dark:border-white/5 text-center">
                    <button onClick={() => setMode('CONFIG')} className="text-[10px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 uppercase tracking-widest font-bold flex items-center justify-center gap-1 mx-auto">
                        <Cloud size={10} />
                        Подключение к базе
                    </button>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
