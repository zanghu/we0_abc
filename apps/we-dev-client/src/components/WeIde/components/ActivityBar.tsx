import { Files, Settings, Search, Terminal } from "lucide-react";
import { cn } from "../utils/cn";
import { Tooltip } from "../ui/tooltip";

interface ActivityBarProps {
  activeView: "files" | "search";
  onViewChange: (view: "files" | "search") => void;
  onToggleTerminal: () => void;
}

export function ActivityBar({
  activeView,
  onViewChange,
  onToggleTerminal,
}: ActivityBarProps) {
  return (
    <div className="w-12 bg-[#f3f3f3] dark:bg-[#252526] flex flex-col items-center py-2 border-r border-[#e4e4e4] dark:border-[#1E1E1E]">
      <Tooltip content="文件浏览器" side="right">
        <button
          aria-label="文件浏览器"
          className={cn(
            "p-1.5 rounded-md mb-2 transition-all duration-200 relative group",
            activeView === "files"
              ? "bg-white dark:bg-[#37373D] text-[#424242] dark:text-white"
              : "text-[#616161] dark:text-[#858585] hover:text-[#424242] hover:bg-[#e8e8e8] dark:hover:text-white dark:hover:bg-[#37373D]",
            activeView === "files" &&
              "before:absolute before:left-0 before:top-[20%] before:h-[60%] before:w-[2px] before:bg-[#424242] dark:before:bg-white before:-ml-2"
          )}
          onClick={() => onViewChange("files")}
        >
          <Files className="w-5 h-5" />
        </button>
      </Tooltip>

      <Tooltip content="搜索" side="right">
        <button
          aria-label="搜索"
          className={cn(
            "p-1.5 rounded-md mb-2 transition-all duration-200 relative group",
            activeView === "search"
              ? "bg-white dark:bg-[#37373D] text-[#424242] dark:text-white"
              : "text-[#616161] dark:text-[#858585] hover:text-[#424242] hover:bg-[#e8e8e8] dark:hover:text-white dark:hover:bg-[#37373D]",
            activeView === "search" &&
              "before:absolute before:left-0 before:top-[20%] before:h-[60%] before:w-[2px] before:bg-[#424242] dark:before:bg-white before:-ml-2"
          )}
          onClick={() => onViewChange("search")}
        >
          <Search className="w-5 h-5" />
        </button>
      </Tooltip>

      <Tooltip content="终端" side="right">
        <button
          aria-label="终端"
          className="p-1.5 rounded-md mb-2 transition-all duration-200 text-[#616161] dark:text-[#858585] hover:text-[#424242] hover:bg-[#e8e8e8] dark:hover:text-white dark:hover:bg-[#37373D]"
          onClick={onToggleTerminal}
        >
          <Terminal className="w-5 h-5" />
        </button>
      </Tooltip>

      <div className="flex-grow" />

      <Tooltip content="设置" side="right">
        <button
          aria-label="设置"
          className="p-1.5 rounded-md transition-all duration-200 text-[#616161] dark:text-[#858585] hover:text-[#424242] hover:bg-[#e8e8e8] dark:hover:text-white dark:hover:bg-[#37373D]"
        >
          <Settings className="w-5 h-5" />
        </button>
      </Tooltip>
    </div>
  );
}
