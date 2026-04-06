export interface EmailMessage {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface EmailTransporter {
  send(message: EmailMessage): Promise<EmailSendResult>;
  verify(): Promise<boolean>;
}
