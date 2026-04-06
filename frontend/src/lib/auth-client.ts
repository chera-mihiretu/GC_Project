import { createAuthClient } from "better-auth/react";
import { organizationClient } from "better-auth/client/plugins";
import { adminClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000",
  fetchOptions: {
    credentials: "include",
  },
  plugins: [organizationClient(), adminClient()],
});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  organization,
} = authClient;
