import { describe, expect, it } from "vitest";
import { createLogger } from "./logger";

describe("createLogger", () => {
  it("includes the service name in every log payload", () => {
    const logger = createLogger("chat-service");

    expect(logger.info("booted")).toMatchObject({
      level: "info",
      service: "chat-service",
      message: "booted",
    });
  });
});
