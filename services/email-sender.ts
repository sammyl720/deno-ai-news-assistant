import { Resend } from "resend";
import { EmailSubscriptionConfigurationType, SendEmailContentType, SendEmailParamsType } from "../types.ts";

export class EmailSender {
    private resend: Resend;
    constructor(resendApiKey: string) {
        this.resend = new Resend(resendApiKey);
    }

    async sendEmail(params: SendEmailParamsType) {
        const { data, error } = await this.resend.emails.send(params);
        return {
            data: data,
            success: !!data,
            error: error
        }
    }
}

export class EmailSubscriptionList {
    constructor(
        private emailSender: EmailSender,
        private config: EmailSubscriptionConfigurationType
    ) {}

    async sendEmail(params: SendEmailContentType) {
        const { data, error } = await this.emailSender.sendEmail({
            ...this.config,
            ...params
        });
        
        console.log('email sent - ', data, error);
        return {
            data: data,
            success: !!data,
            error: error
        }
    }
}