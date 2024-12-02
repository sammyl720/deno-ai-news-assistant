import { MessageHandler } from "../services/message-handler.ts";

export async function recordChat(messageHandler: MessageHandler) {
    const filePath = `./chat-logs/${new Date().toISOString()}.json`;
    const dirPath = filePath.substring(0, filePath.lastIndexOf("/"));
    await Deno.mkdir(dirPath, { recursive: true });
    await Deno.writeTextFile(filePath, JSON.stringify(messageHandler.getMessages(), null, 2));

    return `Chat saved to ${filePath}`; 
}