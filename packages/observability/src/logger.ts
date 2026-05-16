export interface LogPayload {
  level: "info";
  service: string;
  message: string;
  timestamp: string;
}

export function createLogger(service: string) {
  return {
    info(message: string): LogPayload {
      return {
        level: "info",
        service,
        message,
        timestamp: new Date().toISOString(),
      };
    },
  };
}
