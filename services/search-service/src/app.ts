import { createSearchDocumentFromMessageSent } from "./consumers/message-sent-consumer";

export function buildApp() {
  return {
    consumers: {
      createSearchDocumentFromMessageSent,
    },
  };
}
