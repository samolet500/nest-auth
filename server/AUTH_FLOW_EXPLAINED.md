# Как сейчас работает auth в проекте

Этот файл описывает текущую реализацию **регистрации, аутентификации и авторизации** в папке `server`, чтобы было проще ориентироваться по цепочке вызовов.

## 1) Главная карта файлов

- Точка входа и инфраструктура: `src/main.ts`
- Подключение модулей: `src/app.module.ts`
- HTTP-эндпоинты auth: `src/auth/auth.controller.ts`
- Бизнес-логика auth: `src/auth/auth.service.ts`
- Работа с пользователем: `src/user/user.service.ts`
- Guard сессии: `src/auth/guards/auth.guard.ts`
- Guard ролей: `src/auth/guards/roles.guard.ts`
- Комбинированный декоратор авторизации: `src/auth/decorators/auth.decorator.ts`
- Параметр-декоратор текущего пользователя: `src/auth/decorators/authorized.decorator.ts`
- OAuth-реестр провайдеров: `src/auth/provider/provider.module.ts`, `src/auth/provider/provider.service.ts`
- Базовая логика OAuth: `src/auth/provider/services/base-oauth.service.ts`
- Конкретные провайдеры: `src/auth/provider/services/google.provider.ts`, `src/auth/provider/services/yandex.provider.ts`
- Конфиг провайдеров: `src/config/providers.config.ts`
- Конфиг reCAPTCHA: `src/config/recaptcha.config.ts`
- Типизация сессии (`req.session.userId`): `src/express-session.d.ts`
- Модели БД: `prisma/schema.prisma`

---

## 2) Что происходит при старте сервера

### Шаг 1. Поднимается Nest-приложение
- В `src/main.ts` вызывается `NestFactory.create(AppModule)`.

### Шаг 2. Подключается Redis для хранения сессий
- Там же создаётся `redisClient` и `RedisStore` (`connect-redis`).
- В `app.use(session(...))` настраивается:
  - `SESSION_SECRET`, `SESSION_NAME`
  - cookie-параметры (`domain`, `maxAge`, `httpOnly`, `secure`, `sameSite`)
  - `store: new RedisStore(...)`

### Шаг 3. Включаются CORS, cookie-parser, ValidationPipe
- CORS разрешает запросы от `ALLOWED_ORIGIN` и `credentials: true`.
- Это важно для cookie-сессий между фронтом и бэком.

### Шаг 4. Подключается `AuthModule`
- В `src/auth/auth.module.ts` регистрируются:
  - `ProviderModule.registerAsync(...)` (OAuth-провайдеры)
  - `GoogleRecaptchaModule.forRootAsync(...)`

---

## 3) Регистрация по email/паролю (`POST /auth/register`)

Маршрут: `AuthController.register()`

### Цепочка
1. Фронт отправляет `POST /auth/register` с DTO + токеном reCAPTCHA.
2. Декоратор `@Recaptcha()` валидирует токен через `@nestlab/google-recaptcha` (конфиг: `src/config/recaptcha.config.ts`).
3. Контроллер вызывает `AuthService.register(req, dto)`.
4. `AuthService` проверяет email через `UserService.findByEmail`.
5. Если email занят -> `ConflictException`.
6. Иначе `UserService.create(...)`:
   - пароль хешируется через `argon2`
   - создаётся запись в `users` (`authMethod = EMAIL`, `isVerified = false`)
7. `AuthService.saveSession(req, user)`:
   - пишет `req.session.userId = user.id`
   - сохраняет сессию в Redis
8. Возвращается созданный пользователь.

Итого: регистрация сразу авторизует пользователя через серверную сессию.

---

## 4) Логин по email/паролю (`POST /auth/login`)

Маршрут: `AuthController.login()`

### Цепочка
1. Фронт отправляет `POST /auth/login` + reCAPTCHA токен.
2. `@Recaptcha()` проверяет токен.
3. Контроллер вызывает `AuthService.login(req, dto)`.
4. `AuthService` ищет пользователя по email.
5. Если пользователя нет (или пароль пустой) -> `NotFoundException`.
6. `argon2.verify(...)` сравнивает пароль.
7. Если неверный -> `UnauthorizedException`.
8. Если верный -> `saveSession(req, user)`.
9. Возвращается пользователь.

