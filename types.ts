import { z } from 'zod';
import OpenAI from "openai";

export const SendEmailContentParams = z.object({
    subject: z.string().min(5).max(100),
    html: z.string()
});

export type SendEmailContentType = z.infer<typeof SendEmailContentParams>;

export const SendEmailParams = SendEmailContentParams.extend({
    from: z.string(),
    to: z.array(z.string().email())
});

export const EmailSubscriptionConfiguration = z.object({
    from: z.string(),
    to: z.array(z.string().email())
});

export type EmailSubscriptionConfigurationType = z.infer<typeof EmailSubscriptionConfiguration>;

export type SendEmailParamsType = z.infer<typeof SendEmailParams>;

export const NewsSource = z.object({
    id: z.union([z.string(), z.null()]),
    name: z.string().optional()
});

export const NewsCategory = z.enum([
    "business", 
    "general", 
    "health", 
    "science",
    "sports",
    "technology"
]).optional();

export const NewsApiSearchParams = z.object({
    country: z.string().min(2).max(2).optional(),
    category: NewsCategory,
    q: z.string().optional(),
    pageSize: z.number().max(100).positive().int().optional(),
    page: z.number().int().positive().optional()
}).optional();

export type NewsApiSearchParamsType = z.infer<typeof NewsApiSearchParams>;

export const NewsArticle = z.object({
    source: NewsSource,
    author: z.string().nullable().optional(),
    title: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    url: z.string().url().nullable().optional(),
    urlToImage: z.string().url().nullable().optional(),
    publishedAt: z.string().datetime().nullable().optional(),
    content: z.string().nullable().optional()
})

export const NewsApiResponse = z.object({
    status: z.enum(["error", "ok"]),
    code: z.string().optional(),
    message: z.string().optional(),
    totalResults: z.number().optional(),
    articles: z.array(NewsArticle).optional()
});

export type NewsApiResponseType = z.infer<typeof NewsApiResponse>;

// Define the input schema
export const inputSchema = z.record(z.union([z.string(), z.number(), z.undefined()]));

// Define the transformation schema
export const transformedSchema = inputSchema.transform((input) => {
  return Object.entries(input)
    .filter(([_, value]) => value !== undefined) // Remove undefined values
    .reduce((acc, [key, value]) => {
      acc[key] = String(value); // Convert numbers to strings
      return acc;
    }, {} as Record<string, string>);
});

export type MessageToolCall = OpenAI.Chat.Completions.ChatCompletionMessageToolCall;
export type MessageToolCompletion = OpenAI.Chat.Completions.ChatCompletionToolMessageParam;
export type ChatCompletionTool = OpenAI.Chat.Completions.ChatCompletionTool;

export interface ToolHandler {
    name: string;
    handle: (tool_call: MessageToolCall) => Promise<MessageToolCompletion> | MessageToolCompletion,
    canHandle: (tool_call: MessageToolCall) => boolean;
    definition?: ChatCompletionTool;
}