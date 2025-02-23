import { useEffect, useRef, useState } from 'react';
import { Terminal as TerminalIcon, X, SquarePlus } from 'lucide-react';
import { useTerminal } from './hooks/useTerminal';
import { cn } from '../../utils/cn';
import 'xterm/css/xterm.css';
import './styles.css';

interface TerminalProps {
  terminalCount: number;
  setTerminalCount: React.Dispatch<React.SetStateAction<number>>;
}

function TerminalTab({ containerRef, selectId, tabId, setSelectId, onClose }) {

  const { isReady } = useTerminal(containerRef);

  return (
    <div 
      className={cn(
        "flex items-center px-4 py-1.5 cursor-pointer transition-colors duration-200",
        "border-b border-[#e5e5e5] dark:border-[#252525]",
        tabId === selectId 
          ? "bg-[#ffffff] dark:bg-[#37373d] text-[#424242] dark:text-white" 
          : "bg-[#f5f5f5] dark:bg-[#252526] text-[#616161] dark:text-[#858585] hover:bg-[#e8e8e8] dark:hover:bg-[#2d2d2d]"
      )}
      onClick={setSelectId}
    >

      {/* 切换至当前终端的按钮 */}
      <div className="flex items-center">
        <TerminalIcon className={cn(
          "w-3 h-3 mr-2 transition-colors",
          isReady 
            ? "text-green-500 dark:text-green-400" 
            : "text-yellow-500 dark:text-yellow-400"
        )} />
        <span className={cn(
          "text-xs font-medium",
          tabId === selectId
            ? "text-[#424242] dark:text-white"
            : "text-[#616161] dark:text-[#858585]"
        )}>
          Terminal {!isReady && "(Initializing...)"}
        </span>
      </div>

      {/* 关闭当前终端的按钮 */}
      <button
        onClick={onClose}
        className={cn(
          "p-1 rounded transition-colors ml-auto",
          "hover:bg-[#e5e5e5] dark:hover:bg-[#404040]",
          "group"
        )}
      >
        <X className={cn(
          "w-3 h-3",
          "text-[#616161] dark:text-[#858585]",
          "group-hover:text-[#424242] dark:group-hover:text-white"
        )} />
      </button>
    </div>
  )

}

function TerminalItem({ containerRef, tabId, selectId }) {
  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-hidden terminal-container bg-white dark:bg-[#1e1e1e] px-2 py-1"
      style={{
        display: tabId === selectId ? "block" : "none"
      }}
    />
  )
}

export function Terminal({ terminalCount, setTerminalCount }: TerminalProps) {
  const [selectId, setSelectId] = useState(0)
  const [nextId, setNextId] = useState(terminalCount)
  const [items, setItems] = useState(
    Array.from({ length: terminalCount }, (_, index) => ({
      id: index,
      ref: { current: null } // useRef<HTMLDivElement>(null)
    }))
  )

  // 处理关闭事件
  const handleClose = (id) => {
    setTerminalCount(terminalCount - 1)
    setItems((prevItems) => prevItems.filter((item) => item.id !== id));
  };

  // 添加一个终端
  const addTerminal = () => {
    const newItem = {
      id: nextId, // 自增 id
      ref: { current: null } // useRef<HTMLDivElement>(null),
    };
    setTerminalCount(terminalCount + 1)
    setItems((prevItems) => [...prevItems, newItem]);
    setNextId((prevId) => prevId + 1); // 自增 id
  }


  return (
    <div className={`w-full h-full flex flex-col`}>

      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: "4px",
        }}
      >
        {items.map((item) => (
          <TerminalTab
            key={item.id}
            containerRef={item.ref}
            selectId={selectId}
            tabId={item.id}
            setSelectId={() => { setSelectId(item.id) }}
            onClose={() => { handleClose(item.id) }}
          />
        ))}

        <SquarePlus className='w-4 h-4 cursor-pointer' onClick={addTerminal} />
      </div>

      {/* 这个 ref 才是这个终端的本体 */}
      {items.map((item) => (
        <TerminalItem key={item.id} containerRef={item.ref} tabId={item.id} selectId={selectId}
        />
      ))}



    </div>
  );
}