import { openFile } from "../../../../WeIde/emit";
import React, { useMemo, useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { useFileStore } from "../../../../WeIde/stores/fileStore";
import classNames from "classnames";
import { executeCommand } from "@/components/WeIde/components/Terminal/utils/commands";
import { isThinkContent, processThinkContent } from "../MessageItem";

interface Task {
  status: "done" | "parsing";
  text: string;
  filePath?: string;
}

// 添加新的类型定义
type CommandStatus = "idle" | "running" | "completed";

interface ArtifactViewProps {
  isUser: boolean;
  title: string;
  content: string;
  isComplete?: boolean;
  messages: Array<{ role: string; content: string }>;
}

const TaskItem = ({
  isUser,
  status,
  title,
  text,
  content,
  onRestore,
}: {
  status: "done" | "parsing";
  text: string;
  isUser: boolean;
  title: string;
  content: string;
  onRestore: (path: string) => void;
}) => (
  <div className="flex items-center gap-2 px-2 py-1.5 hover:bg-[rgba(60,60,60)] group/item transition-colors">
    <div className="flex-shrink-0">
      {status === "done" && <span className="text-green-400 text-sm">✓</span>}
      {status === "parsing" && (
        <div className="w-4 h-4">
          <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
    <div className="flex-1 flex items-center justify-between min-w-0">
      <span
        className={`text-sm ${status === "done" ? "text-gray-300" : "text-gray-400"} hover:underline cursor-pointer truncate`}
        onClick={() => {
          openFile(text);
        }}
      >
        {text}
      </span>
      {(!isUser || title === "the current file") && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRestore(text);
          }}
          className="invisible group-hover/item:visible text-xs px-1.5 py-0.5 rounded bg-[#333] hover:bg-[#444] text-gray-300 transition-all flex items-center gap-1 flex-shrink-0 ml-2"
        >
          <svg
            className="w-3 h-3"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M3 12h1m8-9v1m8 8h1M5.6 5.6l.7.7m12.1-.7l-.7.7M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <span>Restore</span>
        </button>
      )}
    </div>
  </div>
);

// 添加解析上下文的函数
const parseFileFromContext = (filePath: string, content: string) => {
  const regex = new RegExp(
    `<boltAction[^>]*filePath="${filePath}"[^>]*>([\\s\\S]*?)<\\/boltAction>`
  );
  const match = content.match(regex);
  if (match) {
    return match[1].trim();
  }
  return null;
};

