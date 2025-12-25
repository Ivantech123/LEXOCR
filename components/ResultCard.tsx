
import React, { useState, useEffect, useRef } from 'react';
import { Copy, Download, Volume2, Check } from 'lucide-react';
import { Button } from './Button';
import { TextSelection } from '../types';
import { haptic } from '../utils/haptics';

interface ResultCardProps {
  text: string;
  onTextChange: (text: string) => void;
  onReset: () => void;
  pageCount: number;
  onPageSelect?: (pageIndex: number) => void;
  onScrollSync?: (percent: number) => void;
}

export const ResultCard: React.FC<ResultCardProps> = ({ 
  text, 
  onTextChange, 
  onReset, 
  pageCount, 
  onPageSelect,
  onScrollSync
}) => {
  const [wordCount, setWordCount] = useState(0);
  const [documentTitle, setDocumentTitle] = useState("Lex-Document");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  
  // Selection
  const [selection, setSelection] = useState<TextSelection | null>(null);
  
  // TTS
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    setWordCount(text.trim().split(/\s+/).filter(Boolean).length);
  }, [text]);

  useEffect(() => {
      if (isEditingTitle && titleInputRef.current) titleInputRef.current.focus();
  }, [isEditingTitle]);

  useEffect(() => {
      return () => { if (isSpeaking) window.speechSynthesis.cancel(); };
  }, [isSpeaking]);

  // --- Utilities ---
  const toggleSpeech = () => {
      if (isSpeaking) {
          window.speechSynthesis.cancel();
          setIsSpeaking(false);
      } else {
          if (!text.trim()) return;
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = /[а-яА-Я]/.test(text) ? 'ru-RU' : 'en-US';
          utterance.onend = () => setIsSpeaking(false);
          utterance.onerror = () => setIsSpeaking(false);
          window.speechSynthesis.speak(utterance);
          setIsSpeaking(true);
      }
  };

  const handleExport = (type: 'pdf' | 'txt') => {
      setShowExportMenu(false);
      haptic.impactLight();
      if (type === 'txt') {
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${documentTitle.replace(/\s+/g, '_')}.txt`;
        link.click();
      } else if (type === 'pdf') {
         let safeText = text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
         const html = `<html><head><title>${documentTitle}</title></head><body style="padding:2em; font-family:sans-serif;">${safeText.replace(/\n/g, '<br>')}</body></html>`;
         const blob = new Blob([html], { type: 'text/html' });
         window.open(URL.createObjectURL(blob));
      }
  };

  const handleCursorActivity = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    const cursorPosition = textarea.selectionStart;
    const selectionEnd = textarea.selectionEnd;
    
    if (selectionEnd > cursorPosition) {
        setSelection({
            start: cursorPosition,
            end: selectionEnd,
            text: textarea.value.substring(cursorPosition, selectionEnd)
        });
    } else {
        setSelection(null);
    }
    if (onScrollSync) onScrollSync(cursorPosition / text.length);
  };

  return (
    <div className="ios-glass md:rounded-[40px] h-full flex flex-col shadow-2xl overflow-hidden animate-spring-up bg-white/40 dark:bg-black/40 relative group/card">
      
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 z-20 px-4 py-3 flex items-center justify-between bg-gradient-to-b from-white/90 via-white/50 to-transparent dark:from-black/90 dark:via-black/50 pt-safe-top backdrop-blur-sm">
            <div className="flex items-center gap-2 overflow-hidden">
                <div className="title-container flex items-center shrink-0 bg-white/50 dark:bg-black/20 backdrop-blur-md rounded-full px-1">
                    {isEditingTitle ? (
                        <input 
                            ref={titleInputRef}
                            type="text" 
                            value={documentTitle} 
                            onChange={(e) => setDocumentTitle(e.target.value)}
                            onBlur={() => setIsEditingTitle(false)}
                            onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
                            className="bg-transparent border-none px-3 py-1.5 text-sm font-bold outline-none w-32"
                        />
                    ) : (
                        <button 
                            onClick={() => setIsEditingTitle(true)}
                            className="px-3 py-1.5 font-bold text-sm truncate max-w-[150px]"
                        >
                            {documentTitle}
                        </button>
                    )}
                </div>
                <span className="text-xs font-medium text-gray-400 bg-gray-100 dark:bg-white/10 px-2 py-1 rounded-md">
                    {wordCount} сл.
                </span>
            </div>

            <div className="flex items-center gap-2">
                    <Button variant="icon-only" onClick={toggleSpeech} className={`w-10 h-10 ${isSpeaking ? 'bg-amber-100 text-amber-600' : ''}`}><Volume2 size={18}/></Button>
                    <div className="relative">
                        <Button variant="icon-only" onClick={() => setShowExportMenu(!showExportMenu)} className="w-10 h-10"><Download size={18}/></Button>
                        {showExportMenu && (
                            <div className="absolute top-12 right-0 z-[100] w-32 ios-glass rounded-2xl shadow-xl p-1 flex flex-col gap-1 animate-pop-in border border-white/20 bg-white/90 dark:bg-[#1c1c1e]/90">
                                <button onClick={() => handleExport('txt')} className="text-left px-3 py-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-xl text-xs font-bold">TEXT</button>
                                <button onClick={() => handleExport('pdf')} className="text-left px-3 py-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-xl text-xs font-bold">PDF</button>
                            </div>
                        )}
                    </div>
            </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 relative mt-16 px-0 pb-0 overflow-hidden">
        <textarea
            ref={textareaRef}
            className="w-full h-full bg-transparent p-6 md:p-10 text-gray-900 dark:text-gray-100 font-mono text-base leading-loose outline-none border-none resize-none placeholder-gray-300 dark:placeholder-gray-700 pb-[40vh] selection:bg-purple-200 dark:selection:bg-purple-900/60"
            value={text}
            onChange={(e) => onTextChange(e.target.value)}
            onSelect={handleCursorActivity}
            onClick={handleCursorActivity}
            onKeyUp={handleCursorActivity}
            spellCheck={false}
            placeholder="Здесь появится ваш текст..."
        />
      </div>
    </div>
  );
};
