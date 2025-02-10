declare global {
  interface Window {
    isLoading: boolean;
    getCurrentDir: () => string;
  }
}

export {};
