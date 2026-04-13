/**
 * Утилиты «мы в development или нет».
 *
 * `isDev(config)` — для кода внутри Nest, где есть DI.
 *   Зачем: одна линия с остальным конфигом; `NODE_ENV` обязателен (`getOrThrow`).
 *   Где: сервисы, контроллеры, guards, фабрики — после инжекта `ConfigService`.
 *   Как: `constructor(private readonly config: ConfigService) {}` → `if (isDev(this.config)) { ... }`.
 *
 * `IS_DEV_ENV` — для кода без Nest DI или на верхнем уровне модуля.
 *   Зачем: проверка до/вне контейнера; при отсутствии `NODE_ENV` будет `false`, без исключения.
 *   Где: импортируемые модули, общие утилиты, условия при загрузке файла.
 *   Как: `if (IS_DEV_ENV) { ... }` (значение фиксируется при первом импорте этого файла).
 *
 * `dotenv.config()` выше нужен, чтобы из `.env` подтянуть `NODE_ENV` до вычисления `IS_DEV_ENV`.
 */
import { ConfigService } from '@nestjs/config';
import dotenv from 'dotenv';

dotenv.config();

export const isDev = (config: ConfigService) =>
  config.getOrThrow<string>('NODE_ENV') === 'development';

export const IS_DEV_ENV = process.env.NODE_ENV === 'development';
