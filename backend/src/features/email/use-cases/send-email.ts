import type {
  EmailMessage,
  EmailSendResult,
  EmailTransporter,
} from "../domain/types.js";

export class SendEmailUseCase {
  constructor(private transporter: EmailTransporter) {}

  async execute(message: EmailMessage): Promise<EmailSendResult> {
    if (!message.to || !message.subject) {
      return {
        success: false,
        error: "Recipient (to) and subject are required",
      };
    }

    if (!message.text && !message.html) {
      return {
        success: false,
        error: "Either text or html body is required",
      };
    }

    return this.transporter.send(message);
  }
}
