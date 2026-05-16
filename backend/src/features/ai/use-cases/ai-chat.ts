import { Type, type FunctionDeclaration } from "@google/genai";
import { getGeminiClient } from "../infrastructure/gemini-client.js";
import type { ChatMessage, VendorCard, BookingCard, AIResponse, PendingAction } from "../domain/types.js";
import {
  executeSearchVendors,
  executeGetVendorDetail,
  executeCheckAvailability,
  executeSendMessageToVendors,
  executeReadMessages,
  executeReadAllConversations,
  executeListMyBookings,
  executeGetBookingDetail,
} from "./agent-tools.js";

export interface CoupleContext {
  name: string;
  partnerName: string | null;
  weddingDate: string | null;
  weddingLocation: string | null;
  estimatedGuests: number | null;
  weddingTheme: string | null;
}

const CHAT_MODEL = "gemini-2.5-flash";
const MAX_TOOL_ROUNDS = 8;

const SYSTEM_PROMPT = `You are Twedar AI — a proactive wedding planning agent that works on behalf of Ethiopian couples. You don't just give advice — you take action. You find vendors, message them, negotiate, book them, and manage the entire vendor coordination process so the couple doesn't have to.

Think of yourself as the couple's personal wedding coordinator who handles all the vendor logistics.

Your capabilities:
- Search and discover vendors by service type, budget, location, and preferences
- Get detailed vendor information (portfolio, reviews, pricing)
- Check vendor availability for specific dates
- Send messages to vendors on behalf of the couple (inquiries, negotiations, coordination)
- Read vendor replies and conversation history
- Book vendors for the wedding
- Manage and track all vendor communications
- View, cancel, and reschedule existing bookings

Behavior & Personality:
- Be proactive: suggest next steps, offer to reach out to vendors, follow up on conversations
- Be efficient: when the user gives you a task like "find me a venue and photographer", handle both
- Be action-oriented: don't just list options — offer to message, check availability, and book
- Be conversational and warm. Respond in English or Amharic — match the user's language
- When you recommend vendors, briefly explain WHY each one fits their needs

Rules:
1. ALWAYS use searchVendors to find vendors — never fabricate vendor names or data.
2. When presenting vendors, include business name, location, price range (ETB), rating, and fit reason.
3. If the user mentions a budget, use the maxBudget filter.
4. Proactively check availability when you know the couple's wedding date.
5. If you need more info to act effectively, ask — but keep questions focused and minimal.
6. CRITICAL — ACTION CONFIRMATION RULE: For ANY action with side effects (sending messages, booking, cancelling, rescheduling), you MUST ALWAYS output the [ACTION_CONFIRM] tag. The user will see Confirm/Cancel BUTTONS in the UI. NEVER ask "would you like me to cancel?" or "should I proceed?" as plain text — instead ALWAYS output the [ACTION_CONFIRM] tag so the user gets clickable buttons. Briefly explain what you plan to do, then immediately output the tag on the same response.
   Format: [ACTION_CONFIRM]{"type":"<type>","description":"<human readable>","params":{...}}[/ACTION_CONFIRM]
7. For sending messages: [ACTION_CONFIRM]{"type":"send_message","description":"Send message to <vendors>","params":{"vendorProfileIds":["id1"],"message":"text"}}[/ACTION_CONFIRM]
8. For bookings: [ACTION_CONFIRM]{"type":"book_vendor","description":"Book <vendor> for <service> on <date>","params":{"vendorProfileId":"id","serviceCategory":"category","eventDate":"YYYY-MM-DD","message":"optional notes"}}[/ACTION_CONFIRM]
   Always check availability before proposing a booking.
9. For cancellation: [ACTION_CONFIRM]{"type":"cancel_booking","description":"Cancel booking with <vendor> on <date>","params":{"bookingId":"<uuid>"}}[/ACTION_CONFIRM]
10. For rescheduling: [ACTION_CONFIRM]{"type":"reschedule_booking","description":"Reschedule <vendor> from <old date> to <new date>","params":{"bookingId":"<uuid>","newEventDate":"YYYY-MM-DD"}}[/ACTION_CONFIRM]
11. After confirmed actions, inform the user of the result and suggest next steps.
12. CRITICAL: Always use exact vendorProfileId UUIDs from search results. Never guess IDs.
13. When the user says things like "handle it", "go ahead", "arrange everything" — take initiative. Search vendors, check availability, compose messages, and present actions for confirmation buttons.
14. Track context across the conversation. If you already found vendors, don't re-search unless asked. Use the IDs you already have.
15. NEVER ask the user "Do you want me to proceed?" or "Shall I cancel?" in plain text. ALWAYS use [ACTION_CONFIRM] so the UI renders buttons. This applies to ALL actions: send_message, book_vendor, cancel_booking, reschedule_booking.

Booking Management Rules:
16. You can read the couple's bookings using \`listMyBookings\` (with optional status filter) and \`getBookingDetail\` (by booking ID).
17. When displaying booking info, always mention: vendor name, event date, status, and service category.
18. When the user asks to cancel a booking, first use \`listMyBookings\` or \`getBookingDetail\` to find the booking details, then IMMEDIATELY output the [ACTION_CONFIRM] tag with type "cancel_booking". Do NOT ask "are you sure?" — the buttons ARE the confirmation.
19. You cannot cancel or reschedule bookings that are already "completed" or "cancelled".`;


