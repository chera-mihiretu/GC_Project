# Budget API

Base URL: `/api/v1/budget`

All endpoints require authentication and the `couple` role.

---

## GET /api/v1/budget

Get the current user's wedding budget.

### Response

**200 OK**
```json
{
  "budget": {
    "id": "uuid",
    "userId": "string",
    "name": "My Wedding Budget",
    "totalAmount": 500000,
    "currency": "ETB",
    "notes": "Including reception and honeymoon",
    "createdAt": "2026-05-14T08:00:00.000Z",
    "updatedAt": "2026-05-14T08:00:00.000Z"
  }
}
```

If no budget exists:
```json
{
  "budget": null
}
```

**401 Unauthorized** — Missing or invalid session.

**403 Forbidden** — User does not have `couple` role.

---

## POST /api/v1/budget

Create a new wedding budget. A user can only have one budget.

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| totalAmount | number | Yes | Total budget amount (>= 0) |
| name | string | No | Budget name (default: "My Wedding Budget") |
| currency | string | No | Currency code (default: "ETB") |
| notes | string | No | Optional notes |

### Example Request
```json
{
  "totalAmount": 500000,
  "name": "Our Dream Wedding",
  "currency": "ETB",
  "notes": "Budget for everything including honeymoon"
}
```

### Response

**201 Created**
```json
{
  "budget": {
    "id": "uuid",
    "userId": "string",
    "name": "Our Dream Wedding",
    "totalAmount": 500000,
    "currency": "ETB",
    "notes": "Budget for everything including honeymoon",
    "createdAt": "2026-05-14T08:00:00.000Z",
    "updatedAt": "2026-05-14T08:00:00.000Z"
  }
}
```

**400 Bad Request** — `totalAmount` is missing or invalid.
```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "totalAmount is required and must be a non-negative number"
  }
}
```

**409 Conflict** — Budget already exists.
```json
{
  "error": {
    "code": "CONFLICT",
    "message": "Budget already exists. Use PATCH to update."
  }
}
```

---

## PATCH /api/v1/budget

Update the existing budget. Only send fields you want to change.

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| totalAmount | number | No | New total amount (>= 0) |
| name | string | No | New budget name |
| currency | string | No | New currency code |
| notes | string \| null | No | New notes (or null to clear) |

### Example Request
```json
{
  "totalAmount": 600000,
  "notes": null
}
```

### Response

**200 OK**
```json
{
  "budget": {
    "id": "uuid",
    "userId": "string",
    "name": "Our Dream Wedding",
    "totalAmount": 600000,
    "currency": "ETB",
    "notes": null,
    "createdAt": "2026-05-14T08:00:00.000Z",
    "updatedAt": "2026-05-14T10:30:00.000Z"
  }
}
```

**400 Bad Request** — `totalAmount` is present but invalid.

**404 Not Found** — No budget exists for this user.
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "No budget found. Create one first."
  }
}
```

---

## DELETE /api/v1/budget

Delete the user's budget entirely.

### Response

**200 OK**
```json
{
  "success": true
}
```

**404 Not Found** — No budget exists for this user.
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "No budget found"
  }
}
```

---

# Budget Categories API

Endpoints for managing budget category allocations. All require authentication and the `couple` role.

**Note:** When a budget is created via `POST /api/v1/budget`, 8 default categories are auto-seeded (Venue & Decor 30%, Catering & Drinks 25%, Photography & Video 15%, Attire & Beauty 10%, Music & Entertainment 8%, Invitations & Stationery 4%, Transportation 3%, Miscellaneous 5%).

---

## GET /api/v1/budget/categories

List all budget categories for the current user's budget.

### Response

**200 OK**
```json
{
  "categories": [
    {
      "id": "uuid",
      "budgetId": "uuid",
      "name": "Venue & Decor",
      "allocatedAmount": 150000,
      "sortOrder": 0,
      "vendors": [
        {
          "id": "vendor-profile-uuid",
          "businessName": "Royal Garden Venue",
          "priceRangeMin": 80000,
          "priceRangeMax": 200000,
          "rating": 4.8,
          "reviewCount": 42,
          "location": "Addis Ababa",
          "reason": "Best rated venue in your area"
        }
      ],
      "createdAt": "2026-05-14T08:00:00.000Z",
      "updatedAt": "2026-05-14T08:00:00.000Z"
    }
  ],
  "totalAllocated": 500000,
  "unallocated": 0
}
```

