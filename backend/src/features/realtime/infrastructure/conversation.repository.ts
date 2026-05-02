import { pool } from "../../../config/db.js";
import type { Conversation, EnrichedConversation, ChatMessage } from "../domain/types.js";

function rowToConversation(row: Record<string, unknown>): Conversation {
  return {
    id: row.id as string,
    participantOne: row.participant_one as string,
    participantTwo: row.participant_two as string,
    lastMessageAt: new Date(row.last_message_at as string),
    createdAt: new Date(row.created_at as string),
  };
}

function rowToEnrichedConversation(
  row: Record<string, unknown>,
): EnrichedConversation {
  return {
    id: row.id as string,
    participantOne: row.participant_one as string,
    participantTwo: row.participant_two as string,
    participantOneName: (row.p1_name as string) || "Unknown",
    participantTwoName: (row.p2_name as string) || "Unknown",
    participantOneImage: (row.p1_image as string) || null,
    participantTwoImage: (row.p2_image as string) || null,
    lastMessageAt: new Date(row.last_message_at as string),
    lastMessageContent: (row.last_msg_content as string) || null,
    unreadCount: Number(row.unread_count ?? 0),
    createdAt: new Date(row.created_at as string),
  };
}

function rowToChatMessage(row: Record<string, unknown>): ChatMessage {
  return {
    id: row.id as string,
    conversationId: row.conversation_id as string,
    senderId: row.sender_id as string,
    content: row.content as string,
    read: row.read as boolean,
    createdAt: new Date(row.created_at as string),
  };
}

export async function findOrCreateConversation(
  participantOne: string,
  participantTwo: string,
): Promise<Conversation> {
  const [p1, p2] =
    participantOne < participantTwo
      ? [participantOne, participantTwo]
      : [participantTwo, participantOne];

  const existing = await pool.query(
    `SELECT * FROM conversation
     WHERE participant_one = $1 AND participant_two = $2`,
    [p1, p2],
  );

  if (existing.rows.length > 0) {
    return rowToConversation(existing.rows[0]);
  }

  const result = await pool.query(
    `INSERT INTO conversation (participant_one, participant_two)
     VALUES ($1, $2)
     RETURNING *`,
    [p1, p2],
  );
  return rowToConversation(result.rows[0]);
}

export async function getConversationsByUser(
  userId: string,
): Promise<Conversation[]> {
  const result = await pool.query(
    `SELECT * FROM conversation
     WHERE participant_one = $1 OR participant_two = $1
     ORDER BY last_message_at DESC`,
    [userId],
  );
  return result.rows.map(rowToConversation);
}

export async function getEnrichedConversationsByUser(
  userId: string,
): Promise<EnrichedConversation[]> {
  const result = await pool.query(
    `SELECT
       c.*,
       u1.name AS p1_name,
       u1.image AS p1_image,
       u2.name AS p2_name,
       u2.image AS p2_image,
       lm.content AS last_msg_content,
       COALESCE(unread.cnt, 0) AS unread_count
     FROM conversation c
     LEFT JOIN "user" u1 ON u1.id = c.participant_one
     LEFT JOIN "user" u2 ON u2.id = c.participant_two
     LEFT JOIN LATERAL (
       SELECT content FROM chat_message
       WHERE conversation_id = c.id
       ORDER BY created_at DESC LIMIT 1
     ) lm ON TRUE
     LEFT JOIN LATERAL (
       SELECT COUNT(*)::int AS cnt FROM chat_message
       WHERE conversation_id = c.id
         AND sender_id != $1
         AND read = FALSE
     ) unread ON TRUE
     WHERE c.participant_one = $1 OR c.participant_two = $1
     ORDER BY c.last_message_at DESC`,
    [userId],
  );
  return result.rows.map(rowToEnrichedConversation);
}

export async function getConversationById(
  id: string,
): Promise<Conversation | null> {
  const result = await pool.query(
    `SELECT * FROM conversation WHERE id = $1`,
    [id],
  );
  return result.rows.length > 0 ? rowToConversation(result.rows[0]) : null;
}

export async function getMessagesByConversation(
  conversationId: string,
  limit = 50,
  offset = 0,
): Promise<ChatMessage[]> {
  const result = await pool.query(
    `SELECT * FROM chat_message
     WHERE conversation_id = $1
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [conversationId, limit, offset],
  );
  return result.rows.map(rowToChatMessage);
}

export async function createMessage(
  data: Omit<ChatMessage, "id" | "read" | "createdAt">,
): Promise<ChatMessage> {
  const result = await pool.query(
    `INSERT INTO chat_message (conversation_id, sender_id, content)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [data.conversationId, data.senderId, data.content],
  );

  await pool.query(
    `UPDATE conversation SET last_message_at = NOW() WHERE id = $1`,
    [data.conversationId],
  );

  return rowToChatMessage(result.rows[0]);
}

export async function markMessagesRead(
  conversationId: string,
  userId: string,
): Promise<void> {
  await pool.query(
    `UPDATE chat_message
     SET read = TRUE
     WHERE conversation_id = $1
       AND sender_id != $2
       AND read = FALSE`,
    [conversationId, userId],
  );
}
