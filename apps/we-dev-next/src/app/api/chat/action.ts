import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";
import {
  streamText as _streamText,
  convertToCoreMessages,
  generateObject,
} from "ai";
import type { LanguageModel, Message } from "ai";

export const MAX_TOKENS = 5000;

export type StreamingOptions = Omit<Parameters<typeof _streamText>[0], "model">;

export function getOpenAIModel(baseURL: string, apiKey: string, model: string) {
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
  modelName?: string
) {
  // todo 根据模型名字选厂商
  const model = getOpenAIModel(
    process.env.THIRD_API_URL,
    process.env.THIRD_API_KEY,
    modelName || "claude-3-5-sonnet-20240620"
  ) as LanguageModel;
  return _streamText({
    model: model || defaultModel,
    maxTokens: MAX_TOKENS,
    messages: convertToCoreMessages(messages),
    ...options,
  });
}
