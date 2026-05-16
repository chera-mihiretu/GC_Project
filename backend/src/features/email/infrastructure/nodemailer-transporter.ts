import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import type {
  EmailMessage,
  EmailSendResult,
  EmailTransporter,
} from "../domain/types.js";
import { env } from "../../../config/env.js";

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
}

export function loadSmtpConfig(): SmtpConfig {
  const host = env.SMTP_HOST;
  const port = env.SMTP_PORT;
  const user = env.SMTP_USER;
  const pass = env.SMTP_PASS;
  const from = env.SMTP_FROM;

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
    console.log(
      `[EMAIL_INIT] host=${config.host} port=${config.port} secure=${config.secure} user=${config.user} from=${config.from}`,
    );
    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.pass,
      },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
      logger: false,
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  async send(message: EmailMessage): Promise<EmailSendResult> {
    const start = Date.now();
    try {
      const info = await this.transporter.sendMail({
        from: this.from,
        to: message.to,
        subject: message.subject,
        text: message.text,
        html: message.html,
      });

      const elapsed = Date.now() - start;
      console.log(
        `[EMAIL_SENT] to=${message.to} subject="${message.subject}" messageId=${info.messageId} elapsed=${elapsed}ms`,
      );
      return { success: true, messageId: info.messageId };
    } catch (err) {
      const elapsed = Date.now() - start;
      const errorMessage =
        err instanceof Error ? err.message : "Unknown email send error";
      console.error(
        `[EMAIL_FAILED] to=${message.to} subject="${message.subject}" error="${errorMessage}" elapsed=${elapsed}ms`,
      );
      return { success: false, error: errorMessage };
    }
  }

  async verify(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log("[EMAIL_VERIFY] SMTP connection verified successfully");
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      console.error(`[EMAIL_VERIFY] SMTP verification failed: ${errorMessage}`);
      return false;
    }
  }
}
