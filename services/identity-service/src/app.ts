import { registerHealthRoutes } from "./routes/health";
import { registerWorkspaceRoutes } from "./routes/workspaces";

type RouteHandler = (
  request: { body?: unknown },
  reply: {
    code: (statusCode: number) => {
      send: (payload: unknown) => { statusCode: number; payload: unknown };
    };
  },
) => Promise<unknown> | unknown;

type RouteMap = Map<string, RouteHandler>;

function createReply() {
  return {
    code(statusCode: number) {
      return {
        send(payload: unknown) {
          return {
            statusCode,
            payload,
          };
        },
      };
    },
  };
}

export function buildApp() {
  const routes: RouteMap = new Map();
  const app = {
    get(path: string, handler: RouteHandler) {
      routes.set(`GET ${path}`, handler);
    },
    post(path: string, handler: RouteHandler) {
      routes.set(`POST ${path}`, handler);
    },
    async inject(input: {
      method: string;
      url: string;
      payload?: unknown;
    }) {
      const handler = routes.get(`${input.method} ${input.url}`);

      if (!handler) {
        return {
          statusCode: 404,
          json() {
            return {
              message: "Not Found",
            };
          },
        };
      }

      const reply = createReply();
      const result = await handler({ body: input.payload }, reply);
      const response =
        result && typeof result === "object" && "statusCode" in result
          ? result
          : {
              statusCode: 200,
              payload: result,
            };

      return {
        statusCode: response.statusCode,
        json() {
          return response.payload;
        },
      };
    },
  };

  void registerHealthRoutes(app);
  void registerWorkspaceRoutes(app);

  return app;
}
