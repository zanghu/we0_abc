import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface EditorConfig {
  theme: 'vs-dark' | 'light';
  fontSize: number;
  tabSize: number;
  wordWrap: boolean;
  minimap: boolean;
  setTheme: (theme: 'vs-dark' | 'light') => void;
  setFontSize: (size: number) => void;
  setTabSize: (size: number) => void;
  setWordWrap: (wrap: boolean) => void;
  setMinimap: (show: boolean) => void;
}

export const useEditorConfig = create<EditorConfig>()(
  persist(
    (set) => ({
      theme: 'vs-dark',
      fontSize: 14,
      tabSize: 2,
      wordWrap: true,
      minimap: false,
      setTheme: (theme) => set({ theme }),
      setFontSize: (fontSize) => set({ fontSize }),
      setTabSize: (tabSize) => set({ tabSize }),
      setWordWrap: (wordWrap) => set({ wordWrap }),
      setMinimap: (minimap) => set({ minimap }),
    }),
    {
      name: 'editor-config',
    }
  )
);