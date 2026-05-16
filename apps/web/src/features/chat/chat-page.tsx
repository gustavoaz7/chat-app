import { startTransition, useEffect, useState } from "react";
import { useSendMessage } from "./use-send-message";

export interface ChatMessage {
  id: string;
  senderName: string;
  body: string;
}

export interface ChatPageProps {
  loadMessages: () => Promise<ChatMessage[]>;
  sendMessage: (body: string) => Promise<ChatMessage>;
}

export function ChatPage({ loadMessages, sendMessage }: ChatPageProps) {
  const [body, setBody] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isSending, submitMessage } = useSendMessage(sendMessage);

  useEffect(() => {
    let isMounted = true;

    void loadMessages().then((seededMessages) => {
      if (!isMounted) {
        return;
      }

      startTransition(() => {
        setMessages(seededMessages);
        setIsLoading(false);
      });
    });

    return () => {
      isMounted = false;
    };
  }, [loadMessages]);

  return (
    <div className="chat-shell">
      <div className="chat-frame">
        <aside className="chat-rail" aria-label="Workspace shortcuts">
          <div className="chat-rail-badge">TC</div>
          <div className="chat-rail-dot">DS</div>
          <div className="chat-rail-dot">PL</div>
          <div className="chat-rail-dot">QA</div>
        </aside>

        <main className="chat-stage">
          <header className="chat-header">
            <div>
              <p className="chat-header-eyebrow">Growing SaaS / Release Coordination</p>
              <h1 className="chat-header-title">Launch Room</h1>
              <p className="chat-header-copy">
                Keep the rollout thread in one place with context-rich history, fast replies,
                and a composer anchored to the conversation.
              </p>
            </div>
            <div className="chat-header-pill">3 teammates active</div>
          </header>

          <section className="chat-scroll" aria-label="Conversation history">
            {isLoading ? (
              <div className="chat-loading">Loading conversation...</div>
            ) : (
              messages.map((message) => {
                const isCurrentUser = message.senderName === "You";

                return (
                  <article
                    key={message.id}
                    className={`chat-bubble ${isCurrentUser ? "chat-bubble--self" : "chat-bubble--other"}`}
                  >
                    <strong className="chat-bubble-author">{message.senderName}</strong>
                    <p className="chat-bubble-body">{message.body}</p>
                  </article>
                );
              })
            )}
          </section>

          <footer className="chat-composer">
            <form
              className="chat-composer-form"
              onSubmit={async (event) => {
                event.preventDefault();

                const nextMessage = await submitMessage(body);
                setMessages((current) => [...current, nextMessage]);
                setBody("");
              }}
            >
              <label className="chat-composer-field">
                <span className="chat-composer-label">Message</span>
                <input
                  aria-label="Message"
                  className="chat-composer-input"
                  placeholder="Share the next update..."
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                />
              </label>

              <button className="chat-composer-button" type="submit" disabled={isSending}>
                {isSending ? "Sending..." : "Send"}
              </button>
            </form>
          </footer>
        </main>
      </div>
    </div>
  );
}
