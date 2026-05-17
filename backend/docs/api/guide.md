# Guide Bot API

Platform guide chatbot that answers questions about how to use Twedar. Uses a lightweight Gemini model (`gemini-2.0-flash-lite`) with the full platform knowledge document as system context.

---

## Stream Guide Chat

**Endpoint:** `POST /api/v1/guide/chat/stream`

**Auth:** Required (any authenticated role)

**Description:** Streams a response from the platform guide bot. The bot is role-aware and tailors answers to the user's role (couple, vendor, or admin). It only answers questions about using the Twedar platform and politely redirects unrelated questions.

### Request

**Headers:**

| Header       | Value              |
| ------------ | ------------------ |
| Content-Type | application/json   |
| Cookie       | (session cookie)   |

**Body:**

```json
{
  "messages": [
    { "role": "user", "content": "How do I book a vendor?" }
  ]
}
```

| Field    | Type   | Required | Description                                     |
| -------- | ------ | -------- | ----------------------------------------------- |
| messages | array  | Yes      | Chat history. Each item has `role` and `content` |

Each message object:

| Field   | Type   | Required | Description                    |
| ------- | ------ | -------- | ------------------------------ |
| role    | string | Yes      | `"user"` or `"model"`          |
| content | string | Yes      | The message text               |

### Response

**Content-Type:** `text/event-stream`

The response is a server-sent event stream. Each event is a JSON object on a `data:` line.

**Event types:**

| Type  | Fields         | Description                    |
| ----- | -------------- | ------------------------------ |
| token | `text: string` | A chunk of the response text   |
| done  | —              | Stream completed successfully  |
| error | `error: string`| An error occurred              |

### Example

**Request:**

```json
{
  "messages": [
    { "role": "user", "content": "How do I set my wedding date?" }
  ]
}
```

**Response stream:**

```
data: {"type":"token","text":"To set your wedding date"}
data: {"type":"token","text":":\n\n1. Go to **Wedding Profile**"}
data: {"type":"token","text":" in the sidebar\n2. Click the **date picker**"}
data: {"type":"token","text":" in the Wedding Details section\n3. Select your date"}
data: {"type":"token","text":"\n4. Click **Save Wedding Profile**"}
data: {"type":"done"}
```

### Error Responses

| Status | Code        | Description                          |
| ------ | ----------- | ------------------------------------ |
| 400    | BAD_REQUEST | Missing or invalid messages array    |
| 401    | —           | Not authenticated                    |
