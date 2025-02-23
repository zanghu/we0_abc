import { v4 as uuidv4 } from "uuid";
import { MAX_TOKENS, Messages } from "../action";
import { streamResponse } from "../utils/streamResponse";
import { estimateTokens } from "@/utils/tokens";
import { buildMaxSystemPrompt, buildSystemPrompt } from "../utils/promptBuilder";
import { determineFileType } from "../utils/fileTypeDetector";
import { getHistoryDiff } from "../utils/diffGenerator";
import { handleTokenLimit } from "../utils/tokenHandler";
import { processFiles } from "../utils/fileProcessor";
import { screenshotOne } from "../utils/screenshotone";

export async function handleBuilderMode(
  messages: Messages,
  model: string,
  userId: string | null,
): Promise<Response> {
  const historyMessages = JSON.parse(JSON.stringify(messages));
  // 目录树搜索

  const { files, allContent } = processFiles(messages);
    // 检查最后一条消息是否包含网址
  const lastMessage = messages[messages.length - 1];
  if (lastMessage.role === 'user' && lastMessage.content.startsWith('#')) {
    const urlMatch = lastMessage.content.match(/https?:\/\/[^\s]+/);
    if (urlMatch) {
      try {
        // 调用截图函数
        const imageUrl = await screenshotOne(urlMatch[0]);
        
        // 将截图作为新消息添加到对话中
        messages.splice(messages.length - 1, 0, {
          id: uuidv4(),
          role: "user",
          content: `1:1还原这个页面`,
          experimental_attachments: [{
            name: uuidv4(),
            contentType: 'image/png',
            url: imageUrl,
          }],
        });
      } catch (error) {
        console.error('Screenshot capture failed:', error);
      }
    }
  }
  const filesPath = Object.keys(files);
  let nowFiles = files;

  const type = determineFileType(filesPath);
  if (estimateTokens(allContent) > MAX_TOKENS) {
    nowFiles = await handleTokenLimit(messages, files, filesPath);
    const historyDiffString = getHistoryDiff(historyMessages, filesPath, nowFiles);
    messages[messages.length - 1].content =   buildMaxSystemPrompt(filesPath, type, nowFiles, historyDiffString) + '注意看上面的要求,要按需求，写代码的时候，不要给我markdown啊，输出一定要xml!! 强调！; 我的问题是：' + messages[messages.length - 1].content
  } else {
    messages[messages.length - 1].content =  buildSystemPrompt(type) + '注意看上面的要求,要按需求，写代码的时候，不要给我markdown啊，输出一定要xml!! 强调！; 我的问题是：' + messages[messages.length - 1].content
  }

  return await streamResponse(messages, model, userId);
} 