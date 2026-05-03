import { betterAuth } from "better-auth";
import { organization } from "better-auth/plugins";
import { admin } from "better-auth/plugins";
import { pool } from "../config/db.js";
import { env } from "../config/env.js";
import { getSendEmailUseCase } from "../features/email/index.js";
import { ac, ownerRole, memberRole } from "./permissions.js";

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  trustedOrigins: [env.FRONTEND_URL],
  database: pool,
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24,       // refresh session token daily on active use
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,              // cache session in cookie for 5 min to reduce DB lookups
    },
  },
  advanced: {
    defaultCookieAttributes: {
      sameSite: env.isProduction ? "none" as const : "lax" as const,
      secure: env.isProduction,
      httpOnly: true,
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url, token }) => {
      const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${token}`;
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
      const callbackURL = `${env.FRONTEND_URL}/verify-email?email=${encodeURIComponent(user.email)}`;
      const verifyUrl = `${env.BETTER_AUTH_URL}/api/auth/verify-email?token=${token}&callbackURL=${encodeURIComponent(callbackURL)}`;
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
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
    apple: {
      clientId: env.APPLE_CLIENT_ID,
      clientSecret: env.APPLE_CLIENT_SECRET,
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
    deleteUser: {
      enabled: true,
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
        const inviteLink = `${env.FRONTEND_URL}/accept-invitation/${data.id}`;
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
    admin({
      bannedUserMessage: "Your account has been suspended. Please contact support at support@twedar.com if you believe this is an error.",
    }),
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
              const pending = await pool.query(
                'SELECT 1 FROM "invitation" WHERE email = $1 AND status = $2 LIMIT 1',
                [user.email, "pending"],
              );
              if (pending.rows.length > 0) {
                return;
              }
              await auth.api.createOrganization({
                body: {
                  name: `${user.name}'s Business`,
                  slug: `vendor-${user.id}`,
                  userId: user.id,
                },
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
