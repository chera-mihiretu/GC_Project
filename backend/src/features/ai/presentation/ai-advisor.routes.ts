import { Router, type Request, type Response } from "express";
import { requireAuth } from "../../auth/presentation/auth.middleware.js";
import { aiChat, aiChatStream, type CoupleContext } from "../use-cases/ai-chat.js";
import type { ChatMessage, PendingAction } from "../domain/types.js";
import { findByUserId as findCoupleProfile } from "../../couple/infrastructure/couple-profile.repository.js";
import { executeSendMessageToVendors, executeCreateBooking, executeCancelBooking, executeRescheduleBooking } from "../use-cases/agent-tools.js";
import {
  createSession,
  listSessionsByUser,
  getSessionById,
  deleteSession,
  updateSessionTitle,
  addMessage,
  getMessagesBySession,
} from "../infrastructure/ai-session.repository.js";

const router = Router();

function buildCoupleContext(userName: string, coupleProfile: { partnerName: string | null; weddingDate: string | null; weddingLocation: string | null; estimatedGuests: number | null; weddingTheme: string | null } | null): CoupleContext {
  if (coupleProfile) {
    return {
      name: userName,
      partnerName: coupleProfile.partnerName,
      weddingDate: coupleProfile.weddingDate,
      weddingLocation: coupleProfile.weddingLocation,
      estimatedGuests: coupleProfile.estimatedGuests,
      weddingTheme: coupleProfile.weddingTheme,
    };
  }
  return {
    name: userName,
    partnerName: null,
    weddingDate: null,
    weddingLocation: null,
    estimatedGuests: null,
    weddingTheme: null,
  };
}

// --- Session CRUD ---

router.post("/sessions", requireAuth(), async (req: Request, res: Response) => {
  const userId = req.authContext!.user.id;
  const { title } = req.body ?? {};

  try {
    const session = await createSession(userId, title);
    res.status(201).json(session);
  } catch (err) {
    console.error("[AI] Create session error:", err);
    res.status(500).json({ error: { code: "SERVER_ERROR", message: "Failed to create session" } });
  }
});

router.get("/sessions", requireAuth(), async (req: Request, res: Response) => {
  const userId = req.authContext!.user.id;
  const limit = Math.min(Number(req.query.limit) || 50, 100);
  const offset = Number(req.query.offset) || 0;

  try {
    const result = await listSessionsByUser(userId, limit, offset);
    res.json(result);
  } catch (err) {
    console.error("[AI] List sessions error:", err);
    res.status(500).json({ error: { code: "SERVER_ERROR", message: "Failed to list sessions" } });
  }
});

router.get("/sessions/:id/messages", requireAuth(), async (req: Request, res: Response) => {
  const userId = req.authContext!.user.id;
  const sessionId = req.params.id;

  try {
    const session = await getSessionById(sessionId as string);
    if (!session || session.userId !== userId) {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "Session not found" } });
      return;
    }
    const messages = await getMessagesBySession(sessionId as string);
    res.json({ messages });
  } catch (err) {
    console.error("[AI] Get messages error:", err);
    res.status(500).json({ error: { code: "SERVER_ERROR", message: "Failed to get messages" } });
  }
});

router.delete("/sessions/:id", requireAuth(), async (req: Request, res: Response) => {
  const userId = req.authContext!.user.id;
  const sessionId = req.params.id as string;

  try {
    const session = await getSessionById(sessionId);
    if (!session || session.userId !== userId) {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "Session not found" } });
      return;
    }
    await deleteSession(sessionId);
    res.json({ success: true });
  } catch (err) {
    console.error("[AI] Delete session error:", err);
    res.status(500).json({ error: { code: "SERVER_ERROR", message: "Failed to delete session" } });
  }
});

// --- Chat (non-streaming, legacy) ---

