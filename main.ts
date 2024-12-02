import "jsr:@std/dotenv/load";
import z from "zod";
import { EmailSender, EmailSubscriptionList } from "./services/email-sender.ts";
import { Application } from "./application.ts";
import OpenAI from "openai";
import { MessageHandler } from "./services/message-handler.ts";
import { system_prompt } from "./system-prompt.ts";
import { ToolChain } from "./tools/tool-chain.ts";
import { NewsToolHandler } from "./tools/news-tool.ts";
import { EmailToolHandler } from "./tools/email-tool.ts";
import { recordChat } from "./services/chat-saver.ts";
import { NewsApi } from "./services/news-api.ts";

const newsApiKey = Deno.env.get("NEWS_API_KEY");
const resendApiKey = Deno.env.get("RESEND_API_KEY");
const openAiApiKey = Deno.env.get("OPENAI_API_KEY");

const emailList = z.string()
  .transform(emails => z.array(z.string().email()).parse(emails.split(',')))
  .parse(Deno.env.get("EMAIL_LIST"));

if (!newsApiKey) {
  throw new Error(`Please add your 'NEWS_API_KEY' as a environment variable.`);
}

if (!resendApiKey) {
  throw new Error(`Please add your 'RESEND_API_KEY' as a environment variable.`);
}

if (!openAiApiKey) {
  throw new Error(`Please add your 'OPENAI_API_KEY' as a environment variable.`);
}

const newsApi = new NewsApi(newsApiKey);
const emailSender = new EmailSender(resendApiKey);
const emailSubscriptionList = new EmailSubscriptionList(
  emailSender,
  {
    from: 'Shmuel Leider <dev@shmuelleider.com>',
    to: emailList
  }
)
const openai = new OpenAI({ apiKey: openAiApiKey });
const toolChain = new ToolChain();
toolChain.addToolHandler(new NewsToolHandler(newsApi))
  .addToolHandler(new EmailToolHandler(emailSubscriptionList));
const app = new Application(openai, toolChain);

const messageHandler = new MessageHandler()
.addMessage({ role: 'system', content: system_prompt});

app.run(messageHandler).then((handler) => {
  if (Deno.env.get('SHOULD_RECORD_CHAT') == 'true')
  {
    console.log(`Saving chat.`);
    recordChat(handler).then(console.log).catch(console.error);
  }
}).catch(console.error);