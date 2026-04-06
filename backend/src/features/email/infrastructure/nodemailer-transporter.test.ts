import { describe, it, expect, beforeEach, afterAll } from "@jest/globals";
import { loadSmtpConfig } from "./nodemailer-transporter.js";

describe("loadSmtpConfig", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("loads config from environment variables", () => {
    process.env.SMTP_HOST = "smtp.example.com";
    process.env.SMTP_PORT = "587";
    process.env.SMTP_USER = "user@example.com";
    process.env.SMTP_PASS = "secret";
    process.env.SMTP_FROM = "noreply@example.com";

    const config = loadSmtpConfig();

    expect(config).toEqual({
      host: "smtp.example.com",
      port: 587,
      secure: false,
      user: "user@example.com",
      pass: "secret",
      from: "noreply@example.com",
    });
  });

  it("sets secure to true when port is 465", () => {
    process.env.SMTP_HOST = "smtp.example.com";
    process.env.SMTP_PORT = "465";
    process.env.SMTP_USER = "user@example.com";
    process.env.SMTP_PASS = "secret";
    process.env.SMTP_FROM = "noreply@example.com";

    const config = loadSmtpConfig();

    expect(config.secure).toBe(true);
    expect(config.port).toBe(465);
  });

  it("throws when SMTP_HOST is missing", () => {
    process.env.SMTP_PORT = "587";
    process.env.SMTP_USER = "user@example.com";
    process.env.SMTP_PASS = "secret";
    process.env.SMTP_FROM = "noreply@example.com";
    delete process.env.SMTP_HOST;

    expect(() => loadSmtpConfig()).toThrow("Missing required SMTP environment variables");
  });

  it("throws when SMTP_PASS is missing", () => {
    process.env.SMTP_HOST = "smtp.example.com";
    process.env.SMTP_PORT = "587";
    process.env.SMTP_USER = "user@example.com";
    process.env.SMTP_FROM = "noreply@example.com";
    delete process.env.SMTP_PASS;

    expect(() => loadSmtpConfig()).toThrow("Missing required SMTP environment variables");
  });
});
