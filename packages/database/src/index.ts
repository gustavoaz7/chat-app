export const defaultChannelName = "general";

export function buildDatabaseUrl(input: {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}) {
  return `postgresql://${input.user}:${input.password}@${input.host}:${input.port}/${input.database}`;
}
