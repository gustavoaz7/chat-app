import { createChatApi } from "./features/chat/chat-api";
import { ChatPage } from "./features/chat/chat-page";

const workspaceId = "ws_demo";
const channelId = "ch_general";
const api = createChatApi(fetch);

export function App() {
  return (
    <ChatPage
      loadMessages={() => api.loadMessages({ workspaceId, channelId })}
      sendMessage={(body) =>
        api.sendMessage({
          workspaceId,
          channelId,
          senderId: "user_demo",
          senderName: "You",
          body,
        })
      }
    />
  );
}