Each category includes a `vendors` array of saved vendor recommendations (empty if none were suggested or if the category was created manually).

**404 Not Found** — No budget exists.

---

## POST /api/v1/budget/categories

Add a new category to the user's budget.

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Category name |
| allocatedAmount | number | Yes | Amount allocated (>= 0) |
| sortOrder | number | No | Display order (default: 0) |

### Example Request
```json
{
  "name": "Flowers & Bouquets",
  "allocatedAmount": 25000
}
```

### Response

**201 Created**
```json
{
  "category": {
    "id": "uuid",
    "budgetId": "uuid",
    "name": "Flowers & Bouquets",
    "allocatedAmount": 25000,
    "sortOrder": 0,
    "createdAt": "2026-05-14T09:00:00.000Z",
    "updatedAt": "2026-05-14T09:00:00.000Z"
  }
}
```

**400 Bad Request** — Missing or invalid `name` or `allocatedAmount`.

**404 Not Found** — No budget exists.

---

## PATCH /api/v1/budget/categories/:id

Update an existing budget category. Only send fields you want to change.

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | No | New category name |
| allocatedAmount | number | No | New allocated amount (>= 0) |
| sortOrder | number | No | New display order |

### Example Request
```json
{
  "allocatedAmount": 30000
}
```

### Response

**200 OK**
```json
{
  "category": {
    "id": "uuid",
    "budgetId": "uuid",
    "name": "Flowers & Bouquets",
    "allocatedAmount": 30000,
    "sortOrder": 0,
    "createdAt": "2026-05-14T09:00:00.000Z",
    "updatedAt": "2026-05-14T09:15:00.000Z"
  }
}
```

**404 Not Found** — Category or budget not found.

---

## DELETE /api/v1/budget/categories/:id

Delete a budget category.

### Response

**200 OK**
```json
{
  "success": true
}
```

**404 Not Found** — Category or budget not found.

---

# AI-Powered Category Suggestions

## POST /api/v1/budget/suggest-categories

Use the AI wizard answers to generate a personalized, vendor-aware category allocation. The backend first searches the platform's verified vendor database (via vector embeddings) to find real vendors matching the couple's priorities and extras. It then sends the vendor data along with preferences to Gemini AI, which returns an optimized budget breakdown with vendor recommendations per category, and drops categories that exceed the couple's budget.

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| priorities | string[] | Yes | Top priorities (1-3 items, e.g., "Venue", "Photography") |
| weddingStyle | string | Yes | One of: "intimate", "classic", "grand", "lavish" |
| extras | string[] | No | Optional add-ons (e.g., "Transportation", "Videography") |

### Example Request
```json
{
  "priorities": ["Photography", "Venue", "Food & Drinks"],
  "weddingStyle": "classic",
  "extras": ["Transportation", "Videography"]
}
```

### Response

**200 OK**
```json
{
  "categories": [
    {
      "name": "Venue & Decor",
      "allocatedAmount": 150000,
      "sortOrder": 0,
      "vendors": [
        {
          "id": "vendor-uuid-1",
          "businessName": "Royal Garden Venue",
          "priceRangeMin": 80000,
          "priceRangeMax": 200000,
          "rating": 4.8,
          "reviewCount": 42,
          "location": "Addis Ababa",
          "reason": "Best rated venue in your area, fits classic style"
        }
      ]
    },
    {
      "name": "Photography & Video",
      "allocatedAmount": 100000,
      "sortOrder": 1,
      "vendors": [
        {
          "id": "vendor-uuid-2",
          "businessName": "Alem Photography",
          "priceRangeMin": 25000,
          "priceRangeMax": 60000,
          "rating": 4.9,
          "reviewCount": 87,
          "location": "Addis Ababa",
          "reason": "Top-rated photographer, great value for wedding packages"
        }
      ]
    },
    {
      "name": "Miscellaneous",
      "allocatedAmount": 25000,
      "sortOrder": 7,
      "vendors": []
    }
  ],
  "dropped": [
    {
      "name": "Live Band",
      "reason": "Your budget of 500,000 ETB cannot accommodate live band services which start at 80,000 ETB after allocating for higher-priority categories"
    }
  ]
}
```

#### Category Object

| Field | Type | Description |
|-------|------|-------------|
| name | string | Category name |
| allocatedAmount | number | Suggested amount in budget currency |
| sortOrder | number | Display order (0-based) |
| vendors | SuggestedVendor[] | 0-3 recommended vendors from the platform |

