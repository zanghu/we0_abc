// import { ChatMode } from '@/components/AiChat/chat/components/ChatInput';
import { create } from 'zustand';
enum ChatMode {
  Chat = 'chat',
  Builder = 'builder'
}
interface ChatModeState {
  mode: ChatMode;
  setMode: (mode: ChatMode) => void;
}

const useChatModeStore = create<ChatModeState>((set) => ({
  mode: ChatMode.Builder,
  setMode: (mode) => set({ mode }),
}));

export default useChatModeStore; 