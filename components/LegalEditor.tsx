
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Bold, Italic, AlignLeft, AlignCenter, AlignRight, 
  Sparkles, ShieldAlert, BookOpen, MessageSquare, Check, X as XIcon,
  Wand2, ChevronRight, Gavel, Type, AlertTriangle,
  FileText, Printer, Minus, Plus, Settings, ChevronDown, List,
  Heading1, Heading2, Quote, Undo, FilePlus, Download
} from 'lucide-react';
import { DocBlock, AiSuggestion, LegalRisk, ChatMessage } from '../types';
import { GoogleGenAI } from "@google/genai";
import { Button } from './Button';
import { haptic } from '../utils/haptics';

// --- TYPES ---
interface DraftBlock {
    type: 'h1' | 'h2' | 'p' | 'li' | 'ul';
    content: string;
}

// --- INITIAL MOCK DATA ---
const initialBlocks: DocBlock[] = [
    { id: '1', type: 'h1', content: 'ДОГОВОР О КОНФИДЕНЦИАЛЬНОСТИ (NDA)' },
    { id: '2', type: 'p', content: 'г. Москва, «___» _________ 202_ г.' },
    { id: '3', type: 'p', content: 'ООО «Ромашка», именуемое в дальнейшем «Раскрывающая сторона», в лице Генерального директора Иванова И.И., с одной стороны,' },
    { id: '4', type: 'p', content: 'и ООО «Василек», именуемое в дальнейшем «Принимающая сторона», с другой стороны, заключили настоящий договор.' },
    { id: '5', type: 'h2', content: '1. ПРЕДМЕТ ДОГОВОРА' },
    { id: '6', type: 'p', content: '1.1. Стороны обязуются сохранять в тайне всю коммерческую, техническую и иную информацию, полученную друг от друга.' },
    { id: '7', type: 'p', content: '1.2. Конфиденциальная информация не может быть передана третьим лицам без письменного согласия Раскрывающей стороны.' },
    { id: '8', type: 'p', content: '1.3. Обязательства по сохранению конфиденциальности сохраняют свою силу в течение 5 (пяти) лет после прекращения действия настоящего Договора.' },
];

// Initialize AI
const getClient = () => {
    const customKey = localStorage.getItem('lex_custom_api_key');
    return new GoogleGenAI({ apiKey: customKey || process.env.API_KEY || '' });
};
const MODEL_ID = "gemini-2.5-flash";

// --- SETTINGS CONSTANTS ---
const A4_WIDTH_PX = 794; // 210mm at 96dpi approx
const A4_HEIGHT_PX = 1123; // 297mm at 96dpi approx
const PAGE_CHAR_LIMIT = 1800; // Rough heuristic for pagination

