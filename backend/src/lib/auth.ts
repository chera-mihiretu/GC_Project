import { betterAuth } from "better-auth";
import { organization } from "better-auth/plugins";
import { admin } from "better-auth/plugins";
import { pool } from "../config/db.js";
import dotenv from "dotenv";
import { ac, ownerRole, memberRole } from "./permissions.js";

dotenv.config();

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:5000",
  database: pool,
  emailAndPassword: {
    enabled: true,
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
  plugins: [
    organization({
      ac,
      roles: {
        owner: ownerRole,
        member: memberRole,
      },
      async sendInvitationEmail(data) {
        console.log(
          `Invitation email to ${data.email} for org ${data.organization.name}`,
        );
      },
    }),
    admin(),
  ],
  databaseHooks: {
    user: {
      create: {
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
