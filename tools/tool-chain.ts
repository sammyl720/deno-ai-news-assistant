import { MessageToolCall, MessageToolCompletion, ToolHandler } from "../types.ts";

export class ToolChain implements ToolHandler {
    private toolHandlers: ToolHandler[] = [];
    readonly name = 'aggregate_tool_handler';

    addToolHandler(tool_handler: ToolHandler) {
        this.assertToolHandlerDoesNotExist(tool_handler);
        this.assertToolHandlerHasDefinitions(tool_handler);
        this.toolHandlers.push(tool_handler);
        return this;
    }

    getTools() {
        return this.toolHandlers.map(handler => handler.definition).filter(tool => !!tool);
    }

    handle(tool_call: MessageToolCall): Promise<MessageToolCompletion> | MessageToolCompletion {
        const handler = this.getHandler(tool_call);
        
        if (!handler) {
            return this.handleNoMatch(tool_call);
        }

        return handler.handle(tool_call);
    };

    canHandle(tool_call: MessageToolCall) {
        return !!this.getHandler(tool_call);
    };

    private getHandler(tool_call: MessageToolCall) {
        return this.toolHandlers.find(handler => handler.canHandle(tool_call));
    }

    private handleNoMatch(tool_call: MessageToolCall) {
        return toMessageToolCompletion(
            tool_call, 
            JSON.stringify({ error: `No tool with the name of ${tool_call.function.name} found`}));
    }

    private assertToolHandlerDoesNotExist(tool_handler: ToolHandler) {
        if (this.toolHandlers.some(handler => handler.name === tool_handler.name)) {
            throw new Error(`Handler with a name of ${tool_handler.name} already is registered`);
        }
    }

    private assertToolHandlerHasDefinitions(tool_handler: ToolHandler) {
        if (!tool_handler.definition) {
            throw new Error(`Toolhandler (${tool_handler.name}) must have it's definitions set to be registered.`);
        }
    }
}

export function toMessageToolCompletion(tool_call: MessageToolCall, content: string): MessageToolCompletion {
    return {
        role: 'tool',
        tool_call_id: tool_call.id,
        content
    }
}

export function canHandleToolCall(handler: ToolHandler, tool_call: MessageToolCall) {
    return handler.name === tool_call.function.name;
}

export function assertCanHandleCall(handler: ToolHandler, tool_call: MessageToolCall) {
    if (!canHandleToolCall(handler, tool_call))
    {
        throw new Error(`ToolHandler with the name of ${handler.name} cannot handle tool call for the name of ${tool_call.function.name}.`)
    }
}