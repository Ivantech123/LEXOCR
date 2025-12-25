
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Trash2, Sparkles, Loader2, Copy, Check, AlertCircle, Image as ImageIcon, Mic, X, Paperclip, Code, PenTool, Lightbulb, Terminal } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { ChatMessage } from '../types';
import { haptic } from '../utils/haptics';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const MODEL_ID = "gemini-2.5-flash";

export const AiChatView: React.FC = () => {
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([{
      id: 'welcome',
      role: 'ai',
      content: 'Привет! Я ваш мультимодальный AI-ассистент. \n\nЯ могу:\n• Анализировать фото\n• Писать код и тексты\n• Отвечать на вопросы',
      timestamp: Date.now()
  }]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [attachedImage, setAttachedImage] = useState<{data: string, mime: string} | null>(null);
  const [isListening, setIsListening] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory, attachedImage]);

  // Initialize Speech Recognition
  useEffect(() => {
      if ('webkitSpeechRecognition' in window) {
          const recognition = new window.webkitSpeechRecognition();
          recognition.continuous = false;
          recognition.lang = 'ru-RU';
          recognition.onresult = (event: any) => {
              const transcript = event.results[0][0].transcript;
              setInput(prev => prev + (prev ? ' ' : '') + transcript);
              setIsListening(false);
          };
          recognition.onerror = () => setIsListening(false);
          recognition.onend = () => setIsListening(false);
          recognitionRef.current = recognition;
      }
  }, []);

  const handleSend = async (overrideText?: string) => {
    const textToSend = overrideText || input;
    if ((!textToSend.trim() && !attachedImage) || isProcessing) return;
    
    haptic.impactLight();
    
    const userMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: textToSend,
        timestamp: Date.now()
    };
    
    // Optimistic Update
    setChatHistory(prev => [...prev, userMsg]);
    setInput("");
    const currentImage = attachedImage; // Capture ref
    setAttachedImage(null); // Clear attachment
    setIsProcessing(true);
    
    const aiMsgId = (Date.now() + 1).toString();
    setChatHistory(prev => [...prev, { id: aiMsgId, role: 'ai', content: "", timestamp: Date.now(), isThinking: true }]);

    try {
        // Construct History for Context (Simplified for text-only history + current multimodal)
        // Note: Sending full history with images can be heavy, so we often just send text history + current image
        const historyText = chatHistory.slice(-10).map(m => `${m.role === 'user' ? 'USER' : 'MODEL'}: ${m.content}`).join('\n');
        
        const parts: any[] = [];
        
        // 1. Add History Context as text
        if (historyText) {
            parts.push({ text: `PREVIOUS CHAT CONTEXT:\n${historyText}\n` });
        }

        // 2. Add Current Image if exists
        if (currentImage) {
            parts.push({
                inlineData: {
                    data: currentImage.data,
                    mimeType: currentImage.mime
                }
            });
            parts.push({ text: `\nUSER REQUEST (About this image): ${textToSend}` });
        } else {
            parts.push({ text: `\nUSER REQUEST: ${textToSend}` });
        }

        const response = await ai.models.generateContent({
            model: MODEL_ID,
            contents: { parts },
        });

        const text = response.text || "Извините, я не смог ответить.";
        haptic.success();
        
        setChatHistory(prev => prev.map(msg => 
            msg.id === aiMsgId ? { ...msg, content: text, isThinking: false } : msg
        ));
    } catch (e: any) {
        haptic.error();
        console.error(e);
        setChatHistory(prev => prev.map(msg => 
            msg.id === aiMsgId ? { ...msg, content: `Ошибка: ${e.message || "Не удалось связаться с сервером"}`, isThinking: false } : msg
        ));
    } finally {
        setIsProcessing(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              const result = reader.result as string;
              setAttachedImage({
                  data: result.split(',')[1],
                  mime: file.type
              });
          };
          reader.readAsDataURL(file);
      }
      e.target.value = ''; // Reset
  };

  const toggleMic = () => {
      if (isListening) {
          recognitionRef.current?.stop();
      } else {
          haptic.impactMedium();
          setIsListening(true);
          recognitionRef.current?.start();
      }
  };

  const clearChat = () => {
      if(confirm("Очистить переписку?")) {
          setChatHistory([{
              id: Date.now().toString(),
              role: 'ai',
              content: 'Чат очищен. Готов к новым задачам.',
              timestamp: Date.now()
          }]);
      }
  };

  // --- Render Helpers ---

  // Simple Markdown Formatter
  const renderMessageContent = (text: string) => {
      // 1. Code blocks
      const codeBlockRegex = /```([\s\S]*?)```/g;
      const parts = text.split(codeBlockRegex);
      
      return parts.map((part, index) => {
          if (index % 2 === 1) {
              // Code block
              return (
                  <div key={index} className="bg-black/80 text-gray-200 p-3 rounded-lg my-2 font-mono text-xs overflow-x-auto whitespace-pre">
                      {part.trim()}
                  </div>
              );
          }
          // Text with bold formatting
          return (
              <span key={index} className="whitespace-pre-wrap">
                  {part.split(/\*\*(.*?)\*\*/g).map((subPart, subIndex) => 
                      subIndex % 2 === 1 ? <strong key={subIndex}>{subPart}</strong> : subPart
                  )}
              </span>
          );
      });
  };

  return (
    <div className="flex-1 flex flex-col h-full relative animate-spring-up pb-safe-bottom bg-[#f2f2f7] dark:bg-black">
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-gray-200 dark:border-white/10 bg-white/70 dark:bg-[#1c1c1e]/70 backdrop-blur-xl sticky top-0 z-20">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                    <Bot size={20} className="text-white" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-black dark:text-white leading-none">Gemini Pro</h2>
                    <p className="text-xs text-purple-600 dark:text-purple-400 font-medium mt-1">Multi-modal Chat</p>
                </div>
            </div>
            <button onClick={clearChat} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-full transition-colors">
                <Trash2 size={20} />
            </button>
        </div>

        {/* Chat Area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6">
            
            {/* Empty State Suggestions */}
            {chatHistory.length === 1 && (
                <div className="grid grid-cols-2 gap-3 mt-4 max-w-md mx-auto animate-slide-up-fade">
                    <SuggestionChip icon={<Code size={16}/>} label="Напиши код на Python" onClick={() => handleSend("Напиши скрипт на Python для парсинга сайтов.")} />
                    <SuggestionChip icon={<PenTool size={16}/>} label="Придумай идею поста" onClick={() => handleSend("Придумай 5 тем для блога про технологии.")} />
                    <SuggestionChip icon={<Terminal size={16}/>} label="Объясни как работает..." onClick={() => handleSend("Объясни простыми словами, как работает блокчейн.")} />
                    <SuggestionChip icon={<Lightbulb size={16}/>} label="Анализ изображения" onClick={() => fileInputRef.current?.click()} />
                </div>
            )}

            {chatHistory.map((msg) => (
                <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 ${msg.role === 'user' ? 'bg-black dark:bg-white' : 'bg-white dark:bg-[#2c2c2e] border border-gray-200 dark:border-white/10'}`}>
                        {msg.role === 'user' ? <User size={14} className="text-white dark:text-black" /> : <Sparkles size={14} className="text-purple-600 dark:text-purple-400" />}
                    </div>
                    
                    <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm relative group ${
                        msg.role === 'user' 
                        ? 'bg-blue-600 text-white rounded-tr-sm' 
                        : 'bg-white dark:bg-[#1c1c1e] text-gray-900 dark:text-gray-100 border border-gray-100 dark:border-white/10 rounded-tl-sm'
                    }`}>
                        {msg.isThinking ? (
                            <div className="flex gap-1.5 items-center h-5">
                                <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{animationDelay: '0ms'}}/>
                                <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{animationDelay: '150ms'}}/>
                                <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{animationDelay: '300ms'}}/>
                            </div>
                        ) : (
                            renderMessageContent(msg.content)
                        )}
                        
                        {!msg.isThinking && (
                            <button 
                                onClick={() => navigator.clipboard.writeText(msg.content)}
                                className={`absolute -bottom-6 ${msg.role === 'user' ? 'left-0' : 'right-0'} opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-purple-500`}
                            >
                                <Copy size={14} />
                            </button>
                        )}
                    </div>
                </div>
            ))}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white/80 dark:bg-[#000000]/80 backdrop-blur-xl border-t border-gray-200 dark:border-white/10">
            {/* Image Preview */}
            {attachedImage && (
                <div className="mb-3 relative inline-block animate-pop-in">
                    <img 
                        src={`data:${attachedImage.mime};base64,${attachedImage.data}`} 
                        alt="Preview" 
                        className="h-20 rounded-xl border border-white/20 shadow-lg object-cover"
                    />
                    <button 
                        onClick={() => setAttachedImage(null)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:scale-110 transition-transform"
                    >
                        <X size={12} />
                    </button>
                </div>
            )}

            <div className="flex items-end gap-2 bg-gray-100 dark:bg-white/5 p-2 rounded-[24px] border border-transparent focus-within:border-purple-500/30 transition-all">
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    accept="image/*" 
                    onChange={handleImageUpload} 
                    className="hidden" 
                />
                
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="p-3 rounded-full text-gray-500 hover:text-purple-600 hover:bg-white dark:hover:bg-white/10 transition-all active:scale-95"
                    title="Прикрепить фото"
                >
                    <Paperclip size={20} />
                </button>

                <textarea 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                        if(e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                        }
                    }}
                    placeholder={isListening ? "Говорите..." : "Сообщение..."}
                    className="flex-1 bg-transparent border-none outline-none text-sm px-2 py-3 max-h-32 min-h-[44px] resize-none text-black dark:text-white placeholder-gray-500"
                    rows={1}
                />
                
                <button 
                    onClick={toggleMic}
                    className={`p-3 rounded-full transition-all active:scale-95 ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-gray-500 hover:text-purple-600 hover:bg-white dark:hover:bg-white/10'}`}
                >
                    <Mic size={20} />
                </button>

                <button 
                    onClick={() => handleSend()}
                    disabled={(!input.trim() && !attachedImage) || isProcessing}
                    className="w-11 h-11 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                >
                    {isProcessing ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} className="ml-0.5" />}
                </button>
            </div>
        </div>
    </div>
  );
};

const SuggestionChip: React.FC<{ icon: React.ReactNode, label: string, onClick: () => void }> = ({ icon, label, onClick }) => (
    <button 
        onClick={onClick}
        className="flex flex-col items-center justify-center gap-2 p-4 bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/5 rounded-2xl hover:border-purple-500/30 hover:bg-purple-50/50 dark:hover:bg-purple-900/10 transition-all active:scale-95 text-center shadow-sm"
    >
        <div className="text-purple-600 dark:text-purple-400">{icon}</div>
        <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">{label}</span>
    </button>
);
