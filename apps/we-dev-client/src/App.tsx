import React, { useEffect, useState } from "react";
import useUserStore from "./stores/userSlice";
import useChatModeStore from "./stores/chatModeSlice";
import useThemeStore from "./stores/themeSlice";
import { GlobalLimitModal } from "./components/UserModal";
import Header from "./components/Header";
import AiChat from "./components/AiChat";
import Login from "./components/Login";
import EditorPreviewTabs from "./components/EditorPreviewTabs";
import { getIsElectron } from "./utils/electron";
import { authService } from "./api/auth";
import "./utils/i18";
import classNames from "classnames";
import { useTranslation } from "react-i18next";
import { ChatMode } from "./types/chat";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import i18n from "./utils/i18";
interface Code {
  reactHtml: string;
  vueHtml: string;
  css: string;
  html: string;
  scss: string;
}

function App() {
  const [code, setCode] = useState<Code | null>(null);
  const isElectron = getIsElectron();
  const { mode } = useChatModeStore();
  const { t } = useTranslation();
  const { isDarkMode, toggleTheme, setTheme } = useThemeStore();
  console.log(t("Welcome to React"));
  const {
    // rememberMe,
    // isAuthenticated,
    isLoginModalOpen,
    closeLoginModal,
    openLoginModal,
    setUser,
  } = useUserStore();


  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme) {
      setTheme(savedTheme === 'dark');
    } else {
      // 如果没有保存的主题设置，则使用系统主题
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark);
      localStorage.setItem('theme', prefersDark ? 'dark' : 'light');
    }
    (window as any)?.electron?.ipcRenderer.invoke(
      "node-container:set-now-path",
      ""
    );
    const settingsConfig = JSON.parse(localStorage.getItem('settingsConfig') || '{}');
    if (settingsConfig.language) {
      i18n.changeLanguage(settingsConfig.language);
    } else {
      // 获取浏览器的语言设置
      const browserLang = navigator.language.toLowerCase();
      // 如果是中文环境（包括简体中文和繁体中文），设置为中文，否则设置为英文
      const defaultLang = browserLang.startsWith('zh') ? 'zh' : 'en';

      i18n.changeLanguage(defaultLang);
      // 保存到本地设置中
    }
    if (!isElectron) {
      const fetchUserInfo = async () => {
        const token = localStorage.getItem("token");
        if (token) {
          const user = await authService.getUserInfo(token);
          setUser(user);
        }
      };
      fetchUserInfo();
    }
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    <>
      <GlobalLimitModal onLogin={openLoginModal} />
      <Login isOpen={isLoginModalOpen} onClose={closeLoginModal} />
      <div className={classNames("h-screen w-screen flex flex-col overflow-hidden", {
        'dark': isDarkMode
      })}>
        <Header />
        <div className="flex flex-row w-full h-full max-h-[calc(100%-48px)] bg-white dark:bg-[#111]">
          <AiChat code={code} />
          {mode === ChatMode.Builder && <EditorPreviewTabs />}
        </div>
      </div>
      <ToastContainer
        position="top-center"
        autoClose={2000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
        style={{
          zIndex: 100000,
        }}
      />
    </>
  );
}

export default App;