---

## 5) OAuth-авторизация (Google/Yandex)

## 5.1 Старт OAuth (`GET /auth/oauth/connect/:provider`)

Маршрут: `AuthController.connect()`

1. Срабатывает `AuthProviderGuard`:
   - берёт `provider` из `params`
   - через `ProviderService.findByService(provider)` проверяет, что провайдер существует.
2. Контроллер берёт инстанс провайдера.
3. Возвращает `url = provider.getAuthUrl()`.
4. Фронт редиректит пользователя на этот URL.

## 5.2 Callback OAuth (`GET /auth/oauth/callback/:provider?code=...`)

Маршрут: `AuthController.callback()`

1. Проверяется `provider` через `AuthProviderGuard`.
2. Проверяется наличие `code` в query.
3. Контроллер вызывает `AuthService.extractProfileFromCode(req, provider, code)`.
4. `AuthService`:
   - находит провайдер (`ProviderService.findByService`)
   - вызывает `provider.findUserByCode(code)`:
     - POST на `access_url` (обмен `code -> access_token`)
     - GET на `profile_url` (получение профиля)
     - маппинг профиля в `TypeUserInfo` через `extractUserInfo(...)`
5. Дальше `AuthService` ищет связанный аккаунт в таблице `accounts`.
6. Если пользователь найден -> сохраняет сессию и завершает.
7. Если не найден -> создаёт нового пользователя (`authMethod = GOOGLE|YANDEX`, `isVerified = true`) и запись `Account`.
8. Сохраняет сессию (`req.session.userId`) и возвращается в контроллер.
9. Контроллер делает redirect на `${ALLOWED_ORIGIN}/dashboard/settings`.

---

## 6) Что такое «аутентификация» и «авторизация» в этом коде

## Аутентификация (кто ты?)
- `register/login/oauth callback` подтверждают личность.
- Результат: в сессии есть `userId`.

## Авторизация (что тебе можно?)
- На защищённых маршрутах ставится `@Authorization(...)`.
- Этот декоратор подключает:
  - `AuthGuard` — проверка, что есть `session.userId`, и загрузка `request.user`
  - (опционально) `RolesGuard` — проверка ролей, если переданы роли в `@Authorization(UserRole.ADMIN)`.

Без ролей: `@Authorization()` -> просто требование авторизации.
С ролями: `@Authorization(UserRole.ADMIN)` -> авторизация + проверка прав.

---

## 7) Как данные лежат в БД

Смотри `prisma/schema.prisma`:

- `User`
  - основной профиль
  - `authMethod` (`EMAIL`, `GOOGLE`, `YANDEX`)
  - связь `accounts`
- `Account`
  - oauth-данные: `provider`, `accessToken`, `refreshToken`, `expiresAt`
  - связь на `userId`

---

## 8) Быстрый «трек» запроса по слоям

Универсальная схема:

1. **Controller** принимает HTTP-запрос
2. **Guard/Decorator** (если есть) проверяет доступ
3. **Service** выполняет бизнес-логику
4. **UserService/PrismaService** ходят в БД
5. **Session** сохраняется в Redis + cookie уходит клиенту
6. Следующие запросы читают `session.userId` и восстанавливают пользователя

---

## 9) Почему кажется, что файлов много

Потому что ответственность уже разделена на слои:

- `controller` — только HTTP
- `auth.service` — сценарии входа/регистрации
- `provider/*` — изоляция OAuth-логики
- `guards/decorators` — проверка доступа
- `config/*` — сбор env-конфигурации

Это нормально для Nest-проекта: структура выглядит объёмно, но зато каждый файл отвечает за свою часть цепочки.

---

## 10) Что посмотреть следующим шагом

Чтобы перестать путаться, удобно идти в таком порядке:

1. `src/main.ts` (инфраструктура и сессии)
2. `src/auth/auth.controller.ts` (какие есть маршруты)
3. `src/auth/auth.service.ts` (основная логика)
4. `src/auth/provider/services/base-oauth.service.ts` (общий OAuth)
5. `src/auth/guards/auth.guard.ts` + `src/auth/decorators/auth.decorator.ts` (авторизация доступа)

Если придерживаться этого порядка, почти вся схема в голове быстро складывается.