const toolDeclarations: FunctionDeclaration[] = [
  {
    name: "searchVendors",
    description: "Search for wedding vendors using semantic search combined with filters. Use this to find vendors matching the couple's needs.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: {
          type: Type.STRING,
          description: "Natural language description of what the couple is looking for (e.g. 'affordable outdoor venue in Addis Ababa for 200 guests')",
        },
        categories: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Filter by service categories (e.g. ['Venue', 'Photography', 'Catering']). Optional.",
        },
        location: {
          type: Type.STRING,
          description: "Filter by location/city name (e.g. 'Addis Ababa'). Optional.",
        },
        maxBudget: {
          type: Type.NUMBER,
          description: "Maximum budget in ETB. Only return vendors whose minimum price is at or below this. Optional.",
        },
        minRating: {
          type: Type.NUMBER,
          description: "Minimum rating (1-5). Optional.",
        },
        limit: {
          type: Type.NUMBER,
          description: "Number of results to return (default 5, max 10).",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "getVendorDetail",
    description: "Get full details about a specific vendor including reviews, portfolio, and availability. Use this when the user wants more info about a specific vendor.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        vendorProfileId: {
          type: Type.STRING,
          description: "The vendor's profile ID.",
        },
      },
      required: ["vendorProfileId"],
    },
  },
  {
    name: "checkAvailability",
    description: "Check if a vendor is available for a specific date range. Use when the user mentions a wedding date.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        vendorProfileId: {
          type: Type.STRING,
          description: "The vendor's profile ID to check.",
        },
        startDate: {
          type: Type.STRING,
          description: "Start date in YYYY-MM-DD format.",
        },
        endDate: {
          type: Type.STRING,
          description: "End date in YYYY-MM-DD format.",
        },
      },
      required: ["vendorProfileId", "startDate", "endDate"],
    },
  },
  {
    name: "sendMessageToVendors",
    description: "Send a chat message to one or more vendors on behalf of the couple. Use this when the user explicitly asks you to contact, message, or reach out to vendors. IMPORTANT: Always confirm the message content with the user before calling this tool.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        vendorProfileIds: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Array of vendor profile IDs to message.",
        },
        message: {
          type: Type.STRING,
          description: "The message to send to the vendors. Should be polite and professional, written from the couple's perspective.",
        },
      },
      required: ["vendorProfileIds", "message"],
    },
  },
  {
    name: "readMessages",
    description: "Read recent chat messages between the couple and a specific vendor. Use this when the user wants to check replies, see conversation history, or asks 'what did vendor X say?'. You can pass either a vendorProfileId or the vendor's business name.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        vendorProfileId: {
          type: Type.STRING,
          description: "The vendor's profile ID or business name. Can use the exact vendorProfileId from search results, or the vendor's business name.",
        },
        limit: {
          type: Type.NUMBER,
          description: "Number of recent messages to retrieve (default 20, max 50).",
        },
      },
      required: ["vendorProfileId"],
    },
  },
  {
    name: "readAllConversations",
    description: "List all the couple's conversations with vendors, showing the vendor name, vendorProfileId, category, latest message, and unread count for each. Use when the user asks 'do I have any messages?', 'check my inbox', 'who replied?', or wants to see all their vendor interactions. The vendorProfileId from results can be used with other tools like readMessages, getVendorDetail, or checkAvailability.",
    parameters: {
      type: Type.OBJECT,
      properties: {},
      required: [],
    },
  },
  {
    name: "listMyBookings",
    description: "List the couple's bookings. Returns vendor name, date, status, category for each booking. Use when the user asks 'show my bookings', 'what have I booked?', 'do I have any pending bookings?', or wants to review their booking list.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        status: {
          type: Type.STRING,
          description: "Filter by status: 'pending', 'accepted', 'declined', 'cancelled', 'deposit_paid', 'completed'. Optional — returns all if omitted.",
        },
        limit: {
          type: Type.NUMBER,
          description: "Max results to return (default 10, max 20).",
        },
      },
      required: [],
    },
  },
  {
    name: "getBookingDetail",
    description: "Get full details of a specific booking by its ID. Use when the user asks about a particular booking or you need complete info (message, status, dates, decline reason) for a booking.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        bookingId: {
          type: Type.STRING,
          description: "The booking UUID to look up.",
        },
      },
      required: ["bookingId"],
    },
  },
];

