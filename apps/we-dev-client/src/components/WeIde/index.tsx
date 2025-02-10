import { useState, useEffect, useRef } from "react";
import { ActivityBar } from "./components/ActivityBar";
import { FileExplorer } from "./features/file-explorer";
import { Search } from "./features/search";
import { Terminal } from "./components/Terminal";
import { Editor } from "./components/Editor";
import { EditorTabs } from "./components/EditorTabs";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { useEditorStore } from "./stores/editorStore";

export default function WeIde() {
  const [activeTab, setActiveTab] = useState("");
  const [showTerminal, setShowTerminal] = useState(true);
  const [openTabs, setOpenTabs] = useState<string[]>([]);
  const { setDirty } = useEditorStore();
  const [activeView, setActiveView] = useState<"files" | "search">("files");
  const [currentLine, setCurrentLine] = useState<number | undefined>();
  const hisotrRef = useRef<string>('');

  useEffect(() => {
    const handleEmit = (
      event: CustomEvent<{ path: string; line?: number }>
    ) => {
      handleFileSelectAiFile(event.detail.path, event.detail.line);
    };

    window.addEventListener("openFile", handleEmit as EventListener);
    return () => {
      window.removeEventListener("openFile", handleEmit as EventListener);
    };
  }, [openTabs]);
  
  const handleFileSelectAiFile = (path: string, line?: number) => {
    setActiveTab(path);
    setCurrentLine(line);
    if (!openTabs.includes(path)) {
      const newTabs = [...openTabs];
      newTabs[0] = path;
      setOpenTabs(newTabs);

    }
    setDirty(path, false);
  };

  const handleFileSelect = (path: string, line?: number) => {
    setActiveTab(path);
    setCurrentLine(line);
    if (!openTabs.includes(path)) {
      setOpenTabs([...openTabs, path]);
    }
  };

  const handleTabClose = (tab: string) => {
    const newTabs = openTabs.filter((t) => t !== tab);
    setOpenTabs(newTabs);
    if (activeTab === tab && newTabs.length > 0) {
      setActiveTab(newTabs[0]);
    }
  };

  const handleCloseAll = () => {
    setOpenTabs([]);
    setActiveTab("");
  };

  return (
    <div
      style={{
        borderRadius: "8px",
        borderTopRightRadius: "0px",
        borderTopLeftRadius: "0px",
      }}
      className="h-full w-full bg-white dark:bg-[#1e1e1e] text-[#333] dark:text-gray-300 flex overflow-hidden border border-[#e4e4e4] dark:border-[#333]"
    >
      <ActivityBar
        activeView={activeView}
        onViewChange={setActiveView}
        onToggleTerminal={() => setShowTerminal(!showTerminal)}
      />

      <PanelGroup direction="horizontal">
        <Panel
          defaultSize={25}
          minSize={16}
          maxSize={30}
          className="flex-shrink-0 border-r border-[#e4e4e4] dark:border-[#333]"
        >
          {activeView === "files" ? (
            <FileExplorer onFileSelect={handleFileSelect} />
          ) : (
            <Search onFileSelect={handleFileSelect} />
          )}
        </Panel>

        <PanelResizeHandle className="w-1 hover:bg-[#e8e8e8] dark:hover:bg-[#404040] transition-colors cursor-col-resize" />

        <Panel className="min-w-0">
          <PanelGroup direction="vertical">
            <Panel className="flex flex-col min-h-0">
              <EditorTabs
                openTabs={openTabs}
                activeTab={activeTab}
                onTabSelect={setActiveTab}
                onTabClose={handleTabClose}
                onCloseAll={handleCloseAll}
              />
              <div className="flex-1 overflow-hidden bg-[#ffffff] dark:bg-[#1e1e1e]">
                {activeTab && (
                  <Editor fileName={activeTab} initialLine={currentLine} />
                )}
              </div>
            </Panel>

            {showTerminal && (
              <>
                <PanelResizeHandle className="h-1 hover:bg-[#e8e8e8] dark:hover:bg-[#404040] transition-colors cursor-row-resize" />
                <Panel
                  defaultSize={30}
                  minSize={10}
                  maxSize={80}
                  style={{ display: "flex", flexDirection: "column" }}
                  className="bg-[#f3f3f3] dark:bg-[#1e1e1e] border-t border-[#e4e4e4] dark:border-[#333]"
                >
                  <Terminal onClose={() => setShowTerminal(false)} />
                </Panel>
              </>
            )}
          </PanelGroup>
        </Panel>
      </PanelGroup>
    </div>
  );
}
