import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ChatPage } from "./chat-page";

afterEach(() => {
  cleanup();
});

describe("ChatPage", () => {
  it("renders seeded history from the gateway client", async () => {
    render(
      <ChatPage
        loadMessages={async () => [
          { id: "msg_1", senderName: "Ava", body: "Morning team" },
          { id: "msg_2", senderName: "Noah", body: "Shipping today" },
        ]}
        sendMessage={async (body) => ({ id: "msg_next", senderName: "You", body })}
      />,
    );

    expect(await screen.findByText("Morning team")).toBeTruthy();
    expect(screen.getByText("Shipping today")).toBeTruthy();
  });

  it("sends the drafted message through the gateway client", async () => {
    const sendMessage = vi.fn(async (body: string) => ({
      id: "msg_sent",
      senderName: "You",
      body,
    }));

    render(<ChatPage loadMessages={async () => []} sendMessage={sendMessage} />);

    fireEvent.change(screen.getByLabelText("Message"), {
      target: { value: "hello team" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));

    await waitFor(() => {
      expect(sendMessage).toHaveBeenCalledWith("hello team");
    });
  });

  it("shows the newly sent message in the conversation", async () => {
    render(
      <ChatPage
        loadMessages={async () => [{ id: "msg_1", senderName: "Ava", body: "Morning team" }]}
        sendMessage={async (body) => ({ id: "msg_2", senderName: "You", body })}
      />,
    );

    expect(await screen.findByText("Morning team")).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Message"), {
      target: { value: "Reply posted" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));

    expect(await screen.findByText("Reply posted")).toBeTruthy();
  });
});
