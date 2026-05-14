import { apiFetch } from "./auth.service";

export interface ChatMessage {
  role: "user" | "model";
  content: string;
}

export interface VendorCard {
  id: string;
  businessName: string;
  category: string[];
  rating: number;
  reviewCount: number;
  thumbnail: string | null;
  priceRangeMin: number | null;
  priceRangeMax: number | null;
  location: string | null;
}

export interface BookingCardData {
  bookingId: string;
  vendorBusinessName: string;
  vendorProfileId: string;
  serviceCategory: string;
  eventDate: string;
  status: string;
  createdAt: string;
}

export interface PendingAction {
  type: "send_message" | "book_vendor" | "cancel_booking" | "reschedule_booking" | "confirm_action";
  description: string;
  params: Record<string, unknown>;
}

export interface AIResponse {
  reply: string;
  vendorCards: VendorCard[];
  pendingAction?: PendingAction;
  error?: { code: string; message: string };
}

export interface ConfirmActionResponse {
  success: boolean;
  summary: string;
}

export interface AISession {
  id: string;
  userId: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AIMessageRecord {
  id: string;
  sessionId: string;
  role: "user" | "model";
  content: string;
  vendorCards: VendorCard[] | null;
  pendingAction: PendingAction | null;
  createdAt: string;
}

export interface StreamCallbacks {
  onToken: (text: string) => void;
  onToolStart: (tool: string) => void;
  onToolEnd: (tool: string) => void;
  onVendorCards: (cards: VendorCard[]) => void;
  onBookingCards: (cards: BookingCardData[]) => void;
  onAction: (action: PendingAction) => void;
  onSession: (sessionId: string) => void;
  onDone: (sessionId?: string) => void;
  onError: (error: string) => void;
}

// --- Session API ---

export async function createAISession(title?: string): Promise<AISession> {
  const res = await apiFetch("/api/v1/ai/sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  return res.json();
}

export async function listAISessions(limit = 50, offset = 0): Promise<{ sessions: AISession[]; total: number }> {
  const res = await apiFetch(`/api/v1/ai/sessions?limit=${limit}&offset=${offset}`);
  if (!res.ok) return { sessions: [], total: 0 };
  return res.json();
}

export async function loadSessionMessages(sessionId: string): Promise<AIMessageRecord[]> {
  const res = await apiFetch(`/api/v1/ai/sessions/${sessionId}/messages`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.messages ?? [];
}

export async function deleteAISession(sessionId: string): Promise<boolean> {
  const res = await apiFetch(`/api/v1/ai/sessions/${sessionId}`, { method: "DELETE" });
  return res.ok;
}

// --- Streaming Chat ---

function getBackendUrl(): string {
  if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_BACKEND_URL) {
    return process.env.NEXT_PUBLIC_BACKEND_URL;
  }
  return "http://localhost:5000";
}

export async function streamAIMessage(
  messages: ChatMessage[],
  callbacks: StreamCallbacks,
  sessionId?: string,
): Promise<void> {
  // Call backend directly to avoid Next.js rewrite proxy buffering SSE
  const res = await fetch(`${getBackendUrl()}/api/v1/ai/chat/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ messages, sessionId }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    callbacks.onError(data?.error?.message || "Something went wrong. Please try again.");
    return;
  }

  const reader = res.body?.getReader();
  if (!reader) {
    callbacks.onError("Streaming not supported");
    return;
  }

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    let currentEvent = "";
    for (const line of lines) {
      if (line.startsWith("event: ")) {
        currentEvent = line.slice(7);
      } else if (line.startsWith("data: ")) {
        const data = line.slice(6);
        try {
          const parsed = JSON.parse(data);
          switch (currentEvent) {
            case "token":
              callbacks.onToken(parsed.text);
              break;
            case "tool_start":
              callbacks.onToolStart(parsed.tool);
              break;
            case "tool_end":
              callbacks.onToolEnd(parsed.tool);
              break;
            case "vendor_cards":
              callbacks.onVendorCards(parsed.cards);
              break;
            case "booking_cards":
              callbacks.onBookingCards(parsed.cards);
              break;
            case "action":
              callbacks.onAction(parsed);
              break;
            case "session":
              callbacks.onSession(parsed.sessionId);
              break;
            case "done":
              callbacks.onDone(parsed.sessionId);
              break;
            case "error":
              callbacks.onError(parsed.message);
              break;
          }
        } catch {
          // Skip malformed JSON
        }
        currentEvent = "";
      }
    }
  }
}

// --- Legacy non-streaming ---

export async function sendAIMessage(messages: ChatMessage[]): Promise<AIResponse> {
  const res = await apiFetch("/api/v1/ai/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    return {
      reply: data?.error?.message || "Something went wrong. Please try again.",
      vendorCards: [],
      error: data?.error,
    };
  }

  return res.json();
}

// --- Confirm Action ---

export async function confirmAction(action: PendingAction): Promise<ConfirmActionResponse> {
  const res = await apiFetch("/api/v1/ai/confirm-action", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    return {
      success: false,
      summary: data?.error?.message || "Failed to execute action.",
    };
  }

  return res.json();
}
