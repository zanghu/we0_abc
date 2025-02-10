import {
  EditorView,
  Decoration,
  DecorationSet,
  WidgetType,
} from "@codemirror/view";
import { StateEffect, StateField, Extension } from "@codemirror/state";
import { keymap } from "@codemirror/view";
import { createDiffButtons } from "../components/DiffButtons";

// 类型定义
interface DiffRange {
  from: number;
  to: number;
  type: "add" | "delete";
  isEmptyLine?: boolean;
}

interface DiffBlock {
  search: { start: number; end: number };
  replace: { start: number; end: number };
}

// 常量定义
const DIFF_MARKERS = {
  SEARCH: "<<<<<<< SEARCH",
  SEPARATOR: "=======",
  REPLACE: ">>>>>>> REPLACE",
} as const;

// 装饰器定义
const decorations = {
  add: {
    line: Decoration.line({ class: "diff-add" }),
  },
  delete: {
    line: Decoration.line({ class: "diff-delete" }),
  },
  marker: {
    search: Decoration.mark({ class: "diff-marker diff-marker-search" }),
    separator: Decoration.replace({
      widget: new (class extends WidgetType {
        eq() {
          return false;
        }
        toDOM() {
          return createDiffButtons(
            () => {
              console.log("Accept button clicked");
              // TODO 这里添加接受更改的逻辑，原则上不能侵入到 diff 的逻辑中
            },
            () => {
              console.log("Cancel button clicked");
              // TODO 这里添加取消更改的逻辑
            }
          );
        }
        updateDOM() {
          return false;
        }
        get estimatedHeight() {
          return 24;
        }
        ignoreEvent() {
          return false;
        }
        get lineBreaks() {
          return 0;
        }
        coordsAt() {
          return null;
        }
        destroy() {}
      })(),
    }),
    replace: Decoration.mark({ class: "diff-marker diff-marker-replace" }),
  },
};

export const addDiffHighlight = StateEffect.define<
  DiffRange & { markerType?: "search" | "separator" | "replace" }
>();

export const diffHighlightPlugin = StateField.define({
  create(): DecorationSet {
    return Decoration.none;
  },
  update(highlights, tr) {
    highlights = tr.docChanged ? highlights.map(tr.changes) : highlights;

    const newDecorations: any[] = [];
    for (const effect of tr.effects) {
      if (effect.is(addDiffHighlight)) {
        const { from, to, type, markerType } = effect.value;
        if (from >= 0 && to <= tr.state.doc.length) {
          if (markerType) {
            newDecorations.push(decorations.marker[markerType].range(from, to));
          } else {
            const line = tr.state.doc.lineAt(from);
            newDecorations.push(
              decorations[type].line.range(line.from, line.from)
            );
          }
        }
      }
    }

    if (newDecorations.length > 0) {
      return Decoration.set(newDecorations, true);
    }

    return highlights;
  },
  provide: (f) => EditorView.decorations.from(f),
});

// 判断是否是 diff 文本
export const hasDiffContent = (content: string) => {
  return (
    content.includes(DIFF_MARKERS.SEARCH) ||
    content.includes(DIFF_MARKERS.REPLACE)
  );
};
const parseDiffBlocks = (doc: string): DiffBlock[] => {
  const lines = doc.split("\n");
  const blocks: DiffBlock[] = [];
  let currentBlock: Partial<DiffBlock> = {};
  let isInSearchBlock = false;
  let lastLineIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.includes(DIFF_MARKERS.SEARCH)) {
      if (blocks.length > 0 && i - lastLineIndex <= 2) {
        currentBlock = blocks.pop()!;
      } else {
        currentBlock = {};
      }
      isInSearchBlock = true;
      currentBlock.search = { start: i + 1, end: -1 };
    } else if (line.includes(DIFF_MARKERS.SEPARATOR) && isInSearchBlock) {
      currentBlock.search!.end = i + 1;
    } else if (line.includes(DIFF_MARKERS.REPLACE) && isInSearchBlock) {
      currentBlock.replace = {
        start: currentBlock.search!.end + 1,
        end: i + 1,
      };
      blocks.push(currentBlock as DiffBlock);
      lastLineIndex = i;
      isInSearchBlock = false;
    } else if (isInSearchBlock && line.trim() === "") {
      // 处理空白行
      if (currentBlock.search && currentBlock.search.end === -1) {
        currentBlock.search.end = i + 1;
      }
    }
  }
  return blocks;
};

const createHighlightEffects = (view: EditorView) => {
  const content = view.state.doc.toString();
  const blocks = parseDiffBlocks(content);
  const effects: StateEffect<
    DiffRange & { markerType?: "search" | "separator" | "replace" }
  >[] = [];

  blocks.forEach((block) => {
    // 标记特殊行
    const searchLine = view.state.doc.line(block.search.start);
    const separatorLine = view.state.doc.line(block.search.end);
    const replaceLine = view.state.doc.line(block.replace.end);

    effects.push(
      addDiffHighlight.of({
        from: searchLine.from,
        to: searchLine.to,
        type: "delete",
        markerType: "search",
      }),
      addDiffHighlight.of({
        from: separatorLine.from,
        to: separatorLine.to,
        type: "delete",
        markerType: "separator",
      }),
      addDiffHighlight.of({
        from: replaceLine.from,
        to: replaceLine.to,
        type: "delete",
        markerType: "replace",
      })
    );

    // 处理删除块中的所有行
    for (let i = block.search.start + 1; i < block.search.end; i++) {
      const line = view.state.doc.line(i);
      effects.push(
        addDiffHighlight.of({
          from: line.from,
          to: line.to,
          type: "delete",
        })
      );
    }

    // 处理添加块中的所有行
    for (let i = block.search.end + 1; i < block.replace.end; i++) {
      const line = view.state.doc.line(i);
      effects.push(
        addDiffHighlight.of({
          from: line.from,
          to: line.to,
          type: "add",
        })
      );
    }
  });

  return effects;
};

export const createDiffExtension = (): Extension => {
  return [
    diffHighlightPlugin,
    EditorView.updateListener.of((update) => {
      // 初始化或内容变更时都检查并应用 diff
      if (update.docChanged || update.startState.doc.length === 0) {
        const content = update.state.doc.toString();
        if (hasDiffContent(content)) {
          applyDiffHighlights(update.view);
        }
      }
    }),
    // 视图初始化的扩展
    EditorView.domEventHandlers({
      // 使用 focusin 事件来确保编辑器已经完全初始化
      focusin: (event, view) => {
        const content = view.state.doc.toString();
        if (hasDiffContent(content)) {
          console.log("focusin 时检测到 diff 内容");
          applyDiffHighlights(view);
        }
      },
    }),
    // 添加自定义回车键处理
    keymap.of([
      {
        key: "Enter",
        run: (view: EditorView) => {
          const content = view.state.doc.toString();

          if (hasDiffContent(content)) {
            view.dispatch(view.state.replaceSelection("\n"));
            return true;
          }
          return false;
        },
        // 提高优先级
        preventDefault: true,
      },
    ]),
  ];
};

// 应用 diff 高亮
export const applyDiffHighlights = (view: EditorView) => {
  const effects = createHighlightEffects(view);
  if (effects.length > 0) {
    view.dispatch({
      effects: effects,
    });
  }
};
