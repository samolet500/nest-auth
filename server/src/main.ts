import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  // cookieParser: парсит куки из запроса и делает их доступными в req.cookies.
  app.use(cookieParser(config.getOrThrow<string>('COOKIE_SECRET')));

  // useGlobalPipes: пайп применяется ко всем обработчикам маршрутов, чтобы не вешать валидацию на каждый контроллер отдельно.
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // приводит входящие данные к экземплярам классов DTO (а не к «голым» объектам)
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