async function executeFunctionCall(
  name: string,
  args: Record<string, unknown>,
  userId: string,
): Promise<{ result: unknown; vendorCards: VendorCard[]; bookingCards: BookingCard[] }> {
  switch (name) {
    case "searchVendors": {
      const { vendors, searchContext } = await executeSearchVendors({
        query: args.query as string,
        categories: args.categories as string[] | undefined,
        location: args.location as string | undefined,
        maxBudget: args.maxBudget as number | undefined,
        minRating: args.minRating as number | undefined,
        limit: Math.min((args.limit as number) || 5, 10),
      });
      return { result: searchContext, vendorCards: vendors, bookingCards: [] };
    }
    case "getVendorDetail": {
      const detail = await executeGetVendorDetail(args.vendorProfileId as string);
      if (!detail) return { result: `Vendor not found for ID "${args.vendorProfileId}". The ID may be incorrect — use searchVendors to get the correct vendorProfileId.`, vendorCards: [], bookingCards: [] };
      const card: VendorCard = {
        id: detail.id,
        businessName: detail.businessName,
        category: detail.category,
        rating: detail.rating,
        reviewCount: detail.reviewCount,
        thumbnail: null,
        priceRangeMin: detail.priceRangeMin,
        priceRangeMax: detail.priceRangeMax,
        location: detail.location,
      };
      return { result: JSON.stringify(detail), vendorCards: [card], bookingCards: [] };
    }
    case "checkAvailability": {
      const availability = await executeCheckAvailability(
        args.vendorProfileId as string,
        args.startDate as string,
        args.endDate as string,
      );
      if (!availability) return { result: `Vendor not found for ID "${args.vendorProfileId}". The ID may be incorrect — use searchVendors to get the correct vendorProfileId.`, vendorCards: [], bookingCards: [] };
      return { result: JSON.stringify(availability), vendorCards: [], bookingCards: [] };
    }
    case "sendMessageToVendors": {
      const results = await executeSendMessageToVendors(
        args.vendorProfileIds as string[],
        args.message as string,
        userId,
      );
      return { result: JSON.stringify(results), vendorCards: [], bookingCards: [] };
    }
    case "readMessages": {
      const msgResult = await executeReadMessages(
        args.vendorProfileId as string,
        userId,
        Math.min((args.limit as number) || 20, 50),
      );
      if (!msgResult) return { result: `Vendor not found for ID "${args.vendorProfileId}". Use searchVendors or readAllConversations to get valid IDs.`, vendorCards: [], bookingCards: [] };
      if (msgResult.messages.length === 0) {
        return { result: `No messages yet with ${msgResult.vendorBusinessName}. No conversation exists.`, vendorCards: [], bookingCards: [] };
      }
      return { result: JSON.stringify(msgResult), vendorCards: [], bookingCards: [] };
    }
    case "readAllConversations": {
      const conversations = await executeReadAllConversations(userId);
      if (conversations.length === 0) {
        return { result: "No conversations found. The couple hasn't messaged any vendors yet.", vendorCards: [], bookingCards: [] };
      }
      return { result: JSON.stringify(conversations), vendorCards: [], bookingCards: [] };
    }
    case "listMyBookings": {
      const bookings = await executeListMyBookings(
        userId,
        args.status as string | undefined,
        (args.limit as number) || 10,
      );
      if (bookings.length === 0) {
        return { result: "No bookings found matching the criteria.", vendorCards: [], bookingCards: [] };
      }
      const bCards: BookingCard[] = bookings.map((b) => ({
        bookingId: b.bookingId,
        vendorBusinessName: b.vendorBusinessName,
        vendorProfileId: b.vendorProfileId,
        serviceCategory: b.serviceCategory,
        eventDate: b.eventDate,
        status: b.status,
        createdAt: b.createdAt,
      }));
      return { result: JSON.stringify(bookings), vendorCards: [], bookingCards: bCards };
    }
    case "getBookingDetail": {
      const detail = await executeGetBookingDetail(args.bookingId as string, userId);
      if (!detail) return { result: `Booking not found with ID "${args.bookingId}". It may not exist or may not belong to this user.`, vendorCards: [], bookingCards: [] };
      const bCard: BookingCard = {
        bookingId: detail.bookingId,
        vendorBusinessName: detail.vendorBusinessName,
        vendorProfileId: detail.vendorProfileId,
        serviceCategory: detail.serviceCategory,
        eventDate: detail.eventDate,
        status: detail.status,
        createdAt: detail.createdAt,
      };
      return { result: JSON.stringify(detail), vendorCards: [], bookingCards: [bCard] };
    }
    default:
      return { result: `Unknown tool: ${name}`, vendorCards: [], bookingCards: [] };
  }
}

