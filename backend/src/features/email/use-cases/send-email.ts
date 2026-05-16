import type {
  EmailMessage,
  EmailSendResult,
  EmailTransporter,
} from "../domain/types.js";

export class SendEmailUseCase {
  constructor(private transporter: EmailTransporter) {}

  async execute(message: EmailMessage): Promise<EmailSendResult> {
    if (!message.to || !message.subject) {
      console.warn(`[EMAIL_SKIP] Validation failed: missing to or subject (to=${message.to ?? "empty"})`);
      return {
        success: false,
        error: "Recipient (to) and subject are required",
      };
    }

    if (!message.text && !message.html) {
      console.warn(`[EMAIL_SKIP] Validation failed: no body provided for to=${message.to}`);
      return {
        success: false,
        error: "Either text or html body is required",
      };
    }

    console.log(`[EMAIL_SEND] Sending email to=${message.to} subject="${message.subject}"`);
    return this.transporter.send(message);
  }
}
