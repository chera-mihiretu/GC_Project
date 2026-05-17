export interface GuideMessage {
  role: "user" | "model";
  content: string;
}

interface StreamCallbacks {
  onToken: (text: string) => void;
  onDone: () => void;
  onError: (error: string) => void;
}

export async function streamGuideMessage(
  messages: GuideMessage[],
  callbacks: StreamCallbacks,
): Promise<void> {
  const res = await fetch("/api/v1/guide/chat/stream", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ messages }),
  });

  if (!res.ok) {
    callbacks.onError(`Request failed with status ${res.status}`);
    return;
  }

  const reader = res.body?.getReader();
  if (!reader) {
    callbacks.onError("No response stream");
    return;
  }

  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data: ")) continue;
        const json = trimmed.slice(6);
        try {
          const evt = JSON.parse(json) as { type: string; text?: string; error?: string };
          if (evt.type === "token" && evt.text) callbacks.onToken(evt.text);
          else if (evt.type === "done") callbacks.onDone();
          else if (evt.type === "error") callbacks.onError(evt.error ?? "Unknown error");
        } catch {
          // skip malformed lines
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