export const LegalEditor: React.FC = () => {
  const [blocks, setBlocks] = useState<DocBlock[]>(initialBlocks);
  const [activeTab, setActiveTab] = useState<'CHAT' | 'RISKS' | 'CLAUSES'>('CHAT');
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(true);
  const [suggestions, setSuggestions] = useState<AiSuggestion[]>([]);
  
  // Editor Appearance State
  const [zoom, setZoom] = useState(100);
  const [fontFamily, setFontFamily] = useState<'sans' | 'serif' | 'mono'>('serif');
  const [fontSize, setFontSize] = useState(11); // pt
  const [lineHeight, setLineHeight] = useState(1.5);

  // Editor State
  const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null);
  
  // Chat State
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Risk State
  const [risks, setRisks] = useState<LegalRisk[]>([]);
  const [isRiskAnalyzing, setIsRiskAnalyzing] = useState(false);

  const chatScrollRef = useRef<HTMLDivElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat
  useEffect(() => {
      if (chatScrollRef.current) {
          chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
      }
  }, [chatHistory]);

  // --- PAGINATION LOGIC (Heuristic) ---
  const pages = useMemo(() => {
      const pgs: DocBlock[][] = [[]];
      let currentCharCount = 0;
      let currentPage = 0;

      blocks.forEach(block => {
          // Heuristic for height based on chars and type
          const blockLen = block.content.length + (block.type === 'h1' ? 300 : (block.type === 'h2' ? 150 : 50)); 
          
          if (currentCharCount + blockLen > PAGE_CHAR_LIMIT) {
              currentPage++;
              pgs[currentPage] = [];
              currentCharCount = 0;
          }
          
          pgs[currentPage].push(block);
          currentCharCount += blockLen;
      });
      return pgs;
  }, [blocks]);


  // --- EDITOR OPERATIONS ---

  const updateBlock = (id: string, newContent: string) => {
      setBlocks(prev => prev.map(b => b.id === id ? { ...b, content: newContent } : b));
  };

  const updateBlockType = (id: string, newType: DocBlock['type']) => {
      setBlocks(prev => prev.map(b => b.id === id ? { ...b, type: newType } : b));
  };

  const addBlock = (afterId: string, type: DocBlock['type'] = 'p') => {
      const newBlock: DocBlock = { id: Date.now().toString(), type, content: '' };
      const idx = blocks.findIndex(b => b.id === afterId);
      const newBlocks = [...blocks];
      newBlocks.splice(idx + 1, 0, newBlock);
      setBlocks(newBlocks);
      setFocusedBlockId(newBlock.id);
  };

  const deleteBlock = (id: string) => {
      if (blocks.length <= 1) return;
      const idx = blocks.findIndex(b => b.id === id);
      setBlocks(prev => prev.filter(b => b.id !== id));
      if (idx > 0) setFocusedBlockId(blocks[idx - 1].id);
  };

  const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
      if (e.key === 'Enter') {
          e.preventDefault();
          addBlock(id);
      } else if (e.key === 'Backspace' && (e.target as HTMLElement).innerText === '') {
          // If empty and backspace pressed, delete block
          if ((e.target as HTMLElement).innerText.trim() === '') {
             e.preventDefault();
             deleteBlock(id);
          }
      }
  };

  const applyFormat = (command: string, value?: string) => {
      document.execCommand(command, false, value);
  };

  // --- AI LOGIC (INTELLIGENT DRAFTING) ---
  
  const handleSendMessage = async (customPrompt?: string, targetBlockId?: string) => {
      const textToSend = customPrompt || chatInput;
      if (!textToSend.trim()) return;
      
      const userMsg: ChatMessage = { 
          id: Date.now().toString(), 
          role: 'user', 
          content: textToSend, 
          timestamp: Date.now() 
      };
      setChatHistory(prev => [...prev, userMsg]);
      setChatInput("");
      setIsProcessing(true);

      const activeBlock = blocks.find(b => b.id === (targetBlockId || focusedBlockId));
      const fullDocText = blocks.map(b => b.content).join('\n');
      
      const draftingKeywords = /напиши|составь|подготовь|сделай|пример|иск|договор|пункт|раздел/i;
      const isDraftingIntent = draftingKeywords.test(textToSend);

      try {
          const ai = getClient();
          let prompt = "";

          if (isDraftingIntent) {
             // STRUCTURED DRAFTING PROMPT
             prompt = `
                ROLE: Expert Legal Drafter.
                TASK: Draft legal content based on request.
                USER REQUEST: "${textToSend}"
                CONTEXT: The document is a contract/legal doc in Russian.
                
                OUTPUT FORMAT: JSON Array of objects.
                Example: [{"type": "h2", "content": "Title"}, {"type": "p", "content": "Text..."}, {"type": "li", "content": "Item 1"}]
                Supported types: 'h1', 'h2', 'p', 'li'.
                
                CRITICAL: Return ONLY raw JSON. No markdown fencing. No preamble.
             `;
          } else if (activeBlock && (targetBlockId || focusedBlockId)) {
              prompt = `
                  ROLE: Senior Legal Editor.
                  TASK: Edit specific clause.
                  TARGET CLAUSE: "${activeBlock.content}"
                  USER INSTRUCTION: ${textToSend}
                  OUTPUT: Return ONLY the new text for the clause. No quotes.
              `;
          } else {
              prompt = `
                  ROLE: Legal Consultant.
                  DOCUMENT CONTEXT: "${fullDocText.substring(0, 3000)}..."
                  USER QUERY: ${textToSend}
                  Answer professionally in Russian.
              `;
          }

          const response = await ai.models.generateContent({ 
              model: MODEL_ID, 
              contents: prompt,
              config: isDraftingIntent ? { responseMimeType: "application/json" } : undefined
          });
          
          const responseText = response.text?.trim() || "";

          // Handle Drafting Response (JSON)
          if (isDraftingIntent) {
              try {
                  const draftBlocks: DraftBlock[] = JSON.parse(responseText);
                  const newId = Date.now().toString();
                  const anchorId = focusedBlockId || blocks[blocks.length-1].id;
                  
                  setSuggestions(prev => [...prev, {
                      id: newId,
                      blockId: "NEW_APPEND_" + anchorId, 
                      originalText: "",
                      suggestedText: JSON.stringify(draftBlocks), // Store structure as string
                      reason: "AI Structure Draft",
                      status: 'pending'
                  }]);
                  
                  setChatHistory(prev => [...prev, { id: (Date.now()+1).toString(), role: 'ai', content: "Я подготовил проект текста. Просмотрите его в документе.", timestamp: Date.now() }]);
                  setTimeout(() => { suggestionsRef.current?.scrollIntoView({ behavior: 'smooth' }); }, 100);
                  
              } catch (e) {
                  // Fallback if JSON parse fails
                  setChatHistory(prev => [...prev, { id: (Date.now()+1).toString(), role: 'ai', content: responseText, timestamp: Date.now() }]);
              }
          } 
          // Handle Editing Response (Text)
          else if (activeBlock && (targetBlockId || focusedBlockId)) {
               const newId = Date.now().toString();
               setSuggestions(prev => [...prev, {
                  id: newId,
                  blockId: activeBlock.id,
                  originalText: activeBlock.content,
                  suggestedText: responseText,
                  reason: "AI Edit",
                  status: 'pending'
              }]);
              setChatHistory(prev => [...prev, { id: (Date.now()+1).toString(), role: 'ai', content: "Предложил правку для выбранного пункта.", timestamp: Date.now() }]);
          } 
          // Handle Chat Response
          else {
              setChatHistory(prev => [...prev, { id: (Date.now()+1).toString(), role: 'ai', content: responseText, timestamp: Date.now() }]);
          }

      } catch (e) {
          console.error(e);
          setChatHistory(prev => [...prev, { id: Date.now().toString(), role: 'ai', content: "Ошибка AI. Попробуйте еще раз.", timestamp: Date.now() }]);
      } finally {
          setIsProcessing(false);
      }
  };

  const analyzeRisks = async () => {
      setIsRiskAnalyzing(true);
      setActiveTab('RISKS');
      try {
          const ai = getClient();
          const docWithIds = blocks.map(b => `[ID: ${b.id}] ${b.content}`).join('\n');
          const prompt = `
              ROLE: Legal Risk Auditor.
              TASK: Analyze for risks (ambiguity, unfavorable terms).
              DOCUMENT: """${docWithIds}"""
              OUTPUT FORMAT (JSON ARRAY ONLY):
              [{"id": "1", "severity": "high", "title": "Risk Title", "description": "Short explanation", "blockIdRef": "ID"}]
          `;
          const response = await ai.models.generateContent({ model: MODEL_ID, contents: prompt, config: { responseMimeType: "application/json" } });
          const riskData: LegalRisk[] = JSON.parse(response.text || "[]");
          setRisks(riskData);
          const riskMap = new Map<string, 'high'|'medium'|'low'>();
          riskData.forEach(r => { if (r.blockIdRef) riskMap.set(r.blockIdRef, r.severity); });
          setBlocks(prev => prev.map(b => ({ ...b, riskLevel: riskMap.get(b.id) || undefined })));
      } catch (e) { console.error(e); } finally { setIsRiskAnalyzing(false); }
  };

  const generateClause = async (type: string) => {
      handleSendMessage(`Напиши стандартный пункт: ${type}`);
  };

  // --- SUGGESTION HANDLING ---

  const acceptSuggestion = (suggestion: AiSuggestion) => {
      haptic.success();
      
      if (suggestion.blockId.startsWith("NEW_APPEND_")) {
          const targetId = suggestion.blockId.replace("NEW_APPEND_", "");
          let newBlocksToAdd: DocBlock[] = [];

          try {
              // Try parsing as structured JSON
              const draftBlocks: DraftBlock[] = JSON.parse(suggestion.suggestedText);
              newBlocksToAdd = draftBlocks.map((draft, idx) => ({
                  id: Date.now().toString() + idx,
                  type: (draft.type === 'ul' ? 'p' : draft.type) as any, // Simple mapping
                  content: draft.content
              }));
          } catch {
              // Fallback for plain text
              const paragraphs = suggestion.suggestedText.split('\n').filter(t => t.trim().length > 0);
              newBlocksToAdd = paragraphs.map((text, idx) => ({ id: Date.now().toString() + idx, type: 'p', content: text }));
          }

          const idx = blocks.findIndex(b => b.id === targetId);
          const newBlocks = [...blocks];
          // Insert after target
          newBlocks.splice(idx + 1, 0, ...newBlocksToAdd);
          
          setBlocks(newBlocks);
          if (newBlocksToAdd.length > 0) {
              setFocusedBlockId(newBlocksToAdd[0].id);
          }
      } else {
          // Single block replace
          updateBlock(suggestion.blockId, suggestion.suggestedText);
      }
      setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
  };

  const rejectSuggestion = (id: string) => { haptic.impactLight(); setSuggestions(prev => prev.filter(s => s.id !== id)); };

  const scrollToBlock = (id: string) => {
      setFocusedBlockId(id);
      const el = document.getElementById(`block-${id}`);
      if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.style.backgroundColor = 'rgba(255, 255, 0, 0.3)';
          setTimeout(() => el.style.backgroundColor = 'transparent', 1500);
      }
  };

  const getFontClass = () => {
      if (fontFamily === 'serif') return 'font-serif';
      if (fontFamily === 'mono') return 'font-mono';
      return 'font-sans';
  };

  // Helper to render Draft Preview
  const renderDraftPreview = (textOrJson: string) => {
      try {
          const data: DraftBlock[] = JSON.parse(textOrJson);
          return (
              <div className="space-y-3 font-serif">
                  {data.map((b, i) => (
                      <div key={i} className={`${b.type === 'h1' ? 'text-xl font-bold' : (b.type === 'h2' ? 'text-lg font-bold' : 'text-sm')}`}>
                          {b.content}
                      </div>
                  ))}
              </div>
          );
      } catch {
          return <div className="whitespace-pre-wrap text-sm">{textOrJson}</div>;
      }
  };

  return (
    <div className="flex h-full bg-[#F2F4F7] dark:bg-[#0e0e0e] overflow-hidden animate-spring-up">
        
        {/* --- MAIN AREA --- */}
        <div className="flex-1 flex flex-col h-full min-w-0 relative">
            
            {/* Toolbar */}
            <div className="h-auto flex flex-col z-20 bg-white dark:bg-[#1c1c1e] border-b border-gray-200 dark:border-white/10 shadow-sm transition-all">
                {/* Top Row */}
                <div className="flex items-center justify-between px-4 py-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-lg shadow-md">
                            <FileText size={18} />
                        </div>
                        <div>
                            <input className="text-base font-bold text-gray-900 dark:text-white bg-transparent outline-none w-48" defaultValue="NDA_Project_Final" />
                            <div className="flex gap-2 text-[10px] font-medium text-gray-500 uppercase tracking-wide">
                                <span>Saved</span>
                                <span>•</span>
                                <span>v2.4</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                         <div className="hidden md:flex items-center gap-2 mr-4 bg-gray-100 dark:bg-white/5 rounded-full px-2 py-1 border border-gray-200 dark:border-white/10">
                             <button onClick={() => setZoom(z => Math.max(50, z - 10))} className="p-1 hover:bg-white dark:hover:bg-white/10 rounded-full"><Minus size={12}/></button>
                             <span className="text-xs font-mono w-10 text-center text-gray-600 dark:text-gray-300">{zoom}%</span>
                             <button onClick={() => setZoom(z => Math.min(200, z + 10))} className="p-1 hover:bg-white dark:hover:bg-white/10 rounded-full"><Plus size={12}/></button>
                         </div>
                         <Button variant="tonal" className="!py-1.5 !px-3 text-xs font-bold" onClick={() => analyzeRisks()}>
                            <ShieldAlert size={14} className="mr-2"/> Анализ
                         </Button>
                         <Button variant="filled" className="!py-1.5 !px-3 text-xs bg-black dark:bg-white text-white dark:text-black">
                            <Download size={14} className="mr-2"/> PDF
                         </Button>
                    </div>
                </div>

                {/* Formatting Row */}
                <div className="flex items-center gap-1 px-4 py-1.5 overflow-x-auto border-t border-gray-100 dark:border-white/5 scrollbar-hide">
                     <div className="flex items-center gap-1 bg-gray-50 dark:bg-white/5 rounded-lg px-2 py-1 border border-gray-200 dark:border-white/10 mr-2">
                        <span className="text-xs font-medium w-20 truncate cursor-pointer select-none" onClick={() => setFontFamily(f => f === 'sans' ? 'serif' : 'sans')}>{fontFamily === 'serif' ? 'Merriweather' : 'Inter'}</span>
                        <ChevronDown size={12} className="opacity-50" />
                     </div>
                     
                     <div className="flex items-center bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-200 dark:border-white/10 mr-2">
                         <button onClick={() => setFontSize(s => Math.max(8, s-1))} className="px-2 py-1 hover:bg-black/5 dark:hover:bg-white/10"><Minus size={10}/></button>
                         <span className="text-xs w-6 text-center border-x border-gray-200 dark:border-white/10">{fontSize}</span>
                         <button onClick={() => setFontSize(s => Math.min(72, s+1))} className="px-2 py-1 hover:bg-black/5 dark:hover:bg-white/10"><Plus size={10}/></button>
                     </div>

                     <div className="w-px h-4 bg-gray-300 dark:bg-white/10 mx-1" />
                     
                     <ToolbarButton icon={<Heading1 size={16}/>} onClick={() => focusedBlockId && updateBlockType(focusedBlockId, 'h1')} />
                     <ToolbarButton icon={<Heading2 size={16}/>} onClick={() => focusedBlockId && updateBlockType(focusedBlockId, 'h2')} />
                     <ToolbarButton icon={<List size={16}/>} onClick={() => focusedBlockId && updateBlockType(focusedBlockId, 'li')} />
                     
                     <div className="w-px h-4 bg-gray-300 dark:bg-white/10 mx-1" />

                     <ToolbarButton icon={<Bold size={16}/>} onClick={() => applyFormat('bold')} />
                     <ToolbarButton icon={<Italic size={16}/>} onClick={() => applyFormat('italic')} />
                     
                     <div className="w-px h-4 bg-gray-300 dark:bg-white/10 mx-1" />
                     
                     <ToolbarButton icon={<AlignLeft size={16}/>} onClick={() => applyFormat('justifyLeft')} />
                     <ToolbarButton icon={<AlignCenter size={16}/>} onClick={() => applyFormat('justifyCenter')} />
                     
                     <div className="flex-1" />
                     
                     <button 
                         onClick={() => setIsAiPanelOpen(!isAiPanelOpen)}
                         className={`p-1.5 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold ${isAiPanelOpen ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30' : 'hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500'}`}
                     >
                         <Sparkles size={16} /> <span className="hidden sm:inline">AI Assistant</span>
                     </button>
                </div>
            </div>

            {/* Canvas */}
            <div className="flex-1 overflow-y-auto bg-[#F2F4F7] dark:bg-[#0e0e0e] relative flex flex-col items-center">
                
                {/* Horizontal Ruler */}
                <div className="sticky top-0 z-10 w-full h-6 bg-[#F2F4F7] dark:bg-[#0e0e0e] flex justify-center border-b border-gray-200 dark:border-white/5 pointer-events-none">
                    <div 
                        className="h-full bg-white dark:bg-[#1c1c1e] relative hidden md:block border-x border-gray-300 dark:border-white/10 shadow-sm"
                        style={{ width: `${A4_WIDTH_PX * (zoom/100)}px` }}
                    >
                        <div className="absolute inset-x-0 bottom-0 h-1.5 flex justify-between px-[25mm]">
                             {[...Array(20)].map((_, i) => (
                                 <div key={i} className="w-px h-1 bg-gray-300 dark:bg-gray-600"></div>
                             ))}
                        </div>
                    </div>
                </div>

                {/* Pages Container */}
                <div className="py-8 px-4 min-h-full flex flex-col items-center gap-8">
                    
                    {/* Render Pages */}
                    {pages.map((pageBlocks, pageIndex) => (
                        <div 
                            key={pageIndex}
                            className="bg-white dark:bg-[#121212] shadow-xl dark:shadow-none transition-transform duration-200 origin-top ring-1 ring-black/5 dark:ring-white/10"
                            style={{
                                width: `${A4_WIDTH_PX}px`,
                                minHeight: `${A4_HEIGHT_PX}px`,
                                padding: '25mm',
                                transform: `scale(${zoom / 100})`,
                                marginBottom: `${20 * (zoom / 100)}px`
                            }}
                        >
                            <div className={`h-full ${getFontClass()}`} style={{ fontSize: `${fontSize}pt`, lineHeight: lineHeight }}>
                                {pageBlocks.map(block => {
                                    const suggestion = suggestions.find(s => s.blockId === block.id);
                                    return (
                                        <div key={block.id} id={`block-${block.id}`} className="group relative mb-3">
                                             
                                            {/* AI Suggestion Diff View (Inline Replacement) */}
                                            {suggestion ? (
                                                <div className="relative rounded-lg overflow-hidden border-2 border-purple-200 dark:border-purple-500/30 bg-purple-50/50 dark:bg-purple-900/10 p-4 my-4 animate-slide-in-right">
                                                     <div className="flex justify-between items-center mb-2">
                                                         <div className="text-[10px] font-bold uppercase tracking-wider text-purple-600 flex items-center gap-1">
                                                             <Wand2 size={12}/> AI Suggestion
                                                         </div>
                                                         <div className="flex gap-2">
                                                             <button onClick={() => rejectSuggestion(suggestion.id)} className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-500"><XIcon size={14}/></button>
                                                             <button onClick={() => acceptSuggestion(suggestion)} className="p-1 hover:bg-green-100 dark:hover:bg-green-900/30 rounded text-green-500"><Check size={14}/></button>
                                                         </div>
                                                     </div>
                                                     
                                                     <div className="grid grid-cols-1 gap-2">
                                                         <div className="opacity-50 line-through text-red-400 decoration-red-400 text-xs">
                                                             {block.content}
                                                         </div>
                                                         <div className="text-gray-900 dark:text-white font-medium bg-white/50 dark:bg-black/20 p-2 rounded">
                                                             {suggestion.suggestedText}
                                                         </div>
                                                     </div>
                                                </div>
                                            ) : (
                                                <div className="relative">
                                                     {/* Floating Actions (Visible on Focus) */}
                                                     {focusedBlockId === block.id && (
                                                        <div className="absolute -left-12 top-0 flex flex-col gap-1 z-20">
                                                            <button 
                                                                onClick={() => handleSendMessage("Перепиши это лучше", block.id)}
                                                                className="p-1.5 bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-300 rounded-full hover:scale-110 transition-transform shadow-sm"
                                                                title="AI Rewrite"
                                                            >
                                                                <Wand2 size={14} />
                                                            </button>
                                                        </div>
                                                     )}

                                                     {/* Risk Highlight */}
                                                     {block.riskLevel && (
                                                        <div className="absolute -left-7 top-1" title={`${block.riskLevel} risk`}>
                                                            <AlertTriangle size={16} className={`${block.riskLevel === 'high' ? 'text-red-500' : 'text-amber-500'} animate-pulse`} />
                                                        </div>
                                                     )}
                                                     
                                                     <div
                                                        contentEditable
                                                        suppressContentEditableWarning
                                                        onFocus={() => setFocusedBlockId(block.id)}
                                                        onInput={(e) => updateBlock(block.id, e.currentTarget.innerText)}
                                                        onKeyDown={(e) => handleKeyDown(e, block.id)}
                                                        className={`
                                                            outline-none transition-all duration-200 rounded-sm
                                                            ${block.type === 'h1' ? 'text-2xl font-bold text-center mb-6 uppercase tracking-wide' : ''}
                                                            ${block.type === 'h2' ? 'text-lg font-bold mt-6 mb-2 uppercase' : ''}
                                                            ${block.type === 'li' ? 'list-item list-disc ml-6 mb-1' : ''}
                                                            ${block.type === 'p' ? 'text-justify mb-2' : ''}
                                                            ${block.riskLevel === 'high' ? 'bg-red-50 dark:bg-red-900/20 decoration-red-500 underline decoration-wavy' : ''}
                                                            ${block.riskLevel === 'medium' ? 'bg-amber-50 dark:bg-amber-900/20' : ''}
                                                            ${focusedBlockId === block.id ? 'bg-blue-50/30 dark:bg-blue-900/10 -mx-1 px-1' : ''}
                                                        `}
                                                     >
                                                         {block.content}
                                                     </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Page Footer */}
                            <div className="absolute bottom-8 right-12 text-[10px] text-gray-300 select-none font-mono">
                                Page {pageIndex + 1}
                            </div>
                        </div>
                    ))}

                    {/* Pending Append Suggestions (GHOST BLOCKS) */}
                    <div ref={suggestionsRef} className="w-full flex flex-col items-center">
                    {suggestions.filter(s => s.blockId.startsWith("NEW_APPEND_")).map(s => (
                         <div 
                            key={s.id} 
                            className="bg-white dark:bg-[#121212] shadow-xl transition-all p-[25mm] relative group animate-scale-in-bounce border-2 border-dashed border-purple-300 dark:border-purple-700"
                            style={{ width: `${A4_WIDTH_PX}px`, transform: `scale(${zoom / 100})`, opacity: 0.9 }}
                         >
                             <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg flex items-center gap-2 z-20">
                                 <Sparkles size={12}/> AI Draft Preview
                             </div>
                             
                             <div className="text-gray-800 dark:text-gray-200">
                                 {renderDraftPreview(s.suggestedText)}
                             </div>

                             {/* Floating Action Bar */}
                             <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                 <button onClick={() => rejectSuggestion(s.id)} className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-full font-bold text-xs hover:bg-red-100 transition-colors shadow-sm">
                                     <XIcon size={14}/> Отклонить
                                 </button>
                                 <button onClick={() => acceptSuggestion(s)} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-full font-bold text-xs hover:bg-green-700 transition-colors shadow-lg hover:scale-105 transform">
                                     <Check size={14}/> Принять
                                 </button>
                             </div>
                         </div>
                    ))}
                    </div>

                </div>
            </div>
        </div>

        {/* --- AI SIDEBAR --- */}
        <div className={`
            w-[350px] bg-white dark:bg-[#141416] border-l border-gray-200 dark:border-white/5 flex flex-col transition-all duration-300 shadow-2xl z-30
            ${isAiPanelOpen ? 'translate-x-0' : 'translate-x-full absolute right-0 h-full'}
        `}>
            {/* Tabs */}
            <div className="flex p-2 border-b border-gray-100 dark:border-white/5">
                <TabButton active={activeTab === 'CHAT'} onClick={() => setActiveTab('CHAT')} icon={<MessageSquare size={16}/>} label="Чат" />
                <TabButton active={activeTab === 'RISKS'} onClick={() => setActiveTab('RISKS')} icon={<ShieldAlert size={16}/>} label="Риски" />
                <TabButton active={activeTab === 'CLAUSES'} onClick={() => setActiveTab('CLAUSES')} icon={<BookOpen size={16}/>} label="Библиотека" />
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 scrollbar-hide bg-gray-50/50 dark:bg-black/20">
                
                {/* CHAT TAB */}
                {activeTab === 'CHAT' && (
                    <div className="h-full flex flex-col">
                        <div className="flex-1 space-y-4 mb-4" ref={chatScrollRef}>
                            {chatHistory.length === 0 && (
                                <div className="text-center text-gray-400 mt-10">
                                    <Sparkles size={40} className="mx-auto mb-2 opacity-50"/>
                                    <p className="text-sm">Я в контексте документа.<br/>Спросите "Напиши пункт о..." или выделите текст.</p>
                                </div>
                            )}
                            {chatHistory.map(msg => (
                                <div key={msg.id} className={`p-3 rounded-2xl text-sm shadow-sm leading-relaxed ${msg.role === 'user' ? 'bg-white dark:bg-white/10 ml-4 border border-gray-200 dark:border-white/5 text-gray-800 dark:text-gray-100' : 'bg-purple-600 text-white mr-4'}`}>
                                    {msg.content}
                                </div>
                            ))}
                            {isProcessing && (
                                <div className="flex gap-1.5 p-4 bg-gray-100 dark:bg-white/5 rounded-2xl w-fit items-center">
                                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"/>
                                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-75"/>
                                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-150"/>
                                </div>
                            )}
                        </div>
                        <div className="relative group">
                            <input 
                                className="relative w-full bg-white dark:bg-[#1e1e20] border border-gray-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm outline-none shadow-sm pr-10 focus:border-purple-500 transition-colors"
                                placeholder={focusedBlockId ? "Правка выделенного..." : "Напиши иск..."}
                                value={chatInput}
                                onChange={e => setChatInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                            />
                            <button onClick={() => handleSendMessage()} className="absolute right-2 top-2 p-1.5 bg-black dark:bg-white text-white dark:text-black rounded-xl hover:scale-105 active:scale-95 transition-all">
                                <ChevronRight size={16}/>
                            </button>
                        </div>
                    </div>
                )}

                {/* RISKS TAB */}
                {activeTab === 'RISKS' && (
                    <div className="space-y-4">
                        <div className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-100 dark:border-amber-900/20">
                            <h3 className="font-bold text-amber-800 dark:text-amber-200 text-sm mb-1">Анализ рисков</h3>
                            <Button onClick={analyzeRisks} className="w-full mt-2 !py-2 text-xs bg-amber-600 text-white shadow-amber-500/20" disabled={isRiskAnalyzing}>
                                {isRiskAnalyzing ? 'Сканирование...' : 'Запустить анализ'}
                            </Button>
                        </div>

                        {risks.map(risk => (
                            <div 
                                key={risk.id} 
                                onClick={() => risk.blockIdRef && scrollToBlock(risk.blockIdRef)}
                                className={`group relative bg-white dark:bg-[#252529] p-4 rounded-xl border-l-4 shadow-sm hover:shadow-md transition-all cursor-pointer ${risk.severity === 'high' ? 'border-red-500' : 'border-amber-500'}`}
                            >
                                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${risk.severity === 'high' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>{risk.severity}</span>
                                <h4 className="font-bold text-sm mt-2">{risk.title}</h4>
                                <p className="text-xs text-gray-500 mt-1">{risk.description}</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* CLAUSES TAB */}
                {activeTab === 'CLAUSES' && (
                    <div className="space-y-2">
                        {['Confidentiality', 'Liability Cap', 'Force Majeure', 'Termination', 'Arbitration', 'Indemnification'].map(clause => (
                            <button 
                                key={clause}
                                onClick={() => generateClause(clause)}
                                className="w-full text-left p-3 rounded-xl bg-white dark:bg-[#252529] border border-gray-100 dark:border-white/5 hover:border-purple-500 hover:shadow-md group transition-all"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{clause}</span>
                                    <FilePlus size={14} className="text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity"/>
                                </div>
                            </button>
                        ))}
                    </div>
                )}

            </div>
        </div>

    </div>
  );
};

// --- Subcomponents ---

const ToolbarButton: React.FC<{ icon: React.ReactNode, active?: boolean, onClick?: () => void }> = ({ icon, active, onClick }) => (
    <button onClick={onClick} className={`p-1.5 rounded-lg transition-colors ${active ? 'bg-gray-200 dark:bg-white/20' : 'hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300'}`}>
        {icon}
    </button>
);

const TabButton: React.FC<{ active: boolean, onClick: () => void, icon: React.ReactNode, label: string }> = ({ active, onClick, icon, label }) => (
    <button 
        onClick={onClick}
        className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${active ? 'bg-white dark:bg-white/10 text-black dark:text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
    >
        {icon} {label}
    </button>
);

const QuickActionPill: React.FC<{ icon: React.ReactNode, label: string, onClick: () => void }> = ({ icon, label, onClick }) => (
    <button 
        onClick={onClick}
        className="flex items-center gap-2 px-3 py-1.5 bg-black text-white rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all text-[10px] font-bold"
    >
        <span className="text-purple-300">{icon}</span>
        {label}
    </button>
);