#### SuggestedVendor Object

| Field | Type | Description |
|-------|------|-------------|
| id | string | Vendor profile UUID (can link to `/vendors/:id`) |
| businessName | string | Vendor's business name |
| priceRangeMin | number \| null | Minimum price |
| priceRangeMax | number \| null | Maximum price |
| rating | number | Average rating (0-5) |
| reviewCount | number | Total reviews |
| location | string \| null | Vendor location |
| reason | string | AI-generated reason for the recommendation |

#### DroppedCategory Object

| Field | Type | Description |
|-------|------|-------------|
| name | string | Name of the dropped category |
| reason | string | Explanation of why it was dropped (budget constraints) |

**400 Bad Request** — Missing `priorities` or `weddingStyle`.

**404 Not Found** — No budget exists (needed to determine total amount).

---

## PUT /api/v1/budget/categories

Bulk replace all budget categories and their recommended vendors. Deletes existing categories (and their vendors via CASCADE) and inserts the new set. Used by the wizard to apply AI-generated suggestions along with vendor recommendations.

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| categories | array | Yes | Array of category objects |

#### Category Object (Request)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Category name |
| allocatedAmount | number | Yes | Amount allocated (>= 0) |
| vendors | SuggestedVendor[] | No | Vendor recommendations to persist |

Each vendor object follows the same `SuggestedVendor` schema documented under `POST /suggest-categories`.

### Example Request
```json
{
  "categories": [
    {
      "name": "Venue & Decor",
      "allocatedAmount": 150000,
      "vendors": [
        {
          "id": "vendor-uuid-1",
          "businessName": "Royal Garden Venue",
          "priceRangeMin": 80000,
          "priceRangeMax": 200000,
          "rating": 4.8,
          "reviewCount": 42,
          "location": "Addis Ababa",
          "reason": "Best rated venue in your area"
        }
      ]
    },
    { "name": "Miscellaneous", "allocatedAmount": 50000 }
  ]
}
```

### Response

**200 OK**
```json
{
  "categories": [
    {
      "id": "uuid",
      "budgetId": "uuid",
      "name": "Venue & Decor",
      "allocatedAmount": 150000,
      "sortOrder": 0,
      "vendors": [
        {
          "id": "vendor-uuid-1",
          "businessName": "Royal Garden Venue",
          "priceRangeMin": 80000,
          "priceRangeMax": 200000,
          "rating": 4.8,
          "reviewCount": 42,
          "location": "Addis Ababa",
          "reason": "Best rated venue in your area"
        }
      ],
      "createdAt": "2026-05-14T09:00:00.000Z",
      "updatedAt": "2026-05-14T09:00:00.000Z"
    }
  ]
}
```

**400 Bad Request** — Empty array or invalid category entries.

**404 Not Found** — No budget exists.

---

## POST /api/v1/budget/categories/:id/draft-message

Generate an AI-drafted inquiry message for the vendors recommended in a budget category. Returns the draft for the couple to review before sending.

### URL Params

| Param | Type | Description |
|-------|------|-------------|
| id | string (UUID) | Budget category ID |

### Response

**200 OK**
```json
{
  "draft": "Hi! We're planning our wedding and are very excited about finding the perfect venue...",
  "categoryName": "Venue & Decor",
  "vendors": [
    { "id": "vendor-uuid-1", "businessName": "Royal Garden Venue" },
    { "id": "vendor-uuid-2", "businessName": "Grand Palace Events" }
  ]
}
```

**404 Not Found** — Category not found or has no recommended vendors.

---

## POST /api/v1/budget/categories/:id/contact-vendors

Send a message to all recommended vendors in a budget category. If no custom message is provided, the AI drafts one automatically. Messages are delivered via the real-time chat system and vendors receive them in their Messages inbox via Socket.IO.

### URL Params

| Param | Type | Description |
|-------|------|-------------|
| id | string (UUID) | Budget category ID |

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| message | string | No | Custom message to send. If omitted, AI drafts one based on category and budget context. |

### Example Request
```json
{
  "message": "Hi! We're planning our wedding and would love to learn about your venue packages. Our budget for the venue is around 150,000 ETB. Could you share your availability and pricing?"
}
```

### Response

