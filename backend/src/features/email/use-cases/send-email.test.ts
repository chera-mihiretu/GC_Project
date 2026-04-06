import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import { SendEmailUseCase } from "./send-email.js";
import type {
  EmailTransporter,
  EmailMessage,
} from "../domain/types.js";

const mockTransporter: EmailTransporter = {
  send: jest.fn() as jest.MockedFunction<EmailTransporter["send"]>,
  verify: jest.fn() as jest.MockedFunction<EmailTransporter["verify"]>,
};

describe("SendEmailUseCase", () => {
  let useCase: SendEmailUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new SendEmailUseCase(mockTransporter);
  });

  it("sends an email with valid text body", async () => {
    (mockTransporter.send as jest.MockedFunction<EmailTransporter["send"]>).mockResolvedValue({
      success: true,
      messageId: "msg_123",
    });

    const message: EmailMessage = {
      to: "user@example.com",
      subject: "Test Subject",
      text: "Hello world",
    };

    const result = await useCase.execute(message);

    expect(mockTransporter.send).toHaveBeenCalledWith(message);
    expect(result.success).toBe(true);
    expect(result.messageId).toBe("msg_123");
  });

  it("sends an email with valid html body", async () => {
    (mockTransporter.send as jest.MockedFunction<EmailTransporter["send"]>).mockResolvedValue({
      success: true,
      messageId: "msg_456",
    });

    const message: EmailMessage = {
      to: "user@example.com",
      subject: "Test Subject",
      html: "<p>Hello world</p>",
    };

    const result = await useCase.execute(message);

    expect(mockTransporter.send).toHaveBeenCalledWith(message);
    expect(result.success).toBe(true);
  });

  it("rejects when recipient is missing", async () => {
    const message: EmailMessage = {
      to: "",
      subject: "Test",
      text: "Body",
    };

    const result = await useCase.execute(message);

    expect(result.success).toBe(false);
    expect(result.error).toBe("Recipient (to) and subject are required");
    expect(mockTransporter.send).not.toHaveBeenCalled();
  });

  it("rejects when subject is missing", async () => {
    const message: EmailMessage = {
      to: "user@example.com",
      subject: "",
      text: "Body",
    };

    const result = await useCase.execute(message);

    expect(result.success).toBe(false);
    expect(result.error).toBe("Recipient (to) and subject are required");
    expect(mockTransporter.send).not.toHaveBeenCalled();
  });

  it("rejects when both text and html are missing", async () => {
    const message: EmailMessage = {
      to: "user@example.com",
      subject: "Test",
    };

    const result = await useCase.execute(message);

    expect(result.success).toBe(false);
    expect(result.error).toBe("Either text or html body is required");
    expect(mockTransporter.send).not.toHaveBeenCalled();
  });

  it("returns failure when transporter.send fails", async () => {
    (mockTransporter.send as jest.MockedFunction<EmailTransporter["send"]>).mockResolvedValue({
      success: false,
      error: "SMTP connection refused",
    });

    const message: EmailMessage = {
      to: "user@example.com",
      subject: "Test",
      text: "Body",
    };

    const result = await useCase.execute(message);

    expect(result.success).toBe(false);
    expect(result.error).toBe("SMTP connection refused");
  });
});
