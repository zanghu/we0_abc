import { useEffect, useRef } from 'react';
import Prism from 'prismjs';
import { cn } from '../../../utils/cn';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/plugins/line-numbers/prism-line-numbers';
import { CodeHighlighterProps } from '../types';

export function CodeHighlighter({ 
  code, 
  language,
  scrollTop,
  scrollLeft 
}: CodeHighlighterProps) {
  const preRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    if (preRef.current) {
      Prism.highlightElement(preRef.current);
    }
  }, [code]);

  return (
    <pre
      ref={preRef}
      className={cn(
        `language-${language}`,
        'line-numbers',
        'editor-pre',
        'absolute inset-0 m-0 p-4',
        'bg-transparent',
        'font-mono text-sm leading-relaxed',
        'pointer-events-none',
        'w-max min-w-full'
      )}
      style={{
        transform: `translate(-${scrollLeft}px, -${scrollTop}px)`
      }}
    >
      <code className={`language-${language}`}>{code}</code>
    </pre>
  );
}