function buildSystemPrompt(coupleContext?: CoupleContext): string {
  let systemPrompt = SYSTEM_PROMPT;
  if (coupleContext) {
    const contextLines: string[] = ["\n\n--- COUPLE CONTEXT (current user) ---"];
    contextLines.push(`Name: ${coupleContext.name}`);
    contextLines.push(`Partner's name: ${coupleContext.partnerName || "Not set"}`);
    contextLines.push(`Wedding date: ${coupleContext.weddingDate || "Not set"}`);
    contextLines.push(`Wedding location: ${coupleContext.weddingLocation || "Not set"}`);
    contextLines.push(`Estimated guests: ${coupleContext.estimatedGuests || "Not set"}`);
    contextLines.push(`Wedding theme: ${coupleContext.weddingTheme || "Not set"}`);
    contextLines.push(`IMPORTANT RULES about couple context:
- If the wedding date is 'Not set', you MUST tell the user: "Your wedding date is not specified yet. Please set it in your profile or tell me the date."
- If the wedding location is 'Not set', you MUST tell the user: "Your wedding location is not specified yet." before making location-based searches.
- If estimated guests is 'Not set', ask the user how many guests they expect when recommending venues or catering.
- NEVER assume or invent values for fields that show 'Not set'. Always inform the user what's missing and ask them to provide it.
- If the wedding date IS set, proactively check vendor availability for that date.
- Address the user by name when appropriate.`);
    systemPrompt += contextLines.join("\n");
    console.log("[AI] Couple context injected:", JSON.stringify(coupleContext));
  }
  return systemPrompt;
}

