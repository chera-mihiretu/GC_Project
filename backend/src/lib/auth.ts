import { betterAuth } from "better-auth";
import { organization } from "better-auth/plugins";
import { admin } from "better-auth/plugins";
import { pool } from "../config/db.js";
import { getSendEmailUseCase } from "../features/email/index.js";
import dotenv from "dotenv";
import { ac, ownerRole, memberRole } from "./permissions.js";

dotenv.config();

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:5000",
  trustedOrigins: [process.env.FRONTEND_URL || "http://localhost:3000"],
  database: pool,
  advanced: {
    defaultCookieAttributes: {
      sameSite: process.env.NODE_ENV === "production" ? "none" as const : "lax" as const,
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url, token }) => {
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      const resetUrl = `${frontendUrl}/reset-password?token=${token}`;
      void getSendEmailUseCase().execute({
        to: user.email,
        subject: "Reset your password — Twedar",
        html: `
          <h2>Password Reset</h2>
          <p>Hi ${user.name},</p>
          <p>Click the link below to reset your password:</p>
          <p><a href="${resetUrl}">Reset Password</a></p>
          <p>If you didn't request this, you can safely ignore this email.</p>
        `,
        text: `Reset your password by visiting: ${resetUrl}`,
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, token }) => {
      const backendUrl = process.env.BETTER_AUTH_URL || "http://localhost:5000";
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      const verifyUrl = `${backendUrl}/api/auth/verify-email?token=${token}&callbackURL=${encodeURIComponent(`${frontendUrl}/verify-email`)}`;
      void getSendEmailUseCase().execute({
        to: user.email,
        subject: "Verify your email — Twedar",
        html: `
          <h2>Welcome to Twedar!</h2>
          <p>Hi ${user.name},</p>
          <p>Please verify your email address by clicking the link below:</p>
          <p><a href="${verifyUrl}">Verify Email</a></p>
          <p>If you didn't create an account, you can safely ignore this email.</p>
        `,
        text: `Verify your email by visiting: ${verifyUrl}`,
      });
    },
    autoSignInAfterVerification: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    },
    apple: {
      clientId: process.env.APPLE_CLIENT_ID || "",
      clientSecret: process.env.APPLE_CLIENT_SECRET || "",
    },
  },
  user: {
    additionalFields: {
      accountType: {
        type: "string",
        required: false,
        input: true,
        defaultValue: "couple",
      },
    },
  },
  plugins: [
    organization({
      ac,
      roles: {
        owner: ownerRole,
        member: memberRole,
      },
      async sendInvitationEmail(data) {
        const baseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
        const inviteLink = `${baseUrl}/accept-invitation/${data.id}`;
        void getSendEmailUseCase().execute({
          to: data.email,
          subject: `You've been invited to ${data.organization.name} — Twedar`,
          html: `
            <h2>Organization Invitation</h2>
            <p>You've been invited to join <strong>${data.organization.name}</strong> on Twedar.</p>
            <p><a href="${inviteLink}">Accept Invitation</a></p>
          `,
          text: `You've been invited to join ${data.organization.name}. Accept here: ${inviteLink}`,
        });
      },
    }),
    admin(),
  ],
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const rec = user as Record<string, unknown>;
          const accountType = rec.accountType as string | undefined;
          const allowed = ["couple", "vendor"];
          const role = accountType && allowed.includes(accountType) ? accountType : "couple";
          return { data: { ...user, role } };
        },
        after: async (user) => {
          if ((user as Record<string, unknown>).role === "vendor") {
            try {
              await auth.api.createOrganization({
                body: {
                  name: `${user.name}'s Business`,
                  slug: `vendor-${user.id}`,
                },
                headers: new Headers({
                  "x-user-id": user.id,
                }),
              });
            } catch (err) {
              console.error("Failed to auto-create vendor organization:", err);
            }
          }
        },
      },
    },
  },
});
