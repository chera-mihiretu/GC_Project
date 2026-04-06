import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import type {
  EmailMessage,
  EmailSendResult,
  EmailTransporter,
} from "../domain/types.js";

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
}

export function loadSmtpConfig(): SmtpConfig {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM;

  if (!host || !port || !user || !pass || !from) {
    throw new Error(
      "Missing required SMTP environment variables: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM",
    );
  }

  return {
    host,
    port: Number(port),
    secure: port === "465",
    user,
    pass,
    from,
  };
}

export class NodemailerTransporter implements EmailTransporter {
  private transporter: Transporter;
  private from: string;

  constructor(config: SmtpConfig) {
    this.from = config.from;
    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.pass,
      },
    });
  }

  async send(message: EmailMessage): Promise<EmailSendResult> {
    try {
      const info = await this.transporter.sendMail({
        from: this.from,
        to: message.to,
        subject: message.subject,
        text: message.text,
        html: message.html,
      });

      return { success: true, messageId: info.messageId };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown email send error";
      console.error("Email send failed:", errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  async verify(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch {
      return false;
    }
  }
}