function parseActionFromReply(reply: string): { cleanReply: string; pendingAction?: PendingAction } {
  const actionRegex = /\[ACTION_CONFIRM\]\s*([\s\S]*?)\s*\[\/ACTION_CONFIRM\]/;
  const actionMatch = reply.match(actionRegex);
  if (!actionMatch) return { cleanReply: reply };

  const cleanReply = reply.replace(actionRegex, "").trim();
  try {
    const rawJson = actionMatch[1].trim()
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "");
    const pendingAction = JSON.parse(rawJson) as PendingAction;
    return { cleanReply, pendingAction };
  } catch (e) {
    console.error("[AI] Failed to parse ACTION_CONFIRM JSON:", e, "\nRaw:", actionMatch[1]);
    return { cleanReply };
  }
}

export interface StreamCallbacks {
  onToken: (text: string) => void;
  onToolStart: (toolName: string) => void;
  onToolEnd: (toolName: string) => void;
  onVendorCards: (cards: VendorCard[]) => void;
  onBookingCards: (cards: BookingCard[]) => void;
  onAction: (action: PendingAction) => void;
  onDone: () => void;
  onError: (error: string) => void;
}

export async function aiChatStream(
  messages: ChatMessage[],
  userId: string,
  callbacks: StreamCallbacks,
  coupleContext?: CoupleContext,
): Promise<void> {
  const ai = getGeminiClient();
  const systemPrompt = buildSystemPrompt(coupleContext);

  const contents = messages.map((m) => ({
    role: m.role === "user" ? "user" as const : "model" as const,
    parts: [{ text: m.content }],
  }));

  const collectedVendorCards: VendorCard[] = [];
  const collectedBookingCards: BookingCard[] = [];
  let currentContents = [...contents];

  try {
    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const stream = await ai.models.generateContentStream({
        model: CHAT_MODEL,
        contents: currentContents,
        config: {
          systemInstruction: systemPrompt,
          tools: [{ functionDeclarations: toolDeclarations }],
        },
      });

      // Collect chunks — we need to distinguish tool-call responses from text
      const allParts: Array<{ text?: string; functionCall?: { name: string; args: Record<string, unknown> } }> = [];
      let fullStreamedText = "";
      let insideActionTag = false;
      let hasFunctionCalls = false;

      for await (const chunk of stream) {
        const candidate = chunk.candidates?.[0];
        if (!candidate?.content?.parts) continue;

        for (const part of candidate.content.parts) {
          allParts.push(part as { text?: string; functionCall?: { name: string; args: Record<string, unknown> } });

          if ((part as { functionCall?: unknown }).functionCall) {
            hasFunctionCalls = true;
            continue;
          }

          const chunkText = (part as { text?: string }).text ?? "";
          if (!chunkText) continue;

          // If we already know this round has tool calls, just accumulate text
          if (hasFunctionCalls) continue;

          fullStreamedText += chunkText;

          // Buffer text that might be part of an ACTION_CONFIRM tag
          if (insideActionTag) {
            if (fullStreamedText.includes("[/ACTION_CONFIRM]")) {
              insideActionTag = false;
            }
            continue;
          }

          if (fullStreamedText.includes("[ACTION_CONFIRM]") && !fullStreamedText.includes("[/ACTION_CONFIRM]")) {
            const tagStart = fullStreamedText.indexOf("[ACTION_CONFIRM]");
            const visiblePart = chunkText.substring(0, Math.max(0, tagStart - (fullStreamedText.length - chunkText.length)));
            if (visiblePart) callbacks.onToken(visiblePart);
            insideActionTag = true;
            continue;
          }

          callbacks.onToken(chunkText);
        }
      }

      if (!hasFunctionCalls) {
        // Pure text response — parse any action tag and finish
        const { pendingAction } = parseActionFromReply(fullStreamedText);
        if (pendingAction) callbacks.onAction(pendingAction);
        break;
      }

      // Tool-calling round — collect function calls from parts and execute
      currentContents.push({
        role: "model" as const,
        parts: allParts as { text: string }[],
      });

      const functionCalls = allParts
        .map((p) => (p as { functionCall?: { name: string; args: Record<string, unknown> } }).functionCall)
        .filter(Boolean) as { name: string; args: Record<string, unknown> }[];

      const functionResponses: { text: string }[] = [];

      for (const fc of functionCalls) {
        callbacks.onToolStart(fc.name);
        const { result, vendorCards, bookingCards } = await executeFunctionCall(
          fc.name,
          fc.args ?? {},
          userId,
        );
        collectedVendorCards.push(...vendorCards);
        collectedBookingCards.push(...bookingCards);
        callbacks.onToolEnd(fc.name);

        functionResponses.push({
          text: JSON.stringify({
            functionResponse: {
              name: fc.name,
              response: result,
            },
          }),
        });
      }

      currentContents.push({
        role: "user" as const,
        parts: functionResponses,
      });
    }

    const uniqueVendors = deduplicateVendorCards(collectedVendorCards);
    if (uniqueVendors.length > 0) callbacks.onVendorCards(uniqueVendors);
    if (collectedBookingCards.length > 0) callbacks.onBookingCards(collectedBookingCards);
    callbacks.onDone();
  } catch (err) {
    console.error("[AI] Stream error:", err);
    callbacks.onError(err instanceof Error ? err.message : "AI processing failed");
  }
}

