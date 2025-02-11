import { useEffect, useState, useCallback, useRef } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { useCommandHistory } from './useCommandHistory';
import { executeCommand, waitCommand } from '../utils/commands';
import { useFileStore } from '../../../stores/fileStore';
import useThemeStore from '@/stores/themeSlice';

// VSCode 风格的亮色主题
const lightTheme = {
  foreground: '#000000',
  curosr: '#000000',
  background: '#fefefe',
};

// VSCode 风格的暗色主题
const darkTheme = {
  background: '#1e1e1e',
  foreground: '#ffffff',
};

export function useTerminal(containerRef: React.RefObject<HTMLDivElement>) {
  const [isReady, setIsReady] = useState(false);
    const { isDarkMode, toggleTheme, setTheme } = useThemeStore();
  const terminalRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const { files, addError } = useFileStore();

  const { addToHistory } = useCommandHistory();

  const writePrompt = useCallback(() => {
    if (terminalRef.current) {
      terminalRef.current.write('\r\n$ ');
    }
  }, []);

  const handleCommand = useCallback(async (command: string) => {
    if (!terminalRef.current) return;

    const result = await executeCommand(command);

    result.output.forEach(line => {
      terminalRef.current?.writeln(line);
    });
    writePrompt();
  }, [writePrompt]);

  useEffect(() => {
    if (!containerRef.current) return;

    const term = new XTerm({
      cursorBlink: true,
      convertEol: true,
      theme: isDarkMode ? darkTheme : lightTheme,
      fontSize: 12,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      fontWeight: '500',
      letterSpacing: 0,
      lineHeight: 1.4,
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();

    term.loadAddon(fitAddon);
    term.loadAddon(webLinksAddon);

    terminalRef.current = term;
    fitAddonRef.current = fitAddon;

    term.open(containerRef.current);
    fitAddon.fit();

    term.writeln('\x1b[1;32mWelcome to Terminal\x1b[0m');
    term.writeln('Type \x1b[1;34mhelp\x1b[0m for a list of commands\n');
    term.write('$ ');
    setIsReady(true);
    waitCommand(terminalRef.current, addError)
    // term.onKey(handleKey);

    term.onResize(({ cols, rows }) => {
      if ((window as any)?.electron?.ipcRenderer) {
        (window as any).electron.ipcRenderer.invoke('terminal:resize', { cols, rows });
      }
    });

    const handleResize = () => {
      if (fitAddonRef.current) {
        fitAddonRef.current.fit();

        if ((window as any)?.electron?.ipcRenderer) {
          // @ts-ignore
          const { cols, rows } = term.options;
          (window as any).electron.ipcRenderer.invoke('terminal:resize', cols, rows);
        }
      }
    };

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(containerRef.current);

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
      term.dispose();
      terminalRef.current = null;
      fitAddonRef.current = null;
    };
  }, [handleCommand, writePrompt, addToHistory, isDarkMode]);

  useEffect(() => {
    if (fitAddonRef.current && containerRef.current) {
      const handleResize = () => {
        fitAddonRef.current?.fit();
        if (terminalRef.current && (window as any)?.electron?.ipcRenderer) {
          const { cols, rows } = terminalRef.current.options;
          (window as any).electron.ipcRenderer.invoke('terminal:resize', cols, rows);
        }
      };
      handleResize();
    }
  }, [fitAddonRef.current]);

  // 监听主题变化
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.options.theme = isDarkMode ? darkTheme : lightTheme;
    }
  }, [isDarkMode]);

  return { isReady };
}