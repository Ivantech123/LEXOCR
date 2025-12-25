
import { HistoryItem } from '../types';
import { supabase } from '../lib/supabase';

const STORAGE_KEY = 'lex_ocr_history_v1';
const MAX_ITEMS = 20;

export const historyService = {
  
  getAll: (): HistoryItem[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error("Failed to load history locally", e);
      return [];
    }
  },

  // Sync Local storage to Supabase if user is logged in
  syncWithCloud: async () => {
      if (!supabase) return;
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const localHistory = historyService.getAll();
      
      // 1. Fetch Cloud History
      const { data: cloudHistory, error } = await supabase
          .from('history')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(MAX_ITEMS);

      if (error) {
          console.error("Cloud sync fetch error", error);
          return;
      }

      // 2. Merge (Simple Strategy: Union by ID)
      const mergedMap = new Map();
      
      // Add cloud items first
      cloudHistory?.forEach((item: any) => {
          mergedMap.set(item.id, {
              id: item.id,
              date: new Date(item.created_at).getTime(),
              type: item.type,
              summary: item.summary,
              fullText: item.full_text,
              preview: null // We don't sync huge base64 previews to DB in this demo version to save bandwidth
          });
      });

      // Add local items (overwrite if newer? No, ID based)
      localHistory.forEach(item => {
          if (!mergedMap.has(item.id)) {
              mergedMap.set(item.id, item);
              // Push new local items to cloud
              supabase.from('history').insert({
                  id: item.id, // Using the timestamp ID from local might collide if not UUID, but for demo ok
                  user_id: user.id,
                  type: item.type,
                  summary: item.summary,
                  full_text: item.fullText,
                  created_at: new Date(item.date).toISOString()
              }).then(res => { if(res.error) console.error("Push error", res.error); });
          }
      });

      // 3. Save merged back to local
      const mergedArray = Array.from(mergedMap.values()).sort((a, b) => b.date - a.date).slice(0, MAX_ITEMS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mergedArray));
      
      return mergedArray;
  },

  add: (item: HistoryItem) => {
    try {
      const current = historyService.getAll();
      const updated = [item, ...current].slice(0, MAX_ITEMS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      
      // Async Push to Cloud
      if (supabase) {
          supabase.auth.getUser().then(({ data: { user } }) => {
              if (user) {
                  supabase.from('history').insert({
                      // Generate a valid UUID if ID is just a timestamp string, otherwise Supabase might reject
                      // For this demo we assume the table allows text IDs or we'd need uuid gen
                      user_id: user.id,
                      type: item.type,
                      summary: item.summary,
                      full_text: item.fullText,
                      created_at: new Date(item.date).toISOString()
                  }).then((res: any) => {
                      if (res.error) console.error("Supabase insert error", res.error);
                  });
              }
          });
      }

      return updated;
    } catch (e) {
      console.error("Failed to save history", e);
      return [];
    }
  },

  clear: () => {
    localStorage.removeItem(STORAGE_KEY);
    // Optional: Clear cloud too? Usually safer not to auto-wipe cloud.
    return [];
  },
  
  hasSeenWelcome: (): boolean => {
      return localStorage.getItem('lex_welcome_seen') === 'true';
  },

  markWelcomeSeen: () => {
      localStorage.setItem('lex_welcome_seen', 'true');
  }
};
