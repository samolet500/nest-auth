/**
 * Точка входа сервера: поднимает Nest-приложение, Redis-сессии, middleware и CORS.
 */
import { NestFactory } from '@nestjs/core';
import { AppModule } from '@/app.module';
import cookieParser from 'cookie-parser';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { createClient } from 'redis';
import session from 'express-session';
import { ms, StringValue } from '@/common/utils/ms.util';
import { parseBoolean } from '@/common/utils/parse-boolean.util';
import { redisUrlFromConfig } from '@/common/utils/redis-url.util';
import { RedisStore } from 'connect-redis';

/**
 * Инициализирует и запускает HTTP-сервер приложения.
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = app.get(ConfigService);

  /**
   * Создаёт Redis-клиент для хранения сессий.
   */
  const redisClient = createClient({ url: redisUrlFromConfig(config) });
  redisClient.on('error', (err) => {
    console.error('[Redis]', err);
  });
  await redisClient.connect();

  /**
   * Подключает парсер cookie и подпись cookie через секрет из env.
   */
  app.use(cookieParser(config.getOrThrow<string>('COOKIE_SECRET')));

  /**
   * Включает глобальную валидацию DTO для всех маршрутов приложения.
   */
  app.useGlobalPipes(
    new ValidationPipe({
      /**
       * Преобразует входящие данные в экземпляры DTO-классов.
       */
      transform: true,
    }),
  );

  /**
   * Настраивает server-side сессии:
   * - идентификатор сессии хранится в cookie;
   * - содержимое сессии хранится в Redis.
   */
  app.use(
    session({
      /** Секрет для подписи session cookie. */
      secret: config.getOrThrow<string>('SESSION_SECRET'),
      /** Имя cookie, в котором хранится session id. */
      name: config.getOrThrow<string>('SESSION_NAME'),
      /** Не пересохраняет сессию без изменений (для connect-redis v9). */
      resave: false,
      /** Не сохраняет пустые сессии до фактической инициализации. */
      saveUninitialized: false,
      cookie: {
        /** Ограничивает домен, для которого доступна session cookie. */
        domain: config.getOrThrow<string>('SESSION_DOMAIN'),
        /** Время жизни session cookie в миллисекундах. */
        maxAge: ms(config.getOrThrow<StringValue>('SESSION_MAX_AGE')),
        /** Запрещает доступ к cookie из JavaScript в браузере. */
        httpOnly: parseBoolean(config.getOrThrow<string>('SESSION_HTTP_ONLY')),
        /** Отправляет cookie только по HTTPS, если включено в env. */
        secure: parseBoolean(config.getOrThrow<string>('SESSION_SECURE')),
        /** Защита от CSRF при кросс-сайтовых переходах. */
        sameSite: 'lax',
      },
      store: new RedisStore({
        client: redisClient,
        prefix: config.getOrThrow<string>('SESSION_FOLDER'),
      }),
    }),
  );

  /**
   * Разрешает CORS-запросы с доверенного frontend-origin и cookie-учётными данными.
   */
  app.enableCors({
    /** Разрешённый origin фронтенда. */
    origin: config.getOrThrow<string>('ALLOWED_ORIGIN'),
    /** Разрешает передавать cookie и другие credentials. */
    credentials: true,
    /** Делает Set-Cookie доступным на клиенте через CORS. */
    exposedHeaders: ['Set-Cookie'],
  });

  /** Запускает HTTP-сервер на порту из env. */
  await app.listen(config.getOrThrow<number>('APPLICATION_PORT'));
}

bootstrap();
