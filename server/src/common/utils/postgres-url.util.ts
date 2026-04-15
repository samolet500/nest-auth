/** Собирает URL PostgreSQL из env (как для Prisma CLI, так и для рантайма). */
export function postgresUrlFromEnv(): string {
  const direct = process.env['POSTGRES_URL'];
  if (direct && !direct.includes('${')) {
    return direct;
  }
  const user = encodeURIComponent(process.env['POSTGRES_USER'] ?? 'postgres');
  const password = encodeURIComponent(process.env['POSTGRES_PASSWORD'] ?? '');
  const host = process.env['POSTGRES_HOST'] ?? 'localhost';
  const port = process.env['POSTGRES_PORT'] ?? '5432';
  const database = process.env['POSTGRES_DB'] ?? 'postgres';
  return `postgresql://${user}:${password}@${host}:${port}/${database}`;
}
