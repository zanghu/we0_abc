import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface User {
  id: string;
  username: string;
  email: string | null;
  avatar: string | null;
  githubId?: string;
  wechatId?: string;
  createdAt: string;
  name?: string;
}

interface UserState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  rememberMe: boolean;
  isLoginModalOpen: boolean;
  setRememberMe: (remember: boolean) => void;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  openLoginModal: () => void;
  closeLoginModal: () => void;
}

const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      rememberMe: false,
      isLoginModalOpen: false,

      setRememberMe: (remember) => {
        if (window?.electron?.ipcRenderer) {
          // 在 Electron 环境中，使用 localStorage 存储
          localStorage.setItem("rememberMe", remember.toString());
        }
        set({ rememberMe: remember });
      },

      setUser: (user) => {
        if (window?.electron?.ipcRenderer) {
          // 在 Electron 环境中，使用 localStorage 存储
          if (user) {
            localStorage.setItem("user", JSON.stringify(user));
          } else {
            localStorage.removeItem("user");
          }
        }
        set(() => ({
          user,
          isAuthenticated: !!user,
        }));
      },

      setToken: (token) => {
        if (window?.electron?.ipcRenderer) {
          // 在 Electron 环境中，使用 localStorage 存储
          if (token) {
            localStorage.setItem("token", token);
          } else {
            localStorage.removeItem("token");
          }
        }
        set(() => ({ token }));
      },

      login: (user, token) => {
        if (window?.electron?.ipcRenderer) {
          // 在 Electron 环境中，使用 localStorage 存储
          localStorage.setItem("user", JSON.stringify(user));
          localStorage.setItem("token", token);
        }
        set(() => ({
          user,
          token,
          isAuthenticated: true,
          isLoginModalOpen: false,
        }));
      },

      logout: () => {
        if (window?.electron?.ipcRenderer) {
          // 在 Electron 环境中，清除 localStorage
          localStorage.removeItem("user");
          localStorage.removeItem("token");
          localStorage.removeItem("rememberMe");
        }
        set(() => ({
          user: null,
          token: null,
          isAuthenticated: false,
          rememberMe: false,
        }));
      },

      updateUser: (userData) =>
        set((state) => {
          const newUser = state.user ? { ...state.user, ...userData } : null;
          if (window?.electron?.ipcRenderer && newUser) {
            // 在 Electron 环境中，更新 localStorage
            localStorage.setItem("user", JSON.stringify(newUser));
          }
          return { user: newUser };
        }),

      openLoginModal: () =>
        set(() => ({
          isLoginModalOpen: true,
        })),

      closeLoginModal: () =>
        set(() => ({
          isLoginModalOpen: false,
        })),
    }),
    {
      name: "user-storage",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        rememberMe: state.rememberMe,
      }),
      // 添加存储版本号，方便后续升级迁移
      version: 1,
      // 初始化时从 localStorage 恢复状态
      onRehydrateStorage: () => (state) => {
        if (window?.electron?.ipcRenderer) {
          const rememberMe = localStorage.getItem("rememberMe") === "true";
          if (rememberMe) {
            const storedUser = localStorage.getItem("user");
            const storedToken = localStorage.getItem("token");
            if (storedUser && storedToken) {
              state?.setUser(JSON.parse(storedUser));
              state?.setToken(storedToken);
              state?.setRememberMe(true);
            }
          }
        }
      },
    }
  )
);

export default useUserStore;
