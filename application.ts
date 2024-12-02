import { MessageToolCall, MessageToolCompletion } from "./types.ts";
import { CompletionMessage, MessageHandler } from "./services/message-handler.ts";
import { ToolChain } from "./tools/tool-chain.ts";
import OpenAI from "openai";
import z from 'zod';

export class Application {
    constructor(
        private openai: OpenAI,
        private toolChain: ToolChain, 
        private model: string = "gpt-4o") 
    {
    }

    async run(messageHandler: MessageHandler): Promise<MessageHandler> {
        const lastMessage = messageHandler.getLastMessage();

        if (!lastMessage || this.shouldQuit(lastMessage)) {
            return messageHandler;
        }
        else if (lastMessage.role === 'system')
        {
            messageHandler.addMessage({
                role: 'assistant',
                content: "Hello, How can I help you today? "
            });
            return this.run(messageHandler);
        } 
        else if (lastMessage.role === 'assistant' && typeof lastMessage.content === 'string')
        {
            const message = this.promptUser(lastMessage.content);
            messageHandler.addMessage(message);
            return this.run(messageHandler);
        }
        
        const response = await this.runMessages(messageHandler);
        const choice = response.choices[0];
        messageHandler.addMessage(choice.message);

        if(choice.finish_reason === 'tool_calls') 
        {
            const tool_calls = choice.message.tool_calls ?? [];
            const resolvedToolCalls = (await Promise.allSettled(tool_calls.map(tool_call => this.handleToolCall(tool_call)))).filter(settled => settled.status === 'fulfilled').map(settled => settled.value);
            messageHandler.addMessages(resolvedToolCalls);
        }

        return this.run(messageHandler);
    }

    promptUser(assistantMessage: string): CompletionMessage {
        console.log(`Assistant: ${assistantMessage}`);
        const content = z.string()
            .default('quit')
            .transform(value => {
                const trimmed = value.trim();
                return trimmed ? trimmed : 'quit'
            }).parse(prompt("User: "));
        return {
            role: 'user',
            content: content
        }
    }

    shouldQuit(message: CompletionMessage): boolean {
      return message.role === 'user' && 
        typeof message.content === 'string' &&
        ['exit','q','quit', 'escape'].includes(message.content.trim().toLowerCase());
    }

    shouldCompleteOnCall(tool_calls: MessageToolCall[] | undefined) {
      return !!tool_calls?.length && tool_calls.some(tool_call => tool_call.function.name === 'send_email');
    }

    private handleToolCall(tool_call: MessageToolCall): Promise<MessageToolCompletion> | MessageToolCompletion {
        try {
            return this.toolChain.handle(tool_call);
        } catch (error) {
            return {
                role: 'tool',
                tool_call_id: tool_call.id,
                content: JSON.stringify(error)
            }
        }
    }

    private async runMessages(messageHandler: MessageHandler) {
        return await this.openai.chat.completions.create({
            model: this.model,
            tools: this.toolChain.getTools(),
            messages: messageHandler.getMessages(),
        });
    }
}