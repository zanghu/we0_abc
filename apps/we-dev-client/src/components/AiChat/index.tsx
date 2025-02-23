import { Card, ConfigProvider, Divider, Flex, theme } from "antd";
import { useEffect, useState } from "react";
import { BaseChat } from "./chat";
import { ChatMode } from "@/types/chat";
import useChatModeStore from "@/stores/chatModeSlice";

interface Code {
  reactHtml: string;
  vueHtml: string;
  css: string;
  html: string;
  scss: string;
}

interface AiChatProps {
  code: Code | null;
}

const Independent: React.FC<AiChatProps> = ({ code }) => {
  const { mode, initOpen } = useChatModeStore();

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm, // 使用暗色算法
      }}
    >
      <div
        className="bg-[rgba(255,255,255)] dark:bg-[rgba(30,30,30)]"
        
        style={{
          ...(initOpen
            ? {
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }
            : {}),
          width: `${mode === ChatMode.Builder && !initOpen ? "300px" : "100%"}`,
          minWidth: "400px",
          borderRadius: "8px",
          padding: "16px",
          marginLeft: "6px",
          marginTop: "6px",
          marginBottom: "6px",
        }}
      >
        <BaseChat />
      </div>
    </ConfigProvider>
  );
};
export default Independent;
