export const defaultChannelName = "general";

export function buildDatabaseUrl(input: {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}) {
  const user = encodeURIComponent(input.user);
  const password = encodeURIComponent(input.password);
  const database = encodeURIComponent(input.database);

  return `postgresql://${user}:${password}@${input.host}:${input.port}/${database}`;
}
