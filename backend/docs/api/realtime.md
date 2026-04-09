# Realtime API — Notifications, Chat, Presence

## Overview

The realtime system uses **Socket.IO 4.8.3** over the same-origin proxy (`/api/socket.io` path). All connections are authenticated via Better Auth session cookies sent in the WebSocket handshake.

---

## Connection

**Socket.IO Path:** `/api/socket.io`
**Transports:** `websocket`, `polling`

```typescript
import { io } from "socket.io-client";

const socket = io("http://localhost:3000", {
  path: "/api/socket.io",
  withCredentials: true,
  transports: ["websocket", "polling"],
});
```

### Authentication

Session cookies are sent automatically in the handshake. If no valid session exists, the connection is rejected with an `UNAUTHORIZED` error.

On successful connection, the server automatically:
- Joins the socket to `user:<userId>` room

---

## Socket.IO Events

### Server → Client

| Event | Payload | Description |
|---|---|---|
| `notification:new` | `Notification` | A new notification was created |
| `notification:read` | `{ id: string }` or `{ all: true }` | Notification(s) marked as read |
| `chat:message` | `ChatMessage` | A new chat message in a joined conversation |
| `chat:typing` | `{ conversationId, userId, typing }` | Typing indicator from another user |
| `chat:read` | `{ conversationId, readBy }` | Messages marked as read by a user |
| `presence:update` | `{ userId, online }` | A user came online or went offline |

### Client → Server

| Event | Payload | Ack | Description |
|---|---|---|---|
| `notification:mark-read` | `{ id: string }` or `{ all: true }` | `(ok: boolean)` | Mark notification(s) as read |
| `chat:send` | `{ conversationId, content }` | `(message: ChatMessage \| null)` | Send a chat message |
| `chat:typing` | `{ conversationId, typing }` | — | Broadcast typing indicator |
| `chat:mark-read` | `{ conversationId }` | — | Mark all messages in conversation as read |
| `chat:join` | `{ conversationId }` | — | Join a conversation room |
| `chat:leave` | `{ conversationId }` | — | Leave a conversation room |

---

## Entity Schemas

### Notification

```json
{
  "id": "uuid",
  "userId": "string",
  "type": "booking_request",
  "title": "New Booking Request",
  "body": "John Doe requested a booking for Dec 15",
  "metadata": { "bookingId": "abc123" },
  "read": false,
  "createdAt": "2026-04-06T12:00:00.000Z"
}
```

### ChatMessage

```json
{
  "id": "uuid",
  "conversationId": "uuid",
  "senderId": "string",
  "content": "Hello, I'd like to discuss the pricing.",
  "read": false,
  "createdAt": "2026-04-06T12:05:00.000Z"
}
```

### Conversation

```json
{
  "id": "uuid",
  "participantOne": "user-id-1",
  "participantTwo": "user-id-2",
  "lastMessageAt": "2026-04-06T12:05:00.000Z",
  "createdAt": "2026-04-06T10:00:00.000Z"
}
```

---

## REST Endpoints

All endpoints require authentication (session cookie). Protected by `requireAuth()` middleware.

---

### GET /api/v1/notifications

**Description:** Fetch paginated notification list for the authenticated user.

**Request:**

| Param | Location | Type | Default | Description |
|---|---|---|---|---|
| `limit` | query | number | 20 | Max notifications to return (max 100) |
| `offset` | query | number | 0 | Pagination offset |

**Response (200):**

```json
{
  "notifications": [ /* Notification[] */ ],
  "unreadCount": 5,
  "limit": 20,
  "offset": 0
}
```

**Error (401):**

```json
{
  "error": { "code": "UNAUTHORIZED", "message": "No active session" }
}
```

---

### PATCH /api/v1/notifications/:id/read

**Description:** Mark a single notification as read.

**Request:**

| Param | Location | Type | Description |
|---|---|---|---|
| `id` | path | UUID | Notification ID |

**Response (200):**

```json
{ "success": true }
```

**Error (404):**

```json
{
  "error": { "code": "NOT_FOUND", "message": "Notification not found" }
}
```

---

### PATCH /api/v1/notifications/read-all

**Description:** Mark all unread notifications as read for the authenticated user.

**Response (200):**

```json
{ "success": true }
```

---

### GET /api/v1/conversations

**Description:** List all conversations for the authenticated user, ordered by most recent message.

**Response (200):**

```json
{
  "conversations": [ /* Conversation[] */ ]
}
```

---

### GET /api/v1/conversations/:id/messages

**Description:** Fetch paginated message history for a conversation. The authenticated user must be a participant.

**Request:**

| Param | Location | Type | Default | Description |
|---|---|---|---|---|
| `id` | path | UUID | — | Conversation ID |
| `limit` | query | number | 50 | Max messages to return (max 100) |
| `offset` | query | number | 0 | Pagination offset |

**Response (200):**

```json
{
  "messages": [ /* ChatMessage[] */ ],
  "limit": 50,
  "offset": 0
}
```

**Error (403):**

```json
{
  "error": { "code": "FORBIDDEN", "message": "Not a participant" }
}
```

**Error (404):**

```json
{
  "error": { "code": "NOT_FOUND", "message": "Conversation not found" }
}
```

---

### POST /api/v1/conversations

**Description:** Start a new conversation with another user, or return the existing one if it already exists.

**Request Body:**

```json
{
  "participantId": "user-id-of-other-person"
}
```

**Response (201):**

```json
{
  "conversation": { /* Conversation */ }
}
```

**Error (400):**

```json
{
  "error": { "code": "BAD_REQUEST", "message": "participantId is required" }
}
```

---

## Database Tables

### notification

| Column | Type | Default | Description |
|---|---|---|---|
| id | UUID | gen_random_uuid() | Primary key |
| user_id | TEXT | — | Recipient user ID |
| type | VARCHAR(100) | — | Notification type (e.g. `booking_request`) |
| title | VARCHAR(255) | — | Notification title |
| body | TEXT | `''` | Notification body |
| metadata | JSONB | `'{}'` | Flexible key-value payload |
| read | BOOLEAN | `FALSE` | Read status |
| created_at | TIMESTAMPTZ | `NOW()` | Creation timestamp |

### conversation

| Column | Type | Default | Description |
|---|---|---|---|
| id | UUID | gen_random_uuid() | Primary key |
| participant_one | TEXT | — | First participant (sorted lexicographically) |
| participant_two | TEXT | — | Second participant |
| last_message_at | TIMESTAMPTZ | `NOW()` | Timestamp of the last message |
| created_at | TIMESTAMPTZ | `NOW()` | Creation timestamp |

### chat_message

| Column | Type | Default | Description |
|---|---|---|---|
| id | UUID | gen_random_uuid() | Primary key |
| conversation_id | UUID | — | FK to conversation.id |
| sender_id | TEXT | — | Sender user ID |
| content | TEXT | — | Message content |
| read | BOOLEAN | `FALSE` | Read status |
| created_at | TIMESTAMPTZ | `NOW()` | Creation timestamp |
