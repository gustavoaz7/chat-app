import type { ChatMessage } from "./chat-page";

const legacyStorageKey = "team-chat-messages";

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

function makeStorageKey(input: { workspaceId: string; channelId: string }) {
  return `${legacyStorageKey}:${input.workspaceId}:${input.channelId}`;
}

function readStoredMessages(
  storage: Storage | undefined,
  input: { workspaceId: string; channelId: string },
): ChatMessage[] | null {
  if (storage === undefined) {
    return null;
  }

  const scopedKey = makeStorageKey(input);
  const raw = storage.getItem(scopedKey) ?? storage.getItem(legacyStorageKey);

  if (raw === null) {
    return null;
  }

  try {
    const messages = JSON.parse(raw) as ChatMessage[];

    // Validate that messages is an array with expected ChatMessage properties
    if (!Array.isArray(messages) || !messages.every(m => m && typeof m.id === 'string' && typeof m.senderName === 'string' && typeof m.body === 'string')) {
      // Invalid shape - use fallback and clean up
      const fallbackMessages: ChatMessage[] = [];
      writeStoredMessages(storage, input, fallbackMessages);
      storage.removeItem(legacyStorageKey);
      return fallbackMessages;
    }

    if (storage.getItem(scopedKey) === null) {
      writeStoredMessages(storage, input, messages);
      storage.removeItem(legacyStorageKey);
    }

    return messages;
  } catch {
    storage.removeItem(scopedKey);
    storage.removeItem(legacyStorageKey);
    return null;
  }
}

function writeStoredMessages(
  storage: Storage | undefined,
  input: { workspaceId: string; channelId: string },
  messages: ChatMessage[],
) {
  storage?.setItem(makeStorageKey(input), JSON.stringify(messages));
}

function loadFallbackMessages(
  storage: Storage | undefined,
  input: { workspaceId: string; channelId: string },
) {
  const storedMessages = readStoredMessages(storage, input);

  if (storedMessages !== null) {
    return storedMessages;
  }

  writeStoredMessages(storage, input, fallbackMessages);
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
          writeStoredMessages(storage, input, messages);
          return messages;
        }
      } catch {
        // Fall back to local durable storage in frontend-only preview flows.
      }

      return loadFallbackMessages(storage, input);
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
          const conversation = {
            workspaceId: input.workspaceId,
            channelId: input.channelId,
          };
          const nextMessages = [...loadFallbackMessages(storage, conversation), message];
          writeStoredMessages(storage, conversation, nextMessages);
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
      const conversation = {
        workspaceId: input.workspaceId,
        channelId: input.channelId,
      };
      const nextMessages = [...loadFallbackMessages(storage, conversation), message];
      writeStoredMessages(storage, conversation, nextMessages);
      return message;
    },
  };
}