export async function aiChat(
  messages: ChatMessage[],
  userId: string,
  coupleContext?: CoupleContext,
): Promise<AIResponse> {
  const ai = getGeminiClient();
  const systemPrompt = buildSystemPrompt(coupleContext);

  const contents = messages.map((m) => ({
    role: m.role === "user" ? "user" as const : "model" as const,
    parts: [{ text: m.content }],
  }));

  const collectedVendorCards: VendorCard[] = [];
  let finalReply = "";
  let currentContents = [...contents];

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const response = await ai.models.generateContent({
      model: CHAT_MODEL,
      contents: currentContents,
      config: {
        systemInstruction: systemPrompt,
        tools: [{ functionDeclarations: toolDeclarations }],
      },
    });

    const candidate = response.candidates?.[0];
    if (!candidate) {
      finalReply = "I'm sorry, I couldn't process your request. Please try again.";
      break;
    }

    const parts = candidate.content?.parts ?? [];
    const functionCalls = response.functionCalls ?? [];

    if (functionCalls.length === 0) {
      finalReply = parts.filter((p) => p.text).map((p) => p.text).join("\n");
      break;
    }

    currentContents.push({
      role: "model" as const,
      parts: parts as { text: string }[],
    });

    const functionResponses: { text: string }[] = [];

    for (const fc of functionCalls) {
      const { result, vendorCards } = await executeFunctionCall(
        fc.name!,
        (fc.args ?? {}) as Record<string, unknown>,
        userId,
      );
      collectedVendorCards.push(...(vendorCards ?? []));
      functionResponses.push({
        text: JSON.stringify({ functionResponse: { name: fc.name, response: result } }),
      });
    }

    currentContents.push({ role: "user" as const, parts: functionResponses });
  }

  if (!finalReply) {
    finalReply = "I found some options but had trouble formatting the response. Please try rephrasing your question.";
  }

  const uniqueVendors = deduplicateVendorCards(collectedVendorCards);
  const { cleanReply, pendingAction } = parseActionFromReply(finalReply);

  return { reply: cleanReply, vendorCards: uniqueVendors, pendingAction };
}

function deduplicateVendorCards(cards: VendorCard[]): VendorCard[] {
  const seen = new Set<string>();
  const unique: VendorCard[] = [];
  for (const card of cards) {
    if (!seen.has(card.id)) {
      seen.add(card.id);
      unique.push(card);
    }
  }
  return unique;
}