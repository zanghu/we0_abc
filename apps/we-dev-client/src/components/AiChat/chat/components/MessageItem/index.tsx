import React, { useState, useCallback, useMemo, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { ArtifactView } from "../ArtifactView";
import { ImageGrid } from "../ImageGrid";
import { Message } from "ai";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { memo } from "react";
import { SyntaxHighlighterProps } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";

import classNames from "classnames";
import useUserStore from "../../../../../stores/userSlice";
import useThemeStore from "@/stores/themeSlice";


// 添加处理流式parts的函数
export const processStreamParts = (parts: Message['parts']): string => {
  let result = '';
  let thinkContent = '';

  // 首先处理所有reasoning类型的内容
  parts?.forEach(part => {
    if (part.type === 'reasoning') {
      thinkContent += part.reasoning;
    }
  });

  // 如果有reasoning内容，将其转换为markdown引用格式
  if (thinkContent) {
    result += thinkContent.split('\n')
      .map(line => `> ${line}`)
      .join('\n') + '\n\n';
  }

  // 添加其他类型的内容
  parts?.forEach(part => {
    if (part.type === 'text') {
      // 检查是否包含think标签，如果有则进行处理
      if (isThinkContent(part.text)) {
        result += processThinkContent(part.text);
      } else {
        result += part.text;
      }
    }
  });

  return result.trim();
};

interface MessageItemProps {
  message: Message & {
    experimental_attachments?: Array<{
      id: string;
      name: string;
      type: string;
      localUrl: string;
      contentType: string;
      url: string;
    }>;
  };
  isLoading: boolean;
  messages: Array<{ role: string; content: string }>;
}

const isArtifactContent = (content: string) => {
  return content.includes("<boltArtifact");
};

const getArtifactTitle = (content: string) => {
  const match = content.match(/title="([^"]+)"/);
  return match ? match[1] : "Task";
};

