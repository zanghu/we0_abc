import { typeEnum, getSystemPrompt } from "../prompt";

export function buildMaxSystemPrompt(
  filesPath: string[], 
  type: typeEnum, 
  files: Record<string, string>, 
  diffString: string
): string {
  return `当前文件目录树：${filesPath.join("\n")}\n\n,你只能修改目录树里面的内容，要求：${getSystemPrompt(type)}
当前需求文件内容:\n${JSON.stringify(files)}${diffString ? `,diff:\n${diffString}` : ""}`;
} 

export function buildSystemPrompt(
  type: typeEnum, 
): string {
  return `${getSystemPrompt(type)}`;
} 