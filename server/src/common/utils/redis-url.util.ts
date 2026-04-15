import { ConfigService } from '@nestjs/config';

/**
 * Собирает Redis URL из env. В .env нельзя писать REDIS_URI с ${REDIS_USER} —
 * dotenv не подставляет переменные внутри значений.
 */
export function redisUrlFromConfig(config: ConfigService): string {
  const raw = config.get<string>('REDIS_URI');
  if (raw && !raw.includes('${')) {
    return raw;
  }
  const user = encodeURIComponent(config.getOrThrow<string>('REDIS_USER'));
  const password = encodeURIComponent(
    config.getOrThrow<string>('REDIS_PASSWORD'),
  );
  const host = config.getOrThrow<string>('REDIS_HOST');
  const port = config.getOrThrow<string>('REDIS_PORT');
  return `redis://${user}:${password}@${host}:${port}`;
}