router.post("/chat", requireAuth(), async (req: Request, res: Response) => {
  const userId = req.authContext!.user.id;
  const userName = req.authContext!.user.name;
  const { messages } = req.body ?? {};

  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: { code: "BAD_REQUEST", message: "messages array is required" } });
    return;
  }

  for (const msg of messages) {
    if (!msg.role || !["user", "model"].includes(msg.role) || typeof msg.content !== "string") {
      res.status(400).json({ error: { code: "BAD_REQUEST", message: "Each message must have role ('user'|'model') and content (string)" } });
      return;
    }
  }

  try {
    const coupleProfile = await findCoupleProfile(userId);
    const coupleContext = buildCoupleContext(userName, coupleProfile);
    const result = await aiChat(messages as ChatMessage[], userId, coupleContext);
    res.json(result);
  } catch (err) {
    console.error("[AI] Chat error:", err);
    res.status(500).json({ error: { code: "AI_ERROR", message: "Failed to process AI request" } });
  }
});

// --- Chat (streaming with session persistence) ---

router.post("/chat/stream", requireAuth(), async (req: Request, res: Response) => {
  const userId = req.authContext!.user.id;
  const userName = req.authContext!.user.name;
  const { messages, sessionId } = req.body ?? {};

  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: { code: "BAD_REQUEST", message: "messages array is required" } });
    return;
  }

  for (const msg of messages) {
    if (!msg.role || !["user", "model"].includes(msg.role) || typeof msg.content !== "string") {
      res.status(400).json({ error: { code: "BAD_REQUEST", message: "Each message must have role ('user'|'model') and content (string)" } });
      return;
    }
  }

  // Resolve or create session
  let activeSessionId: string | null = sessionId || null;
  const lastUserMessage = [...messages].reverse().find((m: { role: string }) => m.role === "user");

  if (activeSessionId) {
    const session = await getSessionById(activeSessionId);
    if (!session || session.userId !== userId) {
      activeSessionId = null;
    }
  }

  if (!activeSessionId) {
    const title = lastUserMessage
      ? (lastUserMessage.content as string).slice(0, 50)
      : "New conversation";
    const session = await createSession(userId, title);
    activeSessionId = session.id;
  }

  // Save the user message
  if (lastUserMessage) {
    await addMessage(activeSessionId, "user", lastUserMessage.content as string);
  }

  // Check if session needs a title (first message scenario)
  const existingMessages = await getMessagesBySession(activeSessionId, 2);
  if (existingMessages.length <= 1 && lastUserMessage) {
    const title = (lastUserMessage.content as string).slice(0, 50);
    await updateSessionTitle(activeSessionId, title);
  }

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  res.flushHeaders();

  const sendEvent = (event: string, data: unknown) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    if (typeof (res as unknown as { flush?: () => void }).flush === "function") {
      (res as unknown as { flush: () => void }).flush();
    }
  };

  // Send session ID to frontend so it can track the active session
  sendEvent("session", { sessionId: activeSessionId });

  const coupleProfile = await findCoupleProfile(userId);
  const coupleContext = buildCoupleContext(userName, coupleProfile);

  let fullReply = "";
  let collectedVendorCards: unknown[] = [];
  let collectedAction: Record<string, unknown> | undefined;

  await aiChatStream(
    messages as ChatMessage[],
    userId,
    {
      onToken: (text) => {
        fullReply += text;
        sendEvent("token", { text });
      },
      onToolStart: (toolName) => sendEvent("tool_start", { tool: toolName }),
      onToolEnd: (toolName) => sendEvent("tool_end", { tool: toolName }),
      onVendorCards: (cards) => {
        collectedVendorCards = cards;
        sendEvent("vendor_cards", { cards });
      },
      onBookingCards: (cards) => {
        sendEvent("booking_cards", { cards });
      },
      onAction: (action) => {
        collectedAction = action as unknown as Record<string, unknown>;
        sendEvent("action", action);
      },
      onDone: async () => {
        // Persist the model's response
        if (fullReply && activeSessionId) {
          await addMessage(
            activeSessionId,
            "model",
            fullReply,
            collectedVendorCards.length > 0 ? collectedVendorCards : undefined,
            collectedAction,
          ).catch((err) => console.error("[AI] Failed to save model message:", err));
        }
        sendEvent("done", { sessionId: activeSessionId });
        res.end();
      },
      onError: (error) => {
        sendEvent("error", { message: error });
        res.end();
      },
    },
    coupleContext,
  );
});

