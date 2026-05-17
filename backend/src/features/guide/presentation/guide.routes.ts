import { Router, type Request, type Response } from "express";
import { requireAuth } from "../../auth/presentation/auth.middleware.js";
import { guideChatStream, type GuideChatMessage } from "../use-cases/guide-chat.js";

const router = Router();

router.post("/chat/stream", requireAuth(), async (req: Request, res: Response) => {
  const { messages } = req.body as { messages?: unknown[] };

  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({
      code: "BAD_REQUEST",
      message: "messages array is required and must not be empty",
    });
    return;
  }

  for (const msg of messages) {
    const m = msg as Record<string, unknown>;
    if (
      !m.role ||
      !["user", "model"].includes(m.role as string) ||
      typeof m.content !== "string"
    ) {
      res.status(400).json({
        code: "BAD_REQUEST",
        message: "Each message must have role ('user'|'model') and content (string)",
      });
      return;
    }
  }

  const chatMessages = messages as GuideChatMessage[];
  const userRole = (req.authContext?.user as { role?: string })?.role ?? "couple";

  console.log(`[GUIDE] Stream starting for user=${req.authContext?.user?.id} role=${userRole}`);

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });

  let closed = false;
  req.on("close", () => {
    closed = true;
  });

  try {
    await guideChatStream(chatMessages, userRole, {
      onToken: (text) => {
        if (closed) return;
        res.write(`data: ${JSON.stringify({ type: "token", text })}\n\n`);
      },
      onDone: () => {
        if (closed) return;
        res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
        res.end();
      },
      onError: (error) => {
        if (closed) return;
        res.write(`data: ${JSON.stringify({ type: "error", error })}\n\n`);
        res.end();
      },
    });
  } catch (err) {
    console.error("[GUIDE] Route error:", err);
    if (!closed) {
      res.write(
        `data: ${JSON.stringify({ type: "error", error: "Internal server error" })}\n\n`,
      );
      res.end();
    }
  }
});

export default router;
