const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const CHUNK_SIZE = 100;

export interface PushMessage {
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: "default" | null;
  badge?: number;
  channelId?: string;
}

async function sendChunk(tokens: string[], message: PushMessage): Promise<void> {
  const messages = tokens.map((to) => ({
    to,
    sound: message.sound ?? "default",
    title: message.title,
    body: message.body,
    data: message.data ?? {},
    ...(message.badge !== undefined ? { badge: message.badge } : {}),
    ...(message.channelId ? { channelId: message.channelId } : {}),
  }));

  try {
    const res = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(messages),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error(`[push] Expo API error ${res.status}: ${text}`);
    }
  } catch (err) {
    console.error("[push] Network error sending push notifications:", err);
  }
}

export async function sendPushNotifications(
  tokens: string[],
  message: PushMessage,
): Promise<void> {
  if (!tokens.length) return;

  const validTokens = tokens.filter(
    (t) => typeof t === "string" && t.startsWith("ExponentPushToken["),
  );

  if (!validTokens.length) return;

  const chunks: string[][] = [];
  for (let i = 0; i < validTokens.length; i += CHUNK_SIZE) {
    chunks.push(validTokens.slice(i, i + CHUNK_SIZE));
  }

  await Promise.allSettled(chunks.map((chunk) => sendChunk(chunk, message)));
}
