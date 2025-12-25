
export interface OcrResult {
  text: string;
  confidence?: number;
}

export enum AppState {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

export type AppView = 'DASHBOARD' | 'OCR' | 'AUDIO' | 'HISTORY' | 'PRIVACY' | 'EDITOR' | 'ABOUT' | 'AI_CHAT' | 'TIPS';
export type Theme = 'light' | 'dark';

export interface ImageFile {
  id: string; // Unique ID for keying
  file?: File;
  previewUrl: string;
  base64: string;
  mimeType: string;
  pageIndex?: number; // For PDFs
  rotation?: number; // 0, 90, 180, 270
}

export interface AudioAnalysisResult {
  transcription: string;
  summary: string;
  keyPoints: string[];
}

export interface HistoryItem {
  id: string;
  date: number; // Timestamp
  type: 'OCR' | 'AUDIO' | 'DOC';
  preview?: string; // Small thumbnail dataURL (optional)
  summary: string; // First ~100 chars or summary
  fullText: string;
}

export interface TextSelection {
  start: number;
  end: number;
  text: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: number;
  isThinking?: boolean;
  targetSelection?: TextSelection; // The text selected when this request was made
}

// --- LEGAL EDITOR TYPES ---

export type EditorMode = 'EDIT' | 'SUGGEST' | 'VIEW';

export interface DocBlock {
  id: string;
  type: 'h1' | 'h2' | 'p' | 'li' | 'clause';
  content: string;
  riskLevel?: 'high' | 'medium' | 'low'; // For risk analysis highlighting
  comments?: DocComment[];
}

export interface DocComment {
  id: string;
  author: string;
  text: string;
  date: number;
  resolved: boolean;
}

export interface AiSuggestion {
  id: string;
  blockId: string;
  originalText: string;
  suggestedText: string;
  reason: string;
  status: 'pending' | 'accepted' | 'rejected';
}

export interface LegalRisk {
  id: string;
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  blockIdRef?: string; // Link to specific paragraph
}

// Declare global PDF.js types and Speech Recognition
declare global {
  interface Window {
    pdfjsLib: any;
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}
