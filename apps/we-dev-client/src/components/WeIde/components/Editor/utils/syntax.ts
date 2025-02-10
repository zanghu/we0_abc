import Prism from 'prismjs';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';

// Define JSX grammar
Prism.languages.jsx = Prism.languages.extend('javascript', {
  'tag': {
    pattern: /<\/?(?:[\w.:-]+\s*(?:\s+(?:[\w.:$-]+(?:=(?:"(?:\\[^]|[^\\"])*"|'(?:\\[^]|[^\\'])*'|[^\s{'">=]+|\{(?:\{(?:\{[^{}]*\}|[^{}])*\}|[^{}])+\}))?|\{\s*\.{3}\s*[a-z_$][\w$]*(?:\.[a-z_$][\w$]*)*\s*\}))*\s*\/?)?>/i,
    inside: {
      'tag': {
        pattern: /^<\/?[^\s>\/]*/i,
        inside: {
          'punctuation': /^<\/?/,
          'namespace': /^[^\s>\/:]+:/
        }
      },
      'attr-value': {
        pattern: /=(?:"(?:\\[^]|[^\\"])*"|'(?:\\[^]|[^\\'])*'|[^\s'">]+)/i,
        inside: {
          'punctuation': [/^=/, {
            pattern: /^(\s*)["']|["']$/,
            lookbehind: true
          }]
        }
      },
      'punctuation': /\/?>$/,
      'attr-name': {
        pattern: /[^\s>\/]+/,
        inside: {
          'namespace': /^[^\s>\/:]+:/
        }
      }
    }
  },
  'attr-value': {
    pattern: /=(?:"(?:\\[^]|[^\\"])*"|'(?:\\[^]|[^\\'])*'|[^\s'">]+)/i,
    inside: {
      'punctuation': [/^=/, {
        pattern: /^(\s*)["']|["']$/,
        lookbehind: true
      }]
    }
  }
});

// Extend TSX from JSX
Prism.languages.tsx = Prism.languages.extend('jsx', {
  ...Prism.languages.typescript
});

export function highlight(code: string, language: string): string {
  const grammar = Prism.languages[language] || Prism.languages.typescript;
  try {
    return Prism.highlight(code, grammar, language);
  } catch (error) {
    console.error('Highlighting error:', error);
    return code;
  }
}

export function getLanguage(fileName: string): string {
  if (fileName.endsWith('.tsx')) return 'tsx';
  if (fileName.endsWith('.jsx')) return 'jsx';
  if (fileName.endsWith('.ts')) return 'typescript';
  if (fileName.endsWith('.js')) return 'javascript';
  if (fileName.endsWith('.css')) return 'css';
  if (fileName.endsWith('.html')) return 'html';
  if (fileName.endsWith('.json')) return 'json';
  return 'typescript';
}