// 添加图片预览组件
const ImagePreview = ({
  src,
  onClose,
}: {
  src: string;
  onClose: () => void;
}) => {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center"
      onClick={onClose}
    >
      <div className="relative max-w-[90vw] max-h-[90vh]">
        <img
          src={src}
          alt="Preview"
          className="object-contain max-w-full max-h-[90vh]"
        />
        <button
          className="absolute top-4 right-4 text-white hover:text-gray-300"
          onClick={onClose}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

// 添加获取首字母的辅助函数
const getInitial = (name: string | null | undefined): string => {
  if (!name) return "U";

  // 尝试获取第一个英文字母
  const englishMatch = name.match(/[a-zA-Z]/);
  if (englishMatch) {
    return englishMatch[0].toUpperCase();
  }

  // 如果没有英文字母，返回第一个字符
  return name.charAt(0).toUpperCase();
};

// 使用 memo 包裹 CodeBlock 组件以避免不必要的重渲染
export const CodeBlock = memo(
  ({
    language,
    filePath,
    children,
  }: {
    language: string;
    filePath?: string;
    children: string;
  }) => {
    const [copied, setCopied] = useState(false);
    const { isDarkMode } = useThemeStore();

    const handleCopy = useCallback(async () => {
      try {
        await navigator.clipboard.writeText(children);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy:", err);
      }
    }, [children]);

    return (
      <div className="my-4">
        <div className="rounded-lg overflow-hidden group border dark:border-[#333] shadow-sm">
          <div className="flex items-center justify-between px-4 py-2 border-b dark:border-[#333] bg-gray-50 dark:bg-[#2d2d2d]">
            <div className="flex items-center gap-2.5">
              {filePath ? (
                <div className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-[#6e7681] dark:text-gray-400"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                  >
                    <path d="M2 1.75C2 .784 2.784 0 3.75 0h6.586c.464 0 .909.184 1.237.513l2.914 2.914c.329.328.513.773.513 1.237v9.586A1.75 1.75 0 0 1 13.25 16h-9.5A1.75 1.75 0 0 1 2 14.25Zm1.75-.25a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h9.5a.25.25 0 0 0 .25-.25V6h-2.75A1.75 1.75 0 0 1 9 4.25V1.5Zm6.75.062V4.25c0 .138.112.25.25.25h2.688l-.011-.013-2.914-2.914-.013-.011Z" />
                  </svg>
                  <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                    {filePath}
                  </span>
                </div>
              ) : language ? (
                <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                  {language}
                </div>
              ) : null}
            </div>
            <button
              onClick={handleCopy}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 h-6 w-6 flex items-center justify-center"
            >
              {copied ? (
                <svg
                  className="w-3 h-3"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    d="M20 6L9 17l-5-5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <svg
                  className="w-3 h-3"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              )}
            </button>
          </div>
          <div className="overflow-hidden bg-white dark:bg-[#1e1e1e]">
            <div
              className="overflow-x-auto scrollbar-none "
              style={{
                margin: "-0.5em 0px",
              }}
            >
              <SyntaxHighlighter
                language={language}
                style={isDarkMode ? oneDark : oneLight}
                PreTag="div"
                useInlineStyles={true}
                wrapLines={true}
                wrapLongLines={true}
                showLineNumbers={false}
                className="text-sm [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] selection:bg-blue-100 dark:selection:bg-blue-800/30"
              >
                {children}
              </SyntaxHighlighter>
            </div>
          </div>
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.language === nextProps.language &&
      prevProps.filePath === nextProps.filePath &&
      prevProps.children === nextProps.children
    );
  }
);

CodeBlock.displayName = "CodeBlock";

// 添加检查是否是 think 内容的函数
export const isThinkContent = (content: string) => {
  return content.includes("<think>") || content.includes("</think>");
};

// 修改 processThinkContent 函数
export const processThinkContent = (content: string) => {
  let isInThinkBlock = false;
  let result = "";

  // 按行处理内容
  const lines = content.split("\n");
  for (let line of lines) {
    if (line.includes("<think>")) {
      isInThinkBlock = true;
      line = line.replace(/<think>/g, "").trim();
      if (line) {
        result += `> ${line}\n`;
      }
      continue;
    }

    if (line.includes("</think>")) {
      isInThinkBlock = false;
      line = line.replace(/<\/think>/g, "").trim();
      if (line) {
        result += `> ${line}\n`;
      }
      result += "\n"; // 在think块结束后添加空行
      continue;
    }

    if (isInThinkBlock) {
      result += line.trim() ? `> ${line}\n` : ">\n";
    } else {
      result += `${line}\n`;
    }
  }

  return result.trim();
};


export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  isLoading,
  messages,
}) => {
  const { user } = useUserStore();
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const isUser = message.role === "user";

  const initial = isUser ? getInitial(user?.name || user?.username) : "AI";
  const avatarColor = isUser
    ? "bg-purple-500 dark:bg-purple-600"
    : "bg-gray-100 dark:bg-[rgba(45,45,45)]";
  return (
    <div className="group">
      <div className="flex items-start gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
        <div
          className={classNames(
            "w-6 h-6 rounded-full flex items-center justify-center text-xs border border-gray-200 dark:border-gray-700/50 overflow-hidden",
            avatarColor,
            isUser ? "text-white" : "text-gray-700 dark:text-gray-300"
          )}
        >
          {isUser ? (
            user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name || user.username || "User"}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="font-medium">{initial}</span>
            )
          ) : (
            <span className="font-medium">AI</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          {isArtifactContent(message.content) ? (
            <ArtifactView
              isUser={isUser}
              title={getArtifactTitle(message.content)}
              content={message.content}
              isComplete={!isLoading}
              messages={messages}
            />
          ) : (
            <div className="text-gray-900 dark:text-gray-100 leading-relaxed prose dark:prose-invert prose-sm max-w-none">
              <ReactMarkdown
                components={{
                  code({ node, className, children, ...props }) {
                    const match = /language-(\w+)(?::(.+))?/.exec(
                      className || ""
                    );
                    const isInline = !match;

                    if (isInline) {
                      return (
                        <code
                          className="font-mono text-sm px-1.5 py-0.5 rounded bg-gray-50 dark:bg-[#282828] text-gray-800 dark:text-gray-300"
                          {...props}
                        >
                          {children}
                        </code>
                      );
                    }

                    const language = match?.[1] || "";
                    const filePath = match?.[2];
                    // 确保 children 是字符串类型
                    const content = Array.isArray(children)
                      ? children.join("")
                      : String(children).replace(/\n$/, "");

                    return (
                      <CodeBlock language={language} filePath={filePath}>
                        {content}
                      </CodeBlock>
                    );
                  },
                  pre({ children }) {
                    // 直接返回子元素，不需要额外的包装
                    return children;
                  },
                  p({ children }) {
                    return (
                      <p className="mb-2 last:mb-0">
                        {children}
                      </p>
                    );
                  },
                  ul({ children }) {
                    return (
                      <ul className="list-disc pl-4 mb-2 space-y-1">
                        {children}
                      </ul>
                    );
                  },
                  ol({ children }) {
                    return (
                      <ol className="list-decimal pl-4 mb-2 space-y-1">
                        {children}
                      </ol>
                    );
                  },
                  li({ children }) {
                    return (
                      <li className="text-gray-700 dark:text-gray-300">
                        {children}
                      </li>
                    );
                  },
                  a({ children, href }) {
                    return (
                      <a
                        href={href}
                        className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {children}
                      </a>
                    );
                  },
                  blockquote({ children }) {
                    return (
                      <blockquote className="border-l-4 border-purple-200 dark:border-purple-800 pl-4 my-2 text-sm text-gray-600 dark:text-gray-400 bg-purple-50 dark:bg-purple-900/10 py-2 rounded">
                        {children}
                      </blockquote>
                    );
                  },
                  strong({ children }) {
                    return <strong>{children}</strong>;
                  },
                  em({ children }) {
                    return <em>{children}</em>;
                  },
                }}
              >
                {processStreamParts(message.parts)}
              </ReactMarkdown>
            </div>
          )}
          {message.experimental_attachments &&
            message.experimental_attachments.length > 0 && (
              <div className="mt-2">
                <ImageGrid
                  images={message.experimental_attachments}
                  onImageClick={(url) => setPreviewImage(url)}
                />
              </div>
            )}
        </div>
      </div>

      {previewImage && (
        <ImagePreview
          src={previewImage}
          onClose={() => setPreviewImage(null)}
        />
      )}
    </div>
  );
};
