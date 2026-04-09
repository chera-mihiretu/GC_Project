import type { ChatMessage } from "../domain/types.js";
import {
  createMessage,
  markMessagesRead,
} from "../infrastructure/conversation.repository.js";

export interface SendChatMessageInput {
  conversationId: string;
  senderId: string;
  content: string;
}

export async function sendChatMessage(
  input: SendChatMessageInput,
): Promise<ChatMessage> {
  return createMessage({
    conversationId: input.conversationId,
    senderId: input.senderId,
    content: input.content,
  });
}

export async function markConversationRead(
  conversationId: string,
  userId: string,
): Promise<void> {
  await markMessagesRead(conversationId, userId);
}
