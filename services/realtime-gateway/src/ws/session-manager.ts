export class SessionManager {
  private readonly channelSessions = new Map<string, Set<string>>();

  addSession(channelId: string, sessionId: string): void {
    const sessions = this.channelSessions.get(channelId) ?? new Set<string>();
    sessions.add(sessionId);
    this.channelSessions.set(channelId, sessions);
  }

  removeSession(channelId: string, sessionId: string): void {
    const sessions = this.channelSessions.get(channelId);

    if (sessions === undefined) {
      return;
    }

    sessions.delete(sessionId);

    if (sessions.size === 0) {
      this.channelSessions.delete(channelId);
    }
  }

  listSessions(channelId: string): string[] {
    return [...(this.channelSessions.get(channelId) ?? new Set<string>())];
  }
}
