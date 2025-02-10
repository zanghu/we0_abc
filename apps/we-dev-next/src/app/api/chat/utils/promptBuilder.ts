import { typeEnum, getSystemPrompt } from "../prompt";

export function buildSystemPrompt(
  filesPath: string[], 
  type: typeEnum, 
  files: Record<string, string>, 
  diffString: string
): string {
  return `当前文件目录树：${filesPath.join("\n")}\n\n要求：${getSystemPrompt(type)}
当前需求文件内容:\n${JSON.stringify(files)}${diffString ? `,diff:\n${diffString}` : ""}`;
} 