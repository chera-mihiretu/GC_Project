# AI Wedding Advisor API

## POST /api/v1/ai/chat

Conversational AI endpoint that helps couples find wedding vendors through natural language. Uses Gemini with tool-calling for semantic search, vendor detail retrieval, and availability checking.

### Authentication

Requires a valid session cookie (authenticated user).

### Request

**Headers:**
| Header | Value |
|--------|-------|
| Content-Type | application/json |
| Cookie | (session cookie — sent automatically) |

**Body:**

```json
{
  "messages": [
    { "role": "user", "content": "I need a photographer in Addis Ababa under 30,000 ETB" }
  ]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| messages | ChatMessage[] | Yes | Conversation history array |
| messages[].role | "user" \| "model" | Yes | Who sent the message |
| messages[].content | string | Yes | Message text |

The full conversation history must be sent each request (stateless backend). The frontend maintains state.

### Response

**200 OK:**

```json
{
  "reply": "Here are some great photographers in Addis Ababa within your budget:\n\n1. **Selam Photography** — Located in Bole, they specialize in wedding photography with packages starting from 15,000 ETB. They have a 4.7 rating from 23 reviews.\n\n2. **Abebe's Lens** — A highly rated photographer near Piassa with 8 years of experience. Their packages range from 20,000 - 35,000 ETB.",
  "vendorCards": [
    {
      "id": "vendor-profile-id-1",
      "businessName": "Selam Photography",
      "category": ["Photography"],
      "rating": 4.7,
      "reviewCount": 23,
      "thumbnail": "https://storage.supabase.co/...",
      "priceRangeMin": 15000,
      "priceRangeMax": 45000,
      "location": "Addis Ababa, Bole"
    },
    {
      "id": "vendor-profile-id-2",
      "businessName": "Abebe's Lens",
      "category": ["Photography", "Videography"],
      "rating": 4.5,
      "reviewCount": 12,
      "thumbnail": "https://storage.supabase.co/...",
      "priceRangeMin": 20000,
      "priceRangeMax": 35000,
      "location": "Addis Ababa, Piassa"
    }
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| reply | string | AI-generated text response with recommendations |
| vendorCards | VendorCard[] | Structured vendor data for rendering clickable cards |
| vendorCards[].id | string | Vendor profile ID (use for linking to /vendors/[id]) |
| vendorCards[].businessName | string | Business display name |
| vendorCards[].category | string[] | Service categories |
| vendorCards[].rating | number | Average rating (0-5) |
| vendorCards[].reviewCount | number | Total review count |
| vendorCards[].thumbnail | string \| null | First portfolio image URL |
| vendorCards[].priceRangeMin | number \| null | Minimum price in ETB |
| vendorCards[].priceRangeMax | number \| null | Maximum price in ETB |
| vendorCards[].location | string \| null | City/area |

### Error Responses

**400 Bad Request:**

```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "messages array is required"
  }
}
```

**401 Unauthorized:**

Returned when no valid session cookie is present.

**500 Internal Server Error:**

```json
{
  "error": {
    "code": "AI_ERROR",
    "message": "Failed to process AI request"
  }
}
```

### Example Multi-Turn Conversation

**Request (follow-up):**

```json
{
  "messages": [
    { "role": "user", "content": "I need a photographer in Addis Ababa under 30,000 ETB" },
    { "role": "model", "content": "Here are some great photographers..." },
    { "role": "user", "content": "Is Selam Photography available on December 15, 2026?" }
  ]
}
```

### Notes

- The AI uses three internal tools: `searchVendors` (hybrid vector + SQL search), `getVendorDetail`, and `checkAvailability`
- Response time varies (typically 3-8 seconds) due to Gemini processing and potential multi-tool calls
- Only verified vendors appear in search results
- The AI responds in both English and Amharic based on the user's language
