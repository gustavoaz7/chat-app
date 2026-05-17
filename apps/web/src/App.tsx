import { ChatPage, type ChatMessage } from "./features/chat/chat-page";

const seededMessages: ChatMessage[] = [
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

let nextMessageId = 4;

export function App() {
  return (
    <ChatPage
      loadMessages={async () => seededMessages}
      sendMessage={async (body) => ({
        id: `msg_local_${nextMessageId++}`,
        senderName: "You",
        body,
      })}
    />
  );
}
