export interface TraceContext {
  traceId: string;
  service: string;
  operation: string;
  startedAt: string;
}

let nextTraceId = 1;

export function createTraceContext(service: string, operation: string): TraceContext {
  return {
    traceId: `trace_${nextTraceId++}`,
    service,
    operation,
    startedAt: new Date().toISOString(),
  };
}
