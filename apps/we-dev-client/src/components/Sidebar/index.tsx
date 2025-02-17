import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Settings, SettingsTab, TAB_KEYS } from "../Settings";
import { db } from "../../utils/indexDB";
import { eventEmitter } from "../AiChat/utils/EventEmitter";
import useUserStore from "../../stores/userSlice";
import { getIsElectron } from "@/utils/electron";
import { useTranslation } from "react-i18next";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  plan?: string;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onChatSelect?: (uuid: string) => void;
}

export function Sidebar({
  isOpen,
  onClose,
  username,
  plan = "Personal Plan",
  onMouseEnter,
  onMouseLeave,
  onChatSelect,
}: SidebarProps) {
  const { t } = useTranslation();
  const { user, isAuthenticated, logout, openLoginModal } = useUserStore();
  const [settingsState, setSettingsState] = useState<{
    isOpen: boolean;
    tab: SettingsTab;
  }>({
    isOpen: false,
    tab: TAB_KEYS.GENERAL,
  });
  const [chatHistory, setChatHistory] = useState<
    {
      uuid: string;
      title?: string;
      lastMessage: string;
      time: number;
    }[]
  >([]);
  const [searchTerm, setSearchTerm] = useState("");

  // 加载聊天记录
  const loadChatHistory = async () => {
    try {
      const uuids = await db.getAllUuids();
      const historyPromises = uuids.map(async (uuid) => {
        const records = await db.getByUuid(uuid);
        const latestRecord = records[0]; // 已按时间排序，取最新
        console.log("latestRecord", latestRecord);

        // 添加安全检查
        if (!latestRecord?.data?.messages?.length) {
          return {
            uuid,
            title: "New Chat",
            lastMessage: "",
            time: latestRecord?.time || Date.now(),
          };
        }

        const lastMessage =
          latestRecord.data.messages[latestRecord.data.messages.length - 1];

        return {
          uuid,
          title: latestRecord.data.title || "New Chat",
          lastMessage: lastMessage?.content || "",
          time: latestRecord.time,
        };
      });

      const history = await Promise.all(historyPromises);
      // 按时间排序
      const sortedHistory = history.sort((a, b) => b.time - a.time);
      setChatHistory(sortedHistory);
    } catch (error) {
      console.error("Failed to load chat history:", error);
      setChatHistory([]); // 出错时设置为空数组
    }
  };

  useEffect(() => {
    loadChatHistory();

    // 订阅数据库更新
    db.subscribe(() => {
      loadChatHistory();
    });

    // 清理订阅
    // return () => unsubscribe();
  }, []);

  // 过滤聊天记录
  const filteredHistory = chatHistory.filter(
    (chat) =>
      chat.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chat.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 删除聊天记录
  const deleteChat = async (uuid: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await db.deleteByUuid(uuid);
    await loadChatHistory();
  };

  const openSettings = (tab: SettingsTab) => {
    setSettingsState({
      isOpen: true,
      tab,
    });
  };

  const closeSettings = () => {
    setSettingsState((prev) => ({
      ...prev,
      isOpen: false,
    }));
  };

  const handleLogout = (e: React.MouseEvent) => {
    e.stopPropagation();
    logout();
    onClose();
  };

  const isElectron = getIsElectron();
  const renderUserSection = () => {
    if (!isAuthenticated) {
      return (
        <div
          className="p-3 cursor-pointer hover:bg-white/5"
          onClick={() => {
            openLoginModal();
          }}
        >
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-gray-600 flex items-center justify-center text-white text-[14px] font-medium">
              ?
            </div>
            <div className="flex-1">
              <div className="text-white text-[14px] font-medium">
                {t("login.title")}
              </div>
              <div className="text-[13px] text-gray-400 translate">
                {t("login.click_to_login")}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div
        className="p-3 cursor-pointer hover:bg-white/5"
        onClick={() => openSettings(TAB_KEYS.TOKENS)}
      >
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white text-[14px] font-medium">
            {user?.username?.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="text-white text-[14px] font-medium">
              {user?.username}
            </div>
            <div className="text-[13px] text-gray-400 translate">
              {t("sidebar.personal_plan")}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-gray-400 hover:text-white"
          >
            <svg
              className="w-[16px] h-[16px]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
          </button>
        </div>
      </div>
    );
  };

  return createPortal(
    <>
      <div
        className={`
          fixed top-0 left-0 h-full w-[280px]
          bg-white dark:bg-[#1E1E1E] z-50
          transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          flex flex-col text-[14px]
          border-r border-gray-200 dark:border-[#333333]
          rounded-tr-xl rounded-br-xl
          overflow-hidden
        `}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {/* Logo */}
        <div className="p-3">
          <h1 className="text-gray-900 dark:text-white text-[14px] font-medium">
            WeDev
          </h1>
        </div>

        {/* New Chat Button */}
        <button
          onClick={() => eventEmitter.emit("chat:select", "")}
          className="mx-3 my-2 p-2 flex items-center gap-2 text-purple-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors text-[14px]"
        >
          <svg
            className="w-[16px] h-[16px]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          <span className="translate">{t("sidebar.start_new_chat")}</span>
        </button>

        {/* Search */}
        <div className="px-3 py-2">
          <input
            type="text"
            placeholder={t("sidebar.search")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-100 dark:bg-[#2C2C2C] text-gray-900 dark:text-white rounded-lg px-3 py-1.5 outline-none text-[14px] border border-gray-200 dark:border-gray-700"
          />
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto px-2 mt-1">
          {filteredHistory.map((chat) => (
            <div
              key={chat.uuid}
              onClick={() => eventEmitter.emit("chat:select", chat.uuid)}
              className="group flex items-center w-full text-left px-2 py-1.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 rounded text-[14px] cursor-pointer"
            >
              <span className="flex-1 truncate">
                {chat.title || "New Chat"}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteChat(chat.uuid, e);
                }}
                className="hidden group-hover:block text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>

        {/* Bottom Section */}
        <div className="mt-auto border-t border-gray-200 dark:border-[#333333]">
          {/* Settings and Help */}
          <div className="border-b border-gray-200 dark:border-[#333333]">
            <button
              onClick={() => openSettings("General")}
              className="w-full text-left px-3 py-2 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/5 flex items-center gap-2"
            >
              <svg
                className="w-[16px] h-[16px]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span className="translate">{t("sidebar.settings")}</span>
            </button>

            <button
              onClick={() => alert("请联系微信客服")}
              className="w-full text-left px-3 py-2 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/5 flex items-center gap-2"
            >
              <svg
                className="w-[16px] h-[16px]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
              <span className="text-[14px] translate">
                {t("sidebar.my_subscription")}
              </span>
            </button>
          </div>

          {/* User Profile - 使用新的渲染方法 */}
          {renderUserSection()}
        </div>
      </div>

      <Settings
        isOpen={settingsState.isOpen}
        onClose={closeSettings}
        initialTab={settingsState.tab}
      />
    </>,
    document.body
  );
}
