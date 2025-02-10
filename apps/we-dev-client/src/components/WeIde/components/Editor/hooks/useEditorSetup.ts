import { useEffect, useMemo, useRef } from "react";
import { EditorView, keymap } from "@codemirror/view";
import { EditorState, Extension } from "@codemirror/state";
import { defaultKeymap, indentWithTab } from "@codemirror/commands";
import { getLanguageExtension } from "../utils/language";
import { editorKeymap } from "../utils/keymap";
import { editorTheme } from "../config/theme";
import { autocompletion, completionKeymap } from "@codemirror/autocomplete";
import {
  createDiffExtension,
  hasDiffContent,
  applyDiffHighlights,
} from "../utils/diff";
import { useEditorStore } from "@/components/WeIde/stores/editorStore";


interface UseEditorSetupProps {
  fileName: string;
  fileContent: string;
  onDocChange: () => void;
  customExtensions?: Extension[];
}

export const useEditorSetup = ({
  fileName,
  fileContent,
  onDocChange,
  customExtensions = [],
}: UseEditorSetupProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView>();
  const prevContentRef = useRef<string>(fileContent);
  const { isDirty } = useEditorStore();
  const contentRef = useRef<{ [key: string]: string }>({});
  const autoParams = useMemo(
    () =>
      autocompletion({
        activateOnTyping: true,
        maxRenderedOptions: 10,
        defaultKeymap: true,
        icons: true,
      }),
    []
  ); // 使用 useMemo 包装


  const extensions = useMemo(() => {
    return [
      createDiffExtension(),
      keymap.of([...defaultKeymap, indentWithTab]),
      keymap.of(editorKeymap),
      getLanguageExtension(fileName),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          if(contentRef.current[fileName] !== update.state.doc.toString()){
            onDocChange();
          }
          contentRef.current[fileName] = update.state.doc.toString();
        }
      }),
      editorTheme,
      autoParams,
    
      ...customExtensions,
    ].filter(Boolean);
  }, [fileName, customExtensions]);

  // 初始化编辑器
  useEffect(() => {
    if (!editorRef.current) return;

    const state = EditorState.create({
      doc: fileContent,
      extensions: extensions,
    });

    const view = new EditorView({
      state,
      parent: editorRef.current,
    });

    viewRef.current = view;

    // 初始化后检查是否需要应用 diff 高亮
    // if (hasDiffContent(fileContent)) {
    //   requestAnimationFrame(() => {
    //     applyDiffHighlights(view);
    //   });
    // }

    return () => view.destroy();
  }, [fileName]);

  // 处理文件内容更新
  useEffect(() => {
    const view = viewRef.current;
    if (!view || fileContent === prevContentRef.current) return;

    if(!isDirty?.[fileName]){
      contentRef.current[fileName] = fileContent;
    }

    view.dispatch({
      changes: {
        from: 0,
        to: view.state.doc.length,
        insert: isDirty?.[fileName] ?  contentRef.current[fileName] : fileContent,
      },
    });
    

    prevContentRef.current = fileContent;
  }, [fileContent, isDirty]);

  return {
    editorRef,
    viewRef,
  };
};
