import { Router, type Request, type Response } from "express";
import { requireAuth } from "../../auth/presentation/auth.middleware.js";
import {
  listEnrichedUserConversations,
  getConversation,
  getConversationMessages,
} from "../use-cases/get-conversation.js";
import { findOrCreateConversation } from "../infrastructure/conversation.repository.js";

const router = Router();

router.use(requireAuth());

router.get("/", async (req: Request, res: Response) => {
  const userId = req.authContext!.user.id;
  const conversations = await listEnrichedUserConversations(userId);
  res.json({ conversations });
});

router.get("/:id/messages", async (req: Request<{ id: string }>, res: Response) => {
  const userId = req.authContext!.user.id;
  const conversation = await getConversation(req.params.id);

  if (!conversation) {
    res.status(404).json({ error: { code: "NOT_FOUND", message: "Conversation not found" } });
    return;
  }

  if (
    conversation.participantOne !== userId &&
    conversation.participantTwo !== userId
  ) {
    res.status(403).json({ error: { code: "FORBIDDEN", message: "Not a participant" } });
    return;
  }

  const limit = Math.min(Number(req.query.limit) || 50, 100);
  const offset = Number(req.query.offset) || 0;
  const messages = await getConversationMessages(req.params.id, limit, offset);

  res.json({ messages, limit, offset });
});

router.post("/", async (req: Request, res: Response) => {
  const userId = req.authContext!.user.id;
  const { participantId } = req.body;

  if (!participantId || typeof participantId !== "string") {
    res.status(400).json({ error: { code: "BAD_REQUEST", message: "participantId is required" } });
    return;
  }

  if (participantId === userId) {
    res.status(400).json({ error: { code: "BAD_REQUEST", message: "Cannot start conversation with yourself" } });
    return;
  }

  const conversation = await findOrCreateConversation(userId, participantId);
  res.status(201).json({ conversation });
});

export default router;
