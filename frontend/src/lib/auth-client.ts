/**
 * @fileoverview Better Auth client configuration for the Twedar frontend.
 * 
 * This module initializes the authentication client with proper configuration
 * for communicating with the backend auth API. It exports commonly used
 * auth functions for use throughout the application.
 * 
 * @module lib/auth-client
 */
import { createAuthClient } from "better-auth/react";
import { organizationClient } from "better-auth/client/plugins";
import { adminClient } from "better-auth/client/plugins";

/**
 * Configured Better Auth client instance.
 * 
 * The client is configured to:
 * - Connect to the backend API URL (supports both production and local dev)
 * - Include credentials (cookies) with all requests for session management
 * - Support organization and admin plugin features
 */
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",
  fetchOptions: {
    credentials: "include",
  },
  plugins: [organizationClient(), adminClient()],
});

/**
 * Destructured auth methods for convenient imports.
 * 
 * These are the most commonly used auth operations across the app:
 * - signIn: Authenticate existing users
 * - signUp: Register new users  
 * - signOut: End the current session
 * - useSession: React hook for accessing session state
 * - organization: Methods for org membership and management
 */
export const {
  signIn,
  signUp,
  signOut,
  useSession,
  organization,
} = authClient;