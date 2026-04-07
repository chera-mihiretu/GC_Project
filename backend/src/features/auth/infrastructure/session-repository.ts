import { auth } from "../../../lib/auth.js";
import type { SessionContext } from "../domain/types.js";
import { fromNodeHeaders } from "better-auth/node";

export async function getSessionFromHeaders(
  headers: Record<string, string | string[] | undefined>,
): Promise<SessionContext | null> {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(headers),
  });

  if (!session) {
    return null;
  }

  return session as unknown as SessionContext;
}
