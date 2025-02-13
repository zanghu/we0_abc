import { create } from "zustand";
import ClaudeAI from "@/icon/Claude";
import DeepSeek from "@/icon/Deepseek";
import { IModelOption } from "@/components/AiChat/chat";
import OpenAI from "@/icon/Openai";
export interface FilePreview {
  id: string;
  file: File;
  url: string;
  localUrl: string;
  status?: "uploading" | "done" | "error";
}

const modelOptions: IModelOption[] = [
  { value: 'claude-3-5-sonnet-20240620', label: 'Claude 3.5 Sonnet', icon: ClaudeAI, useImage: true, from: 'default' },
  { value: 'gpt-4o-mini', label: 'gpt-4o-mini', icon: OpenAI, useImage: false, from: 'default' },
  { value: 'DeepSeek-R1', label: 'DeepSeek R1', icon: DeepSeek, useImage: false, from: 'default' },
  { value: 'deepseek-chat', label: 'DeepSeek V3', icon: DeepSeek, useImage: false, from: 'default' },
] as const;
interface ChatState {
  modelOptions: IModelOption[];
  setModelOptions: (v: IModelOption[]) => void;
  uploadedImages: FilePreview[];
  setUploadedImages: (images: FilePreview[]) => void;
  addImages: (images: FilePreview[]) => void;
  updateImageStatus: (id: string, status: FilePreview["status"]) => void;
  removeImage: (id: string) => void;
  clearImages: () => void;
  ollamaConfig: {
    url: string;
    apiKey?: string;
  }
  setOllamaConfig: (config: { url: string; apiKey?: string }) => void;
}
const useChatStore = create<ChatState>((set) => ({
  uploadedImages: [],
  setModelOptions: (options) => set({ modelOptions: options }),
  setUploadedImages: (images) => set({ uploadedImages: images }),
  addImages: (images) =>
    set((state) => ({
      uploadedImages: [...state.uploadedImages, ...images],
    })),
  updateImageStatus: (id, status) =>
    set((state) => ({
      uploadedImages: state.uploadedImages.map((img) =>
        img.id === id ? { ...img, status } : img
      ),
    })),
  removeImage: (id) =>
    set((state) => ({
      uploadedImages: state.uploadedImages.filter((img) => img.id !== id),
    })),
  clearImages: () => set({ uploadedImages: [] }),
  modelOptions,
  ollamaConfig: {
    url: '',
    apiKey: '',
  },
  setOllamaConfig: (config) => set({ ollamaConfig: config }),
}));

export default useChatStore;
