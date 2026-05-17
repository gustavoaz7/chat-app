import type { ChatMessage } from "./chat-page";

const storageKey = "team-chat-messages";

const fallbackMessages: ChatMessage[] = [
  {
    id: "msg_seed_1",
    senderName: "Ava",
    body: "Morning team. Today's rollout is still on track.",
  },
  {
    id: "msg_seed_2",
    senderName: "Noah",
    body: "I wrapped the final API gateway validation pass a few minutes ago.",
  },
  {
    id: "msg_seed_3",
    senderName: "Mila",
    body: "Perfect. I'll keep an eye on notifications once traffic starts landing.",
  },
];

function readStoredMessages(storage: Storage | undefined): ChatMessage[] | null {
  if (storage === undefined) {
    return null;
  }

  const raw = storage.getItem(storageKey);

  if (raw === null) {
    return null;
  }

  return JSON.parse(raw) as ChatMessage[];
}

function writeStoredMessages(storage: Storage | undefined, messages: ChatMessage[]) {
  storage?.setItem(storageKey, JSON.stringify(messages));
}

function loadFallbackMessages(storage: Storage | undefined) {
  const storedMessages = readStoredMessages(storage);

  if (storedMessages !== null) {
    return storedMessages;
  }

  writeStoredMessages(storage, fallbackMessages);
  return fallbackMessages;
}

export function createChatApi(
  fetchImpl: typeof fetch,
  storage: Storage | undefined = typeof window === "undefined" ? undefined : window.localStorage,
) {
  return {
    async loadMessages(input: { workspaceId: string; channelId: string }): Promise<ChatMessage[]> {
      const url = `/api/messages?workspaceId=${input.workspaceId}&channelId=${input.channelId}`;

      try {
        const response = await fetchImpl(url);

        if (response.ok) {
          const messages = (await response.json()) as ChatMessage[];
          writeStoredMessages(storage, messages);
          return messages;
        }
      } catch {
        // Fall back to local durable storage in frontend-only preview flows.
      }

      return loadFallbackMessages(storage);
    },

    async sendMessage(input: {
      workspaceId: string;
      channelId: string;
      senderId: string;
      senderName: string;
      body: string;
    }): Promise<ChatMessage> {
      try {
        const response = await fetchImpl("/api/messages", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(input),
        });

        if (response.ok) {
          const message = (await response.json()) as ChatMessage;
          const nextMessages = [...loadFallbackMessages(storage), message];
          writeStoredMessages(storage, nextMessages);
          return message;
        }
      } catch {
        // Fall back to local durable storage in frontend-only preview flows.
      }

      const message = {
        id: `msg_local_${crypto.randomUUID()}`,
        senderName: input.senderName,
        body: input.body,
      };
      const nextMessages = [...loadFallbackMessages(storage), message];
      writeStoredMessages(storage, nextMessages);
      return message;
    },
  };
}
