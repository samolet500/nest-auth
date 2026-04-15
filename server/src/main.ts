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

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = app.get(ConfigService);

  const redisClient = createClient({ url: redisUrlFromConfig(config) });
  redisClient.on('error', (err) => {
    console.error('[Redis]', err);
  });
  await redisClient.connect();

  // cookieParser: парсит куки из запроса и делает их доступными в req.cookies.
  app.use(cookieParser(config.getOrThrow<string>('COOKIE_SECRET')));

  // useGlobalPipes: пайп применяется ко всем обработчикам маршрутов, чтобы не вешать валидацию на каждый контроллер отдельно.
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // приводит входящие данные к экземплярам классов DTO (а не к «голым» объектам)
    }),
  );

  // session: управляет сессиями пользователей.
  app.use(
    session({
      secret: config.getOrThrow<string>('SESSION_SECRET'), // секретный ключ для подписи сессии
      name: config.getOrThrow<string>('SESSION_NAME'), // имя сессии
      resave: false, // для connect-redis v9: полагаемся на touch вместо полного resave
      saveUninitialized: false, // сохранять неинициализированные сессии
      cookie: {
        domain: config.getOrThrow<string>('SESSION_DOMAIN'), // домен сессии
        maxAge: ms(config.getOrThrow<StringValue>('SESSION_MAX_AGE')), // максимальный возраст сессии
        httpOnly: parseBoolean(config.getOrThrow<string>('SESSION_HTTP_ONLY')), // флаг httpOnly сессии
        secure: parseBoolean(config.getOrThrow<string>('SESSION_SECURE')), // флаг безопасности сессии
        sameSite: 'lax', // флаг sameSite сессии, для защиты от CSRF атак
      },
      store: new RedisStore({
        client: redisClient,
        prefix: config.getOrThrow<string>('SESSION_FOLDER'),
      }),
    }),
  );

  // enableCors: включает CORS для всех маршрутов.
  app.enableCors({
    origin: config.getOrThrow<string>('ALLOWED_ORIGIN'), // разрешённые запросы только с этого origin
    credentials: true, // разрешить запросы с учётными данными
    exposedHeaders: ['Set-Cookie'], // Если фронту нужно читать Set-Cookie из ответа, этот заголовок нужно явно «просветить» через CORS
  });

  await app.listen(config.getOrThrow<number>('APPLICATION_PORT'));
}

bootstrap();
