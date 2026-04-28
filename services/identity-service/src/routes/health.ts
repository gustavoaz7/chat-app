interface AppRouteRegistrar {
  get(path: string, handler: () => Promise<unknown> | unknown): void;
}

export async function registerHealthRoutes(app: AppRouteRegistrar) {
  app.get("/health", async () => ({
    status: "ok",
  }));
}
