interface ParsedMessage {
  content: string;
  files?: Record<string, string>;
}

// 预编译正则表达式
const ARTIFACT_REGEX = /<boltArtifact[^>]*>([\s\S]*?)<\/boltArtifact>/;
const BOLT_ACTION_REGEX =
  /<boltAction type="file" filePath="([^"]+)">([\s\S]*?)<\/boltAction>/g;

export function parseMessage(content: string): ParsedMessage {
  // 如果内容不包含关键字，快速返回
  if (!content.includes("<boltArtifact")) {
    return { content };
  }

  try {
    // 提取 boltArtifact 内容
    const match = content.match(ARTIFACT_REGEX);
    if (!match) {
      return { content };
    }

    const artifactContent = match[1].trim();
    const files: Record<string, string> = {};

    // 使用字符串替换而不是正则匹配来提取文件内容
    let boltMatch;
    let startIndex = 0;

    // 重置正则表达式的 lastIndex
    BOLT_ACTION_REGEX.lastIndex = 0;

    while ((boltMatch = BOLT_ACTION_REGEX.exec(artifactContent)) !== null) {
      const [_, filePath, fileContent] = boltMatch;

      // 使用 Object.assign 而不是展开运算符
      if (fileContent) {
        files[filePath] = fileContent.trim();
      }

      startIndex = BOLT_ACTION_REGEX.lastIndex;
    }

    // 使用模板字符串而不是字符串拼接
    const fileKeys = Object.keys(files);
    const newContent = content.replace(
      ARTIFACT_REGEX,
      `已经修改好了的目录${JSON.stringify(fileKeys)}`
    );

    return {
      content: newContent.trim(),
      files,
    };
  } catch (error) {
    console.error("Error parsing message:", error);
    return { content };
  }
}
