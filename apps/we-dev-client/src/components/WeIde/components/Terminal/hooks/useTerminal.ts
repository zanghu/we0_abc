import { useEffect, useState, useCallback, useRef } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { useCommandHistory } from './useCommandHistory';
import { executeCommand, waitCommand } from '../utils/commands';
import { getTerminalTheme } from '../utils/theme';
import { useFileStore } from '../../../stores/fileStore';
import { Terminal } from '../index';

const lightTheme = {
  foreground: '#000000',
  background: 'ffffff',
  cursor: '#000000',
  selection: '#add6ff80',
  black: '#000000',
  red: '#e51400',
  green: '#008000',
  yellow: '#795e25',
  blue: '#0451a5',
  magenta: '#811f3f',
  cyan: '#007acc',
  white: '#000000',
  brightBlack: '#000000',
  brightRed: '#cd3131',
  brightGreen: '#008000',
  brightYellow: '#795e25',
  brightBlue: '#0451a5',
  brightMagenta: '#811f3f',
  brightCyan: '#007acc',
  brightWhite: '#000000',
};

const darkTheme = {
  foreground: '#e4e4e4',
  background: '#1e1e1e',
  cursor: '#efefef',
  selection: '#29b8db',
  black: '#000000',
  red: '#f14c4c',
  green: '#23d18b',
  yellow: '#f5f543',
  blue: '#3b8eea',
  magenta: '#d670d6',
  cyan: '#000000',
  white: '#e4e4e4',
  brightBlack: '#000000',
  brightRed: '#f14c4c',
  brightGreen: '#23d18b',
  brightYellow: '#f5f543',
  brightBlue: '#3b8eea',
  brightMagenta: '#000000',
  brightCyan: '#29b8db',
  brightWhite: '#000000',
};

export function useTerminal(containerRef: React.RefObject<HTMLDivElement>) {
  const [isReady, setIsReady] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const terminalRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const terminalOpen = useRef<boolean>(false);
  const { files, addError } = useFileStore();

  const { history, addToHistory, getPrevious, getNext } = useCommandHistory();

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
      theme: isDark ? darkTheme : lightTheme,
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
  }, [handleCommand, writePrompt, addToHistory, isDark]);

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

  // 监听系统主题变化
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDark(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => {
      setIsDark(e.matches);
      if (terminalRef.current) {
        terminalRef.current.options.theme = e.matches ? darkTheme : lightTheme;
      }
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return { isReady };
}