import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WebContainerConfig {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
}

export const useWebContainerConfig = create<WebContainerConfig>()(
  persist(
    (set) => ({
      enabled: true,
      setEnabled: (enabled) => set({ enabled }),
    }),
    {
      name: 'webcontainer-config',
    }
  )
);