// --- Confirm Action ---

router.post("/confirm-action", requireAuth(), async (req: Request, res: Response) => {
  const userId = req.authContext!.user.id;
  const { action } = req.body ?? {};

  if (!action || !action.type || !action.params) {
    res.status(400).json({ error: { code: "BAD_REQUEST", message: "action with type and params is required" } });
    return;
  }

  try {
    const pendingAction = action as PendingAction;

    switch (pendingAction.type) {
      case "send_message": {
        const { vendorProfileIds, message } = pendingAction.params as {
          vendorProfileIds: string[];
          message: string;
        };
        if (!vendorProfileIds?.length || !message) {
          res.status(400).json({ error: { code: "BAD_REQUEST", message: "vendorProfileIds and message are required" } });
          return;
        }
        const results = await executeSendMessageToVendors(vendorProfileIds, message, userId);
        const successCount = results.filter((r) => r.sent).length;
        const failedNames = results.filter((r) => !r.sent).map((r) => r.businessName);
        res.json({
          success: true,
          summary: successCount > 0
            ? `Message sent to ${successCount} vendor${successCount > 1 ? "s" : ""} successfully.${failedNames.length > 0 ? ` Failed for: ${failedNames.join(", ")}` : ""}`
            : `Failed to send message. ${failedNames.length > 0 ? `Vendors: ${failedNames.join(", ")}` : ""}`,
          results,
        });
        return;
      }
      case "book_vendor": {
        const { vendorProfileId, serviceCategory, eventDate, message } = pendingAction.params as {
          vendorProfileId: string;
          serviceCategory: string;
          eventDate: string;
          message?: string;
        };
        if (!vendorProfileId || !serviceCategory || !eventDate) {
          res.status(400).json({ error: { code: "BAD_REQUEST", message: "vendorProfileId, serviceCategory, and eventDate are required" } });
          return;
        }
        const bookingResult = await executeCreateBooking(vendorProfileId, serviceCategory, eventDate, userId, message);
        res.json({
          success: bookingResult.success,
          summary: bookingResult.success
            ? `Booking request sent to ${bookingResult.vendorBusinessName} for ${bookingResult.serviceCategory} on ${bookingResult.eventDate}. The vendor will review and respond to your request.`
            : `Failed to book ${bookingResult.vendorBusinessName}: ${bookingResult.error}`,
          result: bookingResult,
        });
        return;
      }
      case "cancel_booking": {
        const { bookingId } = pendingAction.params as { bookingId: string };
        if (!bookingId) {
          res.status(400).json({ error: { code: "BAD_REQUEST", message: "bookingId is required" } });
          return;
        }
        const cancelResult = await executeCancelBooking(bookingId, userId);
        res.json({
          success: cancelResult.success,
          summary: cancelResult.message,
        });
        return;
      }
      case "reschedule_booking": {
        const { bookingId: rBookingId, newEventDate } = pendingAction.params as { bookingId: string; newEventDate: string };
        if (!rBookingId || !newEventDate) {
          res.status(400).json({ error: { code: "BAD_REQUEST", message: "bookingId and newEventDate are required" } });
          return;
        }
        const rescheduleResult = await executeRescheduleBooking(rBookingId, newEventDate, userId);
        res.json({
          success: rescheduleResult.success,
          summary: rescheduleResult.message,
          newBookingId: rescheduleResult.newBookingId,
        });
        return;
      }
      default:
        res.status(400).json({ error: { code: "UNSUPPORTED_ACTION", message: `Action type "${pendingAction.type}" is not supported` } });
        return;
    }
  } catch (err) {
    console.error("[AI] Confirm action error:", err);
    res.status(500).json({ error: { code: "ACTION_ERROR", message: "Failed to execute action" } });
  }
});

export default router;
