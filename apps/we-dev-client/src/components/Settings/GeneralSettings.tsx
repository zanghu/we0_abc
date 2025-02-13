import useChatStore from "@/stores/chatSlice";
import useThemeStore from "@/stores/themeSlice";
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import i18n from "@/utils/i18";
import { useTranslation } from "react-i18next";

export function GeneralSettings() {
  const { t } = useTranslation();
  const { setOllamaConfig, ollamaConfig } = useChatStore();
  const { isDarkMode, toggleTheme, setTheme } = useThemeStore();
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(JSON.parse(localStorage.getItem('settingsConfig') || '{}'));

  useEffect(() => {
     localStorage.setItem('settingsConfig', JSON.stringify(formData));
  }, [formData]);

  const [showPassword, setShowPassword] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);

  // 初始化时加载已保存的配置
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      ollamaUrl: ollamaConfig.url || "http://localhost:11434",
      apiKey: ollamaConfig.apiKey || "",
    }));
  }, [ollamaConfig]);

  // 组件加载时从本地存储读取主题设置
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
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // 保存到 store
      setOllamaConfig({
        url: formData.ollamaUrl || "http://localhost:11434",
        apiKey: formData.apiKey,
      });

      // 保存到 localStorage
      localStorage.setItem('ollamaConfig', JSON.stringify({
        url: formData.ollamaUrl || "http://localhost:11434",
        apiKey: formData.apiKey,
      }));

      toast('设置已保存', {
        type: 'success',
        position: "top-center",
        autoClose: 2000,
        theme: isDarkMode ? 'dark' : 'light',
        style: {
          zIndex: 100000,
        }
      });
    } catch (error) {
      // 即使出错也保存设置
      setOllamaConfig({
        url: formData.ollamaUrl || "http://localhost:11434",
        apiKey: formData.apiKey,
      });

      localStorage.setItem('ollamaConfig', JSON.stringify({
        url: formData.ollamaUrl || "http://localhost:11434",
        apiKey: formData.apiKey,
      }));

     
    } finally {
      setLoading(false);
    }
  };

  // 修改主题切换处理函数
  const handleThemeToggle = () => {
    toggleTheme();
    localStorage.setItem('theme', !isDarkMode ? 'dark' : 'light');
  };

  return (
    <div className="h-full flex flex-col text-foreground">
      <div className="flex-1">
        <div className="border-b border-border">
          <button
            className={`px-3 py-1.5 text-sm ${
              activeTab === 'general'
                ? 'text-foreground border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-foreground'
            }`}
            onClick={() => setActiveTab('general')}
          >
            {t("settings.General")}
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4 mt-4">
          {/* Theme Mode Toggle */}
          <div>
            <label className="block text-gray-500 dark:text-gray-300 mb-1.5 text-sm">
              主题模式
            </label>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleThemeToggle}
                className="px-2.5 py-1.5 bg-white dark:bg-[#1e1e1e] border border-border rounded-md text-foreground hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2 text-sm transition-colors"
              >
                {isDarkMode ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" 
                      />
                    </svg>
                    <span>暗黑模式</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" 
                      />
                    </svg>
                    <span>明亮模式</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Language Select */}
          <div className="relative">
            <label className="block text-gray-300 mb-1.5 text-sm">{t("settings.Language")}</label>
            <div className="relative">
              <button
                type="button"
                className="w-28 px-2.5 py-1.5 bg-white dark:bg-[#1e1e1e] border border-border rounded-md text-foreground text-left flex justify-between items-center text-sm"
                onClick={() => setLanguageOpen(!languageOpen)}
              >
                
                {formData.language === 'en' ? 'English' : '中文'}
                <svg
                  className={`w-3.5 h-3.5 transition-transform ${
                    languageOpen ? 'transform rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {languageOpen && (
                <div className="absolute w-28 mt-1 bg-white dark:bg-[#1e1e1e] border border-border rounded-md shadow-lg">
                  <button
                    type="button"
                    className="w-full px-2.5 py-1.5 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-sm text-foreground"
                    onClick={() => {
                      setFormData({ ...formData, language: 'en' });
                      setLanguageOpen(false);
                      i18n.changeLanguage('en');
                      localStorage.setItem('language', 'en');
                    }}
                  >
                    English
                  </button>
                  <button
                    type="button"
                    className="w-full px-2.5 py-1.5 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-sm text-foreground"
                    onClick={() => {
                      setFormData({ ...formData, language: 'zh' });
                      setLanguageOpen(false);
                      i18n.changeLanguage('zh');
                      localStorage.setItem('language', 'zh');
                    }}
                  >
                    中文
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Ollama URL Input */}
          <div>
            <label className="block text-gray-500 dark:text-gray-300 mb-1.5 text-sm">
              Ollama URL
            </label>
            <input
              type="text"
              placeholder="http://localhost:11434"
              value={formData.ollamaUrl || "http://localhost:11434"}
              onChange={(e) => setFormData({ ...formData, ollamaUrl: e.target.value })}
              className="w-full px-2.5 py-1.5 bg-white dark:bg-[#1e1e1e] border border-border rounded-md text-foreground focus:outline-none focus:border-blue-500 text-sm"
            />
          </div>

          {/* API Key Input */}
          <div>
            <label className="block text-gray-500 dark:text-gray-300 mb-1.5 text-sm">
              API Key
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                // required
                placeholder={t("settings.keyPlaceholder")}
                value={formData.apiKey}
                onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-white dark:bg-[#1e1e1e] border border-border rounded-md text-foreground focus:outline-none focus:border-blue-500 pr-8 text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-foreground"
              >
                {showPassword ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Save Button */}
      <div className="flex justify-end mt-4 pt-3 border-t border-border">
        <button
          type="submit"
          disabled={loading}
          onClick={handleSave}
          className={`px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-md flex items-center text-sm transition-colors ${
            loading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {loading && (
            <svg className="animate-spin -ml-1 mr-2 h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          )}
          {t("settings.save")}
        </button>
      </div>
    </div>
  );
}
