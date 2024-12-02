import { OpenAI } from 'openai';
import { MessageToolCall, MessageToolCompletion, NewsApiSearchParams, ToolHandler } from "../types.ts";
import { NewsApi } from "../services/news-api.ts";
import { assertCanHandleCall, canHandleToolCall, toMessageToolCompletion } from "./tool-chain.ts";

export const newsTool: OpenAI.Chat.Completions.ChatCompletionTool = {
    type: "function",
    function: {
        "name": "get_current_news_headlines",
        "description": "Retrieves current news headlines based on various search parameters.",
        "parameters": {
          "type": "object",
          "properties": {
            "country": {
              "type": "string",
              "description": "Two-letter country code for the news source"
            },
            "category": {
              "type": "string",
              "description": "Category of the news to fetch",
              "enum": [
                "business",
                "general",
                "health",
                "science",
                "sports",
                "technology"
              ]
            },
            "pageSize": {
              "type": "number",
              "description": "Number of news headlines to retrieve (max 100)"
            },
            "q": {
                "type": "string",
                "description": "Keywords or a phrase to search for"
            }
          },
          "additionalProperties": false,
          "required": ["country"]
        }
    }
}

export class NewsToolHandler implements ToolHandler {
    name = "get_current_news_headlines";
    definition: OpenAI.Chat.Completions.ChatCompletionTool = newsTool;

    constructor(private newsApi: NewsApi)
    {}

    async handle(tool_call: MessageToolCall): Promise<MessageToolCompletion> {
        assertCanHandleCall(this, tool_call);
        const parameters = NewsApiSearchParams.parse(JSON.parse(tool_call.function.arguments));
        const headlines = await this.newsApi.getHeadlines(parameters);
        const content = JSON.stringify(headlines);
        return toMessageToolCompletion(tool_call, content);
    }

    canHandle(tool_call: MessageToolCall) {
        return canHandleToolCall(this, tool_call);
    }
}