import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";
import {
  streamText as _streamText,
  convertToCoreMessages,
  generateObject,
  wrapLanguageModel,
  extractReasoningMiddleware
} from "ai";
import type { LanguageModel, Message } from "ai";
import { modelConfig } from "../model/config";
import { createDeepSeek } from "@ai-sdk/deepseek";


export const MAX_TOKENS = 5000;

export type StreamingOptions = Omit<Parameters<typeof _streamText>[0], "model">;

export function getOpenAIModel(baseURL: string, apiKey: string, model: string) {
   const provider = modelConfig.find(item => item.modelKey === model)?.provider;
  if (provider === "deepseek") {
    const deepseek = createDeepSeek({
      apiKey,
      baseURL,
    });
    const wrapModel =  wrapLanguageModel({
      model: deepseek(model),
      middleware: extractReasoningMiddleware({ tagName: 'think' }),
    })
    return wrapModel;
  }

  const openai = createOpenAI({
    baseURL,
    apiKey,
  });

  return openai(model);
}

export type Messages = Message[];

const defaultModel = getOpenAIModel(
  process.env.THIRD_API_URL,
  process.env.THIRD_API_KEY,
  "claude-3-5-sonnet-20240620"
) as LanguageModel;

export async function generateObjectFn(messages: Messages) {
  return generateObject({
    model: getOpenAIModel(
      process.env.THIRD_API_URL,
      process.env.THIRD_API_KEY,
      "gpt-4o-mini"
    ) as LanguageModel,
    schema: z.object({
      files: z.array(z.string()),
    }),
    messages: convertToCoreMessages(messages),
  });
}

export function streamTextFn(
  messages: Messages,
  options?: StreamingOptions,
  modelKey?: string
) {
  // 根据模型名称找对应的key不然就使用默认的,方便拓展其他产商模型
  const { apiKey = process.env.THIRD_API_KEY, apiUrl = process.env.THIRD_API_URL } = modelConfig.find(
    (item) => item.modelKey === modelKey
  );
  const model = getOpenAIModel(
    apiUrl,
    apiKey,
    modelKey || "claude-3-5-sonnet-20240620",
  ) as LanguageModel;
  return _streamText({
    model: model || defaultModel,
    maxTokens: MAX_TOKENS,
    messages: convertToCoreMessages(messages),
    ...options,
  });
}
