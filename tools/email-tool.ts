import { OpenAI } from 'openai';
import { MessageToolCall, MessageToolCompletion, SendEmailContentParams, ToolHandler } from "../types.ts";
import { assertCanHandleCall, canHandleToolCall, toMessageToolCompletion } from "./tool-chain.ts";
import { EmailSubscriptionList } from "../services/email-sender.ts";

const from = "AI News <ainews@shmuelleider.com>";
const subcribers = ["sammyl720@gmail.com", "sam.leider@hotmail.com"];

export const emailTool: OpenAI.Chat.Completions.ChatCompletionTool = {
    type: "function",
    function: {
        "name": "send_email",
        "description": "Sends emails to subscribed users",
        "strict": true,
        "parameters": {
          "type": "object",
          "required": [
            "subject",
            "html"
          ],
          "properties": {
            "subject": {
              "type": "string",
              "description": "The subject line for the email"
            },
            "html": {
              "type": "string",
              "description": "The HTML content of the email"
            }
          },
          "additionalProperties": false
        }
      }
}

export class EmailToolHandler implements ToolHandler {
  name = 'send_email';
  definition: OpenAI.Chat.Completions.ChatCompletionTool = emailTool;
  
  constructor(private emailSender: EmailSubscriptionList) {}
  async handle(tool_call: MessageToolCall): Promise<MessageToolCompletion> {
    assertCanHandleCall(this, tool_call);
    const parameters = SendEmailContentParams.parse(JSON.parse(tool_call.function.arguments))
    const result = await this.emailSender.sendEmail({
        ...parameters,
    })

    const content = JSON.stringify({
        ...result,
        message: result.data ? `Email sent successfully.` : `Could not send email.`
    });

    return toMessageToolCompletion(tool_call, content);
  }

  canHandle(tool_call: MessageToolCall) {
    return canHandleToolCall(this, tool_call);
  }

}