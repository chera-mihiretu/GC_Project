import type { Conversation, EnrichedConversation, ChatMessage } from "../domain/types.js";
import {
  getConversationsByUser,
  getEnrichedConversationsByUser,
  getConversationById,
  getMessagesByConversation,
} from "../infrastructure/conversation.repository.js";

export async function listUserConversations(
  userId: string,
): Promise<Conversation[]> {
  return getConversationsByUser(userId);
}

export async function listEnrichedUserConversations(
  userId: string,
): Promise<EnrichedConversation[]> {
  return getEnrichedConversationsByUser(userId);
}

export async function getConversation(
  id: string,
): Promise<Conversation | null> {
  return getConversationById(id);
}

export async function getConversationMessages(
  conversationId: string,
  limit = 50,
  offset = 0,
): Promise<ChatMessage[]> {
  return getMessagesByConversation(conversationId, limit, offset);
}
