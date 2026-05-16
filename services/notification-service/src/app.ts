import { createNotificationFromMessageSent } from "./consumers/message-sent-consumer";

export function buildApp() {
  return {
    consumers: {
      createNotificationFromMessageSent,
    },
  };
}