export const ArtifactView: React.FC<ArtifactViewProps> = ({
  isUser,
  title,
  content,
  isComplete,
  messages,
}) => {
  const { setFiles, updateContent } = useFileStore();
  const [isExpanded, setIsExpanded] = useState(true);
  const [fileStates, setFileStates] = useState<
    Map<string, { status: Task["status"]; order: number }>
  >(new Map());
  // 添加命令状态管理
  const [commandStatus, setCommandStatus] = useState<Record<string, CommandStatus>>({});

  // 处理 pre/post artifact 内容，应用 think 标签处理
  const preArtifactContent = useMemo(() => {
    const artifactIndex = content.indexOf("<boltArtifact");
    const preContent = artifactIndex > 0 ? content.substring(0, artifactIndex) : "";
    return isThinkContent(preContent) ? processThinkContent(preContent) : preContent;
  }, [content]);

  const postArtifactContent = useMemo(() => {
    const artifactEndIndex = content.lastIndexOf("</boltArtifact>");
    const postContent = artifactEndIndex !== -1
      ? content.substring(artifactEndIndex + "</boltArtifact>".length)
      : "";
    return isThinkContent(postContent) ? processThinkContent(postContent) : postContent;
  }, [content]);

  // 提取文件路径
  const filePaths = useMemo(() => {
    const matches = Array.from(
      content.matchAll(
        /<boltAction[^>]*type="file"[^>]*filePath="([^"]*)"[^>]*>/g
      )
    );
    return matches.map((match) => match[1]);
  }, [content]);

  // 使用 useEffect 处理文件打开
  useEffect(() => {
    const matches = Array.from(
      content.matchAll(
        /<boltAction[^>]*type="file"[^>]*filePath="([^"]*)"[^>]*>/g
      )
    );
    if (matches.length > 0 && !isComplete) {
      openFile(matches[matches.length - 1][1]);
    }
  }, [content]);

  // 初始化文件状态
  useEffect(() => {
    const newFileStates = new Map();
    filePaths.forEach((path, index) => {
      if (index === filePaths.length - 1) {
        newFileStates.set(path, {
          status: "parsing",
          order: index,
        });
      } else {
        newFileStates.set(path, {
          status: "done",
          order: index,
        });
      }
    });
    setFileStates(newFileStates);
  }, [filePaths]);

  // 当消息完成时，将所有任务标记为完成
  useEffect(() => {
    if (isComplete) {
      setFileStates((prev) => {
        const newStates = new Map(prev);
        filePaths.forEach((path) => {
          const fileState = newStates.get(path);
          if (fileState) {
            newStates.set(path, { ...fileState, status: "done" });
          }
        });
        return newStates;
      });
    }
  }, [isComplete, filePaths]);

  // 构建任务列表
  const tasks = useMemo(() => {
    return filePaths.map((filePath) => ({
      text: filePath,
      status: fileStates.get(filePath)?.status || "parsing",
    }));
  }, [filePaths, fileStates]);

  const npmCommands = useMemo(() => {
    const commands = [];
    // 使用正则表达式匹配 shell 命令
    const shellCommandRegex =
      /<boltAction\s+type="shell"\s*>([\s\S]*?)<\/boltAction>/g;
    // start情况下
        const startCommandRegex =
      /<boltAction\s+type="start"\s*>([\s\S]*?)<\/boltAction>/g;
    const matches = Array.from(content.matchAll(shellCommandRegex));
    const matchesByStart = Array.from(content.matchAll(startCommandRegex));

    matches.forEach((match) => {
      const command = match[1].trim();
      if (command.startsWith("npm install")) {
        commands.push({
          type: "install",
          command: command,
        });
      } else {
        commands.push({
          type: "other",
          command: command.replace(/\n/g, ""),
        });
      }
    });
     matchesByStart.forEach((match) => {
      const command = match[1].trim();
     if (command.startsWith("npm run")) {
        commands.push({
          type: "dev",
          command: command,
        });
      } else {
        commands.push({
          type: "other",
          command: command.replace(/\n/g, ""),
        });
      }
    });
    return commands;
  }, [content]);

  // 修改恢复单个文件的处理函数
  const handleRestoreFile = (filePath: string): void => {
    const fileContent = parseFileFromContext(filePath, content);
    if (fileContent) {
      updateContent(filePath, fileContent);
      openFile(filePath);
    }
  };

  return (
    <div className="space-y-3">
      {/* 显示 boltArtifact 之前的文本内容 */}
      {preArtifactContent && (
        <div className="text-gray-900 dark:text-gray-100 leading-relaxed prose dark:prose-invert prose-sm max-w-none">
          <ReactMarkdown
            components={{
              blockquote({ children }) {
                return (
                  <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 my-2 text-sm text-gray-600 dark:text-gray-400">
                    {children}
                  </blockquote>
                );
              },
            }}
          >
            {preArtifactContent}
          </ReactMarkdown>
        </div>
      )}

      {/* 任务列表卡片 */}
      <div className="bg-white dark:bg-[rgb(51,51,51)] rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700/50">
        <div
          className="border-b border-gray-200 dark:border-gray-700/50 px-3 py-2 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-[rgba(60,60,60)] transition-colors group"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-2">
            <h3 className="text-gray-700 dark:text-gray-200 font-medium text-sm">{title}</h3>
          </div>
          <div className="flex items-center gap-2">
            {/* 只在所有任务都完成时显示 Restore 按钮 */}
            {tasks.every((task) => task.status === "done") && !isUser && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  tasks.forEach((task) => handleRestoreFile(task.text));
                }}
                className="invisible group-hover:visible text-xs px-1.5 py-0.5 rounded bg-gray-100 hover:bg-gray-200 dark:bg-[#333] dark:hover:bg-[#444] text-gray-700 dark:text-gray-300 transition-all flex items-center gap-1 flex-shrink-0"
              >
                <svg
                  className="w-3 h-3"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M3 12h1m8-9v1m8 8h1M5.6 5.6l.7.7m12.1-.7l-.7.7M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <span>Restore All</span>
              </button>
            )}
          </div>
        </div>

        <div
          className={`transition-all duration-200 ease-in-out overflow-hidden ${
            isExpanded ? " opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="py-1 space-y-0.5">
            {tasks.map((task, i) => (
              <div className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-[rgba(60,60,60)] group/item transition-colors">
                <div className="flex-shrink-0">
                  {task.status === "done" && <span className="text-green-500 dark:text-green-400 text-sm">✓</span>}
                  {task.status === "parsing" && (
                    <div className="w-4 h-4">
                      <div className="w-4 h-4 border-2 border-blue-500 dark:border-blue-400 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                <div className="flex-1 flex items-center justify-between min-w-0">
                  <span className={`text-sm ${
                    task.status === "done" ? "text-gray-700 dark:text-gray-300" : "text-gray-500 dark:text-gray-400"
                  } hover:underline cursor-pointer truncate`}>
                    {task.text}
                  </span>
                  {(!isUser || title === "the current file") && (
                    <button className="invisible group-hover/item:visible text-xs px-1.5 py-0.5 rounded bg-gray-100 hover:bg-gray-200 dark:bg-[#333] dark:hover:bg-[#444] text-gray-700 dark:text-gray-300 transition-all flex items-center gap-1 flex-shrink-0 ml-2">
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 12h1m8-9v1m8 8h1M5.6 5.6l.7.7m12.1-.7l-.7.7M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      <span>Restore</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* NPM 命令区域 */}
        {isExpanded && npmCommands.length > 0 && (
          <div className="border-t border-gray-200 dark:border-gray-700/50">
            {npmCommands.map((cmd, index) => (
              <div
                key={cmd.type}
                className={classNames(
                  "bg-gray-50 dark:bg-[rgb(45,45,45)] px-3 py-2 font-mono text-sm flex items-center gap-1.5 justify-between group/npm",
                  index !== npmCommands.length - 1 &&
                    "border-b border-gray-200 dark:border-gray-700/50"
                )}
              >
                <div className="flex items-center justify-between w-full">
                  {cmd.type === "install" ? (
                    <div className="cursor-pointer" onClick={async () => {
                      if (commandStatus[cmd.command] === "running" || commandStatus[cmd.command] === "completed") {
                        return;
                      }
                      try {
                        setCommandStatus(prev => ({ ...prev, [cmd.command]: "running" }));
                        await executeCommand('npm install');
                        setCommandStatus(prev => ({ ...prev, [cmd.command]: "completed" }));
                      } catch (error) {
                        setCommandStatus(prev => ({ ...prev, [cmd.command]: "idle" }));
                      }
                    }}>
                      <div className="flex w-full gap-1.5">
                        <>
                          <span className="text-green-600 dark:text-[#7ee787]">npm</span>
                          <span className="text-gray-600 dark:text-gray-400">install</span>
                        </>
                        <button
                          className={classNames(
                            "text-xs px-1.5 py-0.5 rounded transition-all flex items-center gap-1 flex-shrink-0 ml-24",
                            {
                              "invisible group-hover/npm:visible bg-gray-100 hover:bg-gray-200 dark:bg-[#333] dark:hover:bg-[#444] text-gray-700 dark:text-gray-300": !commandStatus[cmd.command],
                              "bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed": commandStatus[cmd.command] === "completed",
                              "bg-blue-100 dark:bg-blue-600 text-blue-700 dark:text-white cursor-wait": commandStatus[cmd.command] === "running"
                            }
                          )}
                          disabled={commandStatus[cmd.command] === "running" || commandStatus[cmd.command] === "completed"}
                        >
                          {commandStatus[cmd.command] === "running" ? (
                            <div className="flex items-center gap-1">
                              <div className="w-3 h-3 border-2 border-blue-500 dark:border-white border-t-transparent rounded-full animate-spin" />
                              <span>Installing...</span>
                            </div>
                          ) : commandStatus[cmd.command] === "completed" ? (
                            <div className="flex items-center gap-1">
                              <span className="text-green-500 dark:text-green-400">✓</span>
                              <span>Installed</span>
                            </div>
                          ) : (
                            "install"
                          )}
                        </button>
                      </div>
                    </div>
                  ) : cmd.type === "dev" ? (
                    <div className="cursor-pointer" onClick={async () => {
                      if (commandStatus[cmd.command] === "running" || commandStatus[cmd.command] === "completed") {
                        return;
                      }
                      try {
                        setCommandStatus(prev => ({ ...prev, [cmd.command]: "running" }));
                        await executeCommand('npm run dev');
                        setCommandStatus(prev => ({ ...prev, [cmd.command]: "completed" }));
                      } catch (error) {
                        setCommandStatus(prev => ({ ...prev, [cmd.command]: "idle" }));
                      }
                    }}>
                      <div className="flex w-full gap-1.5">
                        <>
                          <span className="text-green-600 dark:text-[#7ee787]">npm</span>
                          <span className="text-gray-600 dark:text-gray-400">run</span>
                          <span className="text-[#79c0ff]">dev</span>
                        </>
                        <button
                          className={classNames(
                            "text-xs px-1.5 py-0.5 rounded transition-all flex items-center gap-1 flex-shrink-0 ml-24",
                            {
                              "invisible group-hover/npm:visible bg-gray-100 hover:bg-gray-200 dark:bg-[#333] dark:hover:bg-[#444] text-gray-700 dark:text-gray-300": !commandStatus[cmd.command],
                              "bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed": commandStatus[cmd.command] === "completed",
                              "bg-blue-100 dark:bg-blue-600 text-blue-700 dark:text-white cursor-wait": commandStatus[cmd.command] === "running"
                            }
                          )}
                          disabled={commandStatus[cmd.command] === "running" || commandStatus[cmd.command] === "completed"}
                        >
                          {commandStatus[cmd.command] === "running" ? (
                            <div className="flex items-center gap-1">
                              <div className="w-3 h-3 border-2 border-blue-500 dark:border-white border-t-transparent rounded-full animate-spin" />
                              <span>Starting...</span>
                            </div>
                          ) : commandStatus[cmd.command] === "completed" ? (
                            <div className="flex items-center gap-1">
                              <span className="text-green-500 dark:text-green-400">✓</span>
                              <span>Started</span>
                            </div>
                          ) : (
                            "start"
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <span className="text-green-600 dark:text-[#7ee787]">{cmd.command}</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 显示 boltArtifact 结尾后的文本内容 */}
      {postArtifactContent && (
        <div className="text-gray-900 dark:text-gray-100 leading-relaxed prose dark:prose-invert prose-sm max-w-none">
          <ReactMarkdown
            components={{
              blockquote({ children }) {
                return (
                  <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 my-2 text-sm text-gray-600 dark:text-gray-400">
                    {children}
                  </blockquote>
                );
              },
            }}
          >
            {postArtifactContent}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
};
