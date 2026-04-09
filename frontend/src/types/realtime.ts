export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  metadata: Record<string, unknown>;
  read: boolean;
  createdAt: string;
}

export interface Conversation {
  id: string;
  participantOne: string;
  participantTwo: string;
  lastMessageAt: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  read: boolean;
  createdAt: string;
}

export interface TypingPayload {
  conversationId: string;
  userId: string;
  typing: boolean;
}

export interface ReadReceiptPayload {
  conversationId: string;
  readBy: string;
}

export interface PresencePayload {
  userId: string;
  online: boolean;
}

export interface ServerToClientEvents {
  "notification:new": (notification: Notification) => void;
  "notification:read": (data: { id: string } | { all: true }) => void;
  "chat:message": (message: ChatMessage) => void;
  "chat:typing": (data: TypingPayload) => void;
  "chat:read": (data: ReadReceiptPayload) => void;
  "presence:update": (data: PresencePayload) => void;
}

export interface ClientToServerEvents {
  "notification:mark-read": (
    data: { id: string } | { all: true },
    ack?: (ok: boolean) => void,
  ) => void;
  "chat:send": (
    data: { conversationId: string; content: string },
    ack?: (message: ChatMessage | null) => void,
  ) => void;
  "chat:typing": (data: { conversationId: string; typing: boolean }) => void;
  "chat:mark-read": (data: { conversationId: string }) => void;
  "chat:join": (data: { conversationId: string }) => void;
  "chat:leave": (data: { conversationId: string }) => void;
}
