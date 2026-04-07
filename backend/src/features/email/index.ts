import dotenv from "dotenv";
import {
  NodemailerTransporter,
  loadSmtpConfig,
} from "./infrastructure/nodemailer-transporter.js";
import { SendEmailUseCase } from "./use-cases/send-email.js";
import type { EmailTransporter } from "./domain/types.js";

dotenv.config();

let _transporter: EmailTransporter | null = null;
let _sendEmailUseCase: SendEmailUseCase | null = null;

function getTransporter(): EmailTransporter {
  if (!_transporter) {
    const config = loadSmtpConfig();
    _transporter = new NodemailerTransporter(config);
  }
  return _transporter;
}

export function getSendEmailUseCase(): SendEmailUseCase {
  if (!_sendEmailUseCase) {
    _sendEmailUseCase = new SendEmailUseCase(getTransporter());
  }
  return _sendEmailUseCase;
}

export type { EmailMessage, EmailSendResult, EmailTransporter } from "./domain/types.js";
