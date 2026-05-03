# Couple Profile API

Base path: `/api/v1/couple`

All endpoints require authentication (session cookie) and the `couple` role.

---

## GET /profile

Retrieve the current couple's wedding profile.

**Response (200):**

```json
{
  "coupleProfile": {
    "id": "uuid",
    "userId": "user-id",
    "weddingDate": "2026-05-15",
    "budgetCurrency": "ETB",
    "estimatedGuests": 150,
    "weddingTheme": "Traditional + Modern",
    "weddingLocation": "Addis Ababa",
    "latitude": 9.005401,
    "longitude": 38.764142,
    "partnerName": "Abebe",
    "createdAt": "2026-05-01T10:00:00.000Z",
    "updatedAt": "2026-05-01T10:00:00.000Z"
  }
}
```

**Response (404):**

```json
{ "error": { "message": "Couple profile not found" } }
```

---

## POST /profile

Create a new couple profile. Only one profile per user is allowed.

**Request Body:**

| Field            | Type     | Required | Default | Description                     |
|------------------|----------|----------|---------|---------------------------------|
| weddingDate      | string   | No       | null    | ISO date (YYYY-MM-DD)           |
| budgetCurrency   | string   | No       | "ETB"   | ISO-4217 currency code          |
| estimatedGuests  | number   | No       | null    | Estimated number of guests      |
| weddingTheme     | string   | No       | null    | e.g. "Traditional", "Modern"    |
| weddingLocation  | string   | No       | null    | City or venue name              |
| latitude         | number   | No       | null    | Venue latitude (decimal)        |
| longitude        | number   | No       | null    | Venue longitude (decimal)       |
| partnerName      | string   | No       | null    | Partner's name                  |

**Example Request:**

```json
{
  "weddingDate": "2026-05-15",
  "estimatedGuests": 150,
  "weddingTheme": "Traditional + Modern",
  "weddingLocation": "Addis Ababa",
  "latitude": 9.005401,
  "longitude": 38.764142,
  "partnerName": "Abebe",
  "budgetCurrency": "ETB"
}
```

**Response (201):**

```json
{
  "coupleProfile": { ... }
}
```

**Response (409):**

```json
{ "error": { "message": "Couple profile already exists" } }
```

---

## PATCH /profile

Update an existing couple profile. Only send the fields you want to change.

**Request Body:** Same fields as POST (all optional). Send `null` to clear a field.

**Example Request:**

```json
{
  "estimatedGuests": 200,
  "weddingLocation": "Adama"
}
```

**Response (200):**

```json
{
  "coupleProfile": { ... }
}
```

**Response (404):**

```json
{ "error": { "message": "Couple profile not found" } }
```
