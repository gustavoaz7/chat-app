import Fastify from "fastify";
import { MessageBroadcast } from "./ws/message-broadcast";
import { SessionManager } from "./ws/session-manager";

export interface RealtimeGatewayRuntime {
  broadcaster: MessageBroadcast;
  sessionManager: SessionManager;
}

export function buildApp(runtime?: Partial<RealtimeGatewayRuntime>) {
  return {
    app: Fastify(),
    broadcaster: runtime?.broadcaster ?? new MessageBroadcast(),
    sessionManager: runtime?.sessionManager ?? new SessionManager(),
  };
}
