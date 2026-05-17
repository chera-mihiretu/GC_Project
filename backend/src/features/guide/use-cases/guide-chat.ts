import { getGeminiClient } from "../../ai/infrastructure/gemini-client.js";
import { GUIDE_MODEL, PLATFORM_KNOWLEDGE } from "../domain/knowledge.js";

export interface GuideChatMessage {
  role: "user" | "model";
  content: string;
}

export interface GuideStreamCallbacks {
  onToken: (text: string) => void;
  onDone: () => void;
  onError: (error: string) => void;
}

export async function guideChatStream(
  messages: GuideChatMessage[],
  userRole: string,
  callbacks: GuideStreamCallbacks,
): Promise<void> {
  const ai = getGeminiClient();

  const roleContext = `\n\nThe current user's role is: ${userRole}. Tailor your answers to this role. For example, if they are a "couple", focus on couple features. If "vendor", focus on vendor features. If "admin", focus on admin features. But if they ask about other roles' features, still answer helpfully.`;

  const contents = messages.map((m) => ({
    role: m.role === "user" ? ("user" as const) : ("model" as const),
    parts: [{ text: m.content }],
  }));

  try {
    const stream = await ai.models.generateContentStream({
      model: GUIDE_MODEL,
      contents,
      config: {
        systemInstruction: PLATFORM_KNOWLEDGE + roleContext,
      },
    });

    for await (const chunk of stream) {
      const candidate = chunk.candidates?.[0];
      if (!candidate?.content?.parts) continue;

      for (const part of candidate.content.parts) {
        const text = (part as { text?: string }).text ?? "";
        if (text) callbacks.onToken(text);
      }
    }

    callbacks.onDone();
  } catch (err) {
    console.error("[GUIDE] Stream error:", err);
    callbacks.onError(err instanceof Error ? err.message : "Guide processing failed");
  }
}
