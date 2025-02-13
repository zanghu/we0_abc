import { create } from "zustand";
import axios from "axios";

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface UserState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  fetchUser: () => Promise<void>;
  setUser: (user: User | null) => void;
  setToken: (token: string) => void;
  getToken: () => string | null;
  logout: () => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  token: typeof window !== "undefined" ? localStorage.getItem("token") : null,
  isLoading: false,
  error: null,
  fetchUser: async () => {
    try {
      set({ isLoading: true, error: null });
      const token = get().token;
      if (!token) {
        set({ isLoading: false });
        return;
      }

      const response = await axios.get(`/api/user`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      set({ user: response.data, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to fetch user",
        isLoading: false,
      });
    }
  },
  setUser: (user) => set({ user }),
  setToken: (token) => {
    localStorage.setItem("token", token);
    localStorage.setItem("rememberMe", "true");
    localStorage.setItem("user", JSON.stringify(get().user));
    set({ token });
  },
  getToken: () => {
    const state = get();
    return state.token;
  },
  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("rememberMe");

    set({ user: null, token: null });
  },
}));