**200 OK**
```json
{
  "success": true,
  "messageSent": "Hi! We're planning our wedding and would love to learn...",
  "summary": "Message sent to 2 vendors for Venue & Decor.",
  "results": [
    {
      "vendorProfileId": "vendor-uuid-1",
      "businessName": "Royal Garden Venue",
      "conversationId": "conversation-uuid-1",
      "sent": true
    },
    {
      "vendorProfileId": "vendor-uuid-2",
      "businessName": "Grand Palace Events",
      "conversationId": "conversation-uuid-2",
      "sent": true
    }
  ]
}
```

#### Result Object

| Field | Type | Description |
|-------|------|-------------|
| vendorProfileId | string | Vendor profile UUID |
| businessName | string | Vendor's business name |
| conversationId | string | Chat conversation UUID (can navigate to `/messages?cid=...`) |
| sent | boolean | Whether the message was successfully delivered |
| error | string? | Error message if `sent` is false |

**404 Not Found** — Category not found, no budget, or no recommended vendors.

---

## 6. Expenses

### 6.1 List Expenses

**Endpoint:** `GET /api/v1/budget/expenses`

**Description:** Retrieve all expenses for the user's budget. Supports filtering by category and pagination.

**Auth:** Required (role: couple)

**Query Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| categoryId | string | No | Filter by category UUID |
| limit | number | No | Max results (default: 50) |
| offset | number | No | Pagination offset (default: 0) |

**Response (200):**

```json
{
  "expenses": [
    {
      "id": "expense-uuid",
      "budgetId": "budget-uuid",
      "categoryId": "category-uuid",
      "description": "Deposit for photographer",
      "amount": 15000,
      "vendorName": "Studio Vision",
      "expenseDate": "2026-05-01",
      "createdAt": "2026-05-01T10:00:00Z",
      "updatedAt": "2026-05-01T10:00:00Z"
    }
  ],
  "total": 1
}
```

---

### 6.2 Get Expense Summary

**Endpoint:** `GET /api/v1/budget/expenses/summary`

**Description:** Returns total budget, total spent, remaining amount, and per-category spending breakdown.

**Auth:** Required (role: couple)

**Response (200):**

```json
{
  "totalBudget": 500000,
  "totalSpent": 125000,
  "remaining": 375000,
  "byCategory": [
    { "categoryId": "cat-uuid-1", "totalSpent": 75000 },
    { "categoryId": "cat-uuid-2", "totalSpent": 50000 }
  ]
}
```

---

### 6.3 Create Expense

**Endpoint:** `POST /api/v1/budget/expenses`

**Description:** Log a new expense against the user's budget.

**Auth:** Required (role: couple)

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| description | string | Yes | What this expense is for |
| amount | number | Yes | Amount spent (positive) |
| categoryId | string | No | Budget category UUID (null = uncategorized) |
| vendorName | string | No | Name of the vendor/payee |
| expenseDate | string | No | Date in YYYY-MM-DD format (defaults to today) |

**Example Request:**

```json
{
  "description": "Photographer deposit",
  "amount": 15000,
  "categoryId": "category-uuid",
  "vendorName": "Studio Vision",
  "expenseDate": "2026-05-01"
}
```

**Response (201):**

```json
{
  "id": "expense-uuid",
  "budgetId": "budget-uuid",
  "categoryId": "category-uuid",
  "description": "Photographer deposit",
  "amount": 15000,
  "vendorName": "Studio Vision",
  "expenseDate": "2026-05-01",
  "createdAt": "2026-05-01T10:00:00Z",
  "updatedAt": "2026-05-01T10:00:00Z"
}
```

**400 Bad Request** — Missing/invalid description or amount.

---

### 6.4 Update Expense

**Endpoint:** `PATCH /api/v1/budget/expenses/:expenseId`

**Description:** Update an existing expense. Only provide fields to change.

**Auth:** Required (role: couple)

**Request Body (all optional):**

| Field | Type | Description |
|-------|------|-------------|
| description | string | Updated description |
| amount | number | Updated amount (must be positive) |
| categoryId | string \| null | Change or remove category |
| vendorName | string \| null | Change or remove vendor name |
| expenseDate | string | Updated date (YYYY-MM-DD) |

**Response (200):** Returns the updated expense object.

**404 Not Found** — Expense not found or does not belong to this budget.

---

### 6.5 Delete Expense

**Endpoint:** `DELETE /api/v1/budget/expenses/:expenseId`

**Description:** Permanently delete an expense.

**Auth:** Required (role: couple)

**Response (204):** No content.

**404 Not Found** — Expense not found or does not belong to this budget.
