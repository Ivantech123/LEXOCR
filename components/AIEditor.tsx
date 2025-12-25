
import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, Wand2, Copy, Check, ChevronRight, Loader2, Send, 
  PanelRightClose, PanelRightOpen, ArrowLeft, Type, MoveLeft, 
  Eraser, FileText, RefreshCw, MessageSquare, Bot, User, X
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { Button } from './Button';
import { ChatMessage, TextSelection } from '../types';

// AI Service initialized locally
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const MODEL_ID = "gemini-2.5-flash";

interface AIEditorProps {
    contextText?: string;
    initialSelection?: string; // New prop for passing selected text from ResultCard
}

export const AIEditor: React.FC<AIEditorProps> = ({ contextText, initialSelection }) => {
  const [content, setContent] = useState<string>("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [copied, setCopied] = useState(false);
  
  // Selection State
  const [currentSelection, setCurrentSelection] = useState<TextSelection | null>(null);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Initialize
  useEffect(() => {
      if (contextText && !content) {
          setContent(contextText);
          
          const initialMsg: ChatMessage = {
              id: 'intro-rag',
              role: 'ai',
              content: 'Документ загружен. Я готов отвечать на вопросы по тексту или редактировать его.',
              timestamp: Date.now()
          };
          
          setChatHistory([initialMsg]);

          // If user came here with a specific selection from ResultCard
          if (initialSelection) {
             setIsSidebarOpen(true);
             setTimeout(() => {
                 setChatInput(`Что можно сделать с текстом: "${initialSelection.substring(0, 50)}..."?`);
             }, 500);
          }

      } else if (chatHistory.length === 0) {
          setChatHistory([{
              id: 'intro',
              role: 'ai',
              content: 'Привет! Выделите любой фрагмент текста, чтобы я помог его улучшить, перевести или исправить.',
              timestamp: Date.now()
          }]);
      }
  }, [contextText, initialSelection]);

  // Auto-scroll chat
  useEffect(() => {
    if (chatScrollRef.current) {
        chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatHistory, isProcessing]);

  const handleSelectionChange = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    if (textarea.selectionStart !== textarea.selectionEnd) {
        setCurrentSelection({
            start: textarea.selectionStart,
            end: textarea.selectionEnd,
            text: textarea.value.substring(textarea.selectionStart, textarea.selectionEnd)
        });
    } else {
        setCurrentSelection(null);
    }
  };

  const handleSendMessage = async (text: string = chatInput) => {
    if (!text.trim() || isProcessing) return;

    const selectionSnapshot = currentSelection;
    const userMsg: ChatMessage = { 
        id: Date.now().toString(), 
        role: 'user', 
        content: text, 
        timestamp: Date.now(),
        targetSelection: selectionSnapshot || undefined
    };
    
    setChatHistory(prev => [...prev, userMsg]);
    setChatInput("");
    setIsProcessing(true);
    if (window.innerWidth < 768) setIsSidebarOpen(true);

    const aiMsgId = (Date.now() + 1).toString();
    setChatHistory(prev => [...prev, { id: aiMsgId, role: 'ai', content: "", timestamp: Date.now(), isThinking: true }]);

    try {
        let prompt = "";
        
        if (selectionSnapshot) {
            prompt = `
                ROLE: Expert Editor & Copywriter.
                TASK: Process the SELECTED TEXT based on user instruction.
                
                USER INSTRUCTION: "${text}"
                
                SELECTED TEXT:
                """
                ${selectionSnapshot.text}
                """
                
                FULL CONTEXT (Read-only reference):
                """
                ${content.slice(0, 3000)}
                """
                
                OUTPUT: Return ONLY the processed/rewritten text. No quotes. No "Here is the text".
            `;
        } else {
            prompt = `
                ROLE: Document Assistant.
                DOCUMENT CONTEXT:
                """
                ${content.slice(0, 10000)}
                """
                
                USER QUESTION: "${text}"
                
                OUTPUT: Answer cleanly and concisely in Russian.
            `;
        }

        const response = await ai.models.generateContent({
            model: MODEL_ID,
            contents: prompt,
        });

        const aiResponse = response.text || "Не удалось получить ответ.";

        setChatHistory(prev => prev.map(msg => 
            msg.id === aiMsgId ? { ...msg, content: aiResponse, isThinking: false, targetSelection: selectionSnapshot || undefined } : msg
        ));

    } catch (error) {
        setChatHistory(prev => prev.map(msg => 
            msg.id === aiMsgId ? { ...msg, content: "Ошибка AI сервера.", isThinking: false } : msg
        ));
    } finally {
        setIsProcessing(false);
    }
  };

  const handleFunctionClick = (type: string) => {
      const actions: Record<string, string> = {
          'fix': "Исправь ошибки и пунктуацию.",
          'shorten': "Сократи этот текст, сохранив смысл.",
          'expand': "Раскрой мысль подробнее.",
          'formal': "Перепиши в официально-деловом стиле.",
          'summary': "Сделай краткое саммари всего документа."
      };
      if (actions[type]) handleSendMessage(actions[type]);
  };

  const applyChange = (newText: string, targetSelection: TextSelection) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const before = content.substring(0, targetSelection.start);
      const after = content.substring(targetSelection.end);
      
      const updatedContent = before + newText + after;
      setContent(updatedContent);

      setTimeout(() => {
          if (textareaRef.current) {
              textareaRef.current.focus();
              textareaRef.current.selectionStart = targetSelection.start;
              textareaRef.current.selectionEnd = targetSelection.start + newText.length;
          }
      }, 0);
  };

  const copyToClipboard = () => {
      navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full flex flex-row animate-spring-up overflow-hidden pb-safe-bottom relative bg-[#f2f2f7] dark:bg-black rounded-none md:rounded-[40px] shadow-2xl border border-white/20 dark:border-white/5">
        
        {/* === LEFT: DOCUMENT CANVAS === */}
        <div className={`
            flex-1 flex flex-col h-full bg-white/50 dark:bg-[#1c1c1e]/50 backdrop-blur-xl relative transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]
            ${isSidebarOpen ? 'mr-0 md:mr-[400px]' : 'mr-0'}
        `}>
            
            {/* Toolbar */}
            <div className="flex items-center justify-between p-4 px-6 border-b border-white/20 dark:border-white/5">
                 <div className="flex items-center gap-2">
                     <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-600 dark:text-indigo-400">
                         <FileText size={18} />
                     </div>
                     <span className="font-bold text-sm tracking-wide text-gray-700 dark:text-gray-200">Редактор</span>
                 </div>

                 <div className="flex items-center gap-2">
                     <button onClick={copyToClipboard} className="p-2 hover:bg-white/40 dark:hover:bg-white/10 rounded-full transition-colors text-gray-600 dark:text-gray-300" title="Копировать">
                         {copied ? <Check size={18} className="text-green-500"/> : <Copy size={18} />}
                     </button>
                     <button onClick={() => setContent('')} className="p-2 hover:bg-white/40 dark:hover:bg-white/10 rounded-full transition-colors text-gray-600 dark:text-gray-300" title="Очистить">
                         <Eraser size={18} />
                     </button>
                     <button 
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
                        className={`p-2 rounded-full transition-all ${isSidebarOpen ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-300' : 'hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500'}`}
                     >
                        <Sparkles size={18} />
                     </button>
                 </div>
            </div>

            {/* Editor Area */}
            <div className="flex-1 relative group overflow-hidden">
                <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    onSelect={handleSelectionChange}
                    onClick={handleSelectionChange}
                    onKeyUp={handleSelectionChange}
                    placeholder="Ваш текст здесь..."
                    className="w-full h-full p-8 md:p-12 resize-none outline-none bg-transparent text-lg leading-loose text-gray-900 dark:text-gray-100 placeholder-gray-400 font-serif selection:bg-purple-200 dark:selection:bg-purple-900/50"
                    spellCheck={false}
                />
            </div>
            
            {/* Floating Context Action (Desktop) */}
            {currentSelection && !isSidebarOpen && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-spring-up">
                    <button 
                        onClick={() => setIsSidebarOpen(true)}
                        className="flex items-center gap-3 px-6 py-3 bg-black/80 dark:bg-white/90 text-white dark:text-black rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all backdrop-blur-md"
                    >
                        <Sparkles size={16} className="animate-pulse" />
                        <span className="font-bold text-sm">Ask AI</span>
                        <div className="w-px h-4 bg-white/20 dark:bg-black/20" />
                        <span className="text-xs opacity-80">Выделено {currentSelection.text.length} симв.</span>
                    </button>
                </div>
            )}
        </div>

        {/* === RIGHT: AI SIDEBAR (Glass Overlay) === */}
        <div className={`
            fixed inset-y-0 right-0 z-50 w-full md:w-[400px] 
            bg-white/80 dark:bg-[#141416]/90 backdrop-blur-2xl border-l border-white/20 dark:border-white/5 shadow-[-20px_0_40px_rgba(0,0,0,0.1)]
            transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] flex flex-col
            ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}
            md:absolute
        `}>
            {/* Header */}
            <div className="p-5 border-b border-gray-200/50 dark:border-white/5 flex items-center justify-between bg-white/50 dark:bg-white/5 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                        <Bot size={18} className="text-white" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-white text-sm">AI Assistant</h3>
                        <p className="text-[10px] text-green-500 font-medium flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"/> Online
                        </p>
                    </div>
                </div>
                <button 
                    onClick={() => setIsSidebarOpen(false)}
                    className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors"
                >
                    <X size={20} className="text-gray-500" />
                </button>
            </div>

            {/* Quick Chips (Context Sensitive) */}
            <div className="p-4 overflow-x-auto scrollbar-hide flex gap-2 border-b border-gray-200/50 dark:border-white/5 bg-gray-50/50 dark:bg-black/20">
                 {currentSelection ? (
                     <>
                        <QuickAction icon={<Wand2 size={12}/>} label="Исправить" onClick={() => handleFunctionClick('fix')} />
                        <QuickAction icon={<RefreshCw size={12}/>} label="Переписать" onClick={() => handleFunctionClick('rewrite')} />
                        <QuickAction icon={<MoveLeft size={12}/>} label="Сократить" onClick={() => handleFunctionClick('shorten')} />
                        <QuickAction icon={<Type size={12}/>} label="Стиль" onClick={() => handleFunctionClick('formal')} />
                     </>
                 ) : (
                     <>
                        <QuickAction icon={<FileText size={12}/>} label="Саммари" onClick={() => handleFunctionClick('summary')} />
                        <QuickAction icon={<MessageSquare size={12}/>} label="Анализ" onClick={() => handleSendMessage('Проанализируй этот текст')} />
                     </>
                 )}
            </div>

            {/* Chat Area */}
            <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide bg-gradient-to-b from-transparent to-white/30 dark:to-black/30">
                 {chatHistory.map((msg) => (
                     <div key={msg.id} className={`flex flex-col animate-scale-in-bounce ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                         
                         {/* Message Bubble */}
                         <div className={`
                            relative max-w-[85%] p-4 rounded-[20px] text-sm leading-relaxed shadow-sm backdrop-blur-sm
                            ${msg.role === 'user' 
                                ? 'bg-white dark:bg-[#2c2c2e] text-gray-900 dark:text-gray-100 rounded-tr-sm border border-gray-100 dark:border-white/5' 
                                : 'bg-gradient-to-br from-indigo-600 to-purple-700 text-white rounded-tl-sm shadow-purple-500/20 border border-white/10'}
                         `}>
                             {msg.isThinking ? (
                                 <div className="flex gap-1.5 items-center h-5 px-1">
                                     <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}/>
                                     <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}/>
                                     <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}/>
                                 </div>
                             ) : (
                                 <>
                                    <div className="whitespace-pre-wrap">{msg.content}</div>
                                    {msg.targetSelection && (
                                         <div className="mt-3 pt-2 border-t border-white/20 text-[10px] opacity-70 flex items-center gap-2">
                                             <Type size={10} />
                                             <span className="truncate max-w-[150px]">"{msg.targetSelection.text.slice(0, 30)}..."</span>
                                         </div>
                                     )}
                                 </>
                             )}
                         </div>

                         {/* Actions for AI Message */}
                         {msg.role === 'ai' && !msg.isThinking && !msg.id.startsWith('intro') && (
                             <div className="mt-2 flex gap-2 animate-fade-in px-1">
                                 {msg.targetSelection && (
                                     <button 
                                        onClick={() => msg.targetSelection && applyChange(msg.content, msg.targetSelection)}
                                        className="flex items-center gap-1.5 text-xs font-bold text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 px-3 py-1.5 rounded-full transition-colors"
                                     >
                                         <Check size={12} strokeWidth={3} /> Применить
                                     </button>
                                 )}
                                 <button 
                                     onClick={() => {
                                         navigator.clipboard.writeText(msg.content);
                                         // Show toast logic here if needed
                                     }}
                                     className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                 >
                                     <Copy size={12} />
                                 </button>
                             </div>
                         )}
                     </div>
                 ))}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white/80 dark:bg-[#1c1c1e]/90 border-t border-gray-200 dark:border-white/5 pb-safe-bottom backdrop-blur-md">
                {currentSelection && (
                    <div className="mb-2 flex justify-between items-center px-2 animate-slide-up">
                        <span className="text-[10px] uppercase font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1">
                            <Type size={10} /> Редактирование фрагмента
                        </span>
                        <button onClick={() => setCurrentSelection(null)} className="text-[10px] text-gray-400 hover:text-red-500 transition-colors">Сброс</button>
                    </div>
                )}
                
                <div className="relative flex items-end gap-2 bg-gray-100 dark:bg-black/50 p-1.5 rounded-[24px] border border-transparent focus-within:border-purple-500/30 transition-all shadow-inner">
                    <textarea 
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => {
                            if(e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage();
                            }
                        }}
                        placeholder={currentSelection ? "Как изменить этот текст?" : "Спроси AI..."}
                        className="flex-1 bg-transparent border-none outline-none text-sm px-4 py-2.5 max-h-32 min-h-[44px] resize-none text-gray-900 dark:text-gray-100 placeholder-gray-500 scrollbar-hide"
                        rows={1}
                    />
                    <button 
                        onClick={() => handleSendMessage()}
                        disabled={!chatInput.trim() || isProcessing}
                        className="w-10 h-10 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg disabled:opacity-50 disabled:scale-100"
                    >
                        {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className="ml-0.5" />}
                    </button>
                </div>
            </div>

        </div>
    </div>
  );
};

// Subcomponent
const QuickAction: React.FC<{ icon: React.ReactNode, label: string, onClick: () => void }> = ({ icon, label, onClick }) => (
    <button 
        onClick={onClick}
        className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-[#252529] border border-gray-200 dark:border-white/5 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:border-purple-200 dark:hover:border-purple-500/30 active:scale-95 transition-all shrink-0 shadow-sm"
    >
        <span className="text-gray-500 dark:text-gray-400">{icon}</span>
        <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">{label}</span>
    </button>
);
