import { v4 as uuidv4 } from "uuid";
import { MAX_TOKENS, Messages } from "../action";
import { streamResponse } from "../utils/streamResponse";
import { estimateTokens } from "@/utils/tokens";
import { buildSystemPrompt } from "../utils/promptBuilder";
import { determineFileType } from "../utils/fileTypeDetector";
import { getHistoryDiff } from "../utils/diffGenerator";
import { handleTokenLimit } from "../utils/tokenHandler";
import { processFiles } from "../utils/fileProcessor";

export async function handleBuilderMode(
  messages: Messages,
  model: string,
  userId: string | null
): Promise<Response> {
  const historyMessages = JSON.parse(JSON.stringify(messages));
  const { files, allContent } = processFiles(messages);
  const filesPath = Object.keys(files);
  let nowFiles = files;

  if (estimateTokens(allContent) > MAX_TOKENS) {
    nowFiles = await handleTokenLimit(messages, files, filesPath);
  }

  const historyDiffString = getHistoryDiff(historyMessages, filesPath, nowFiles);
  const type = determineFileType(filesPath);

  messages.splice(messages.length - 1, 0, {
    id: uuidv4(),
    role: "user",
    content: buildSystemPrompt(filesPath, type, nowFiles, historyDiffString),
  });

  return await streamResponse(messages, model, userId);
} 