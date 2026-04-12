# nest-auth

Учебный проект авторизации на **NestJS**. Код бэкенда — в каталоге `server/`.

## Быстрый старт

1. **Скопируй переменные окружения** (из корня репозитория):

   ```bash
   cp server/.env.example server/.env
   ```

   При необходимости отредактируй `server/.env`.

2. **Подними Postgres и Redis** (команды выполнять из `server/`, где лежит `docker-compose.yml`):

   ```bash
   cd server
   docker compose up -d
   ```

   Имя стека в Docker задаётся через `COMPOSE_PROJECT_NAME` в `server/.env`.

3. **Остановить контейнеры:**

   ```bash
   cd server
   docker compose down
   ```

## Подключение к БД (pgAdmin)

- **Хост:** `localhost`
- **Порт:** `5433` (см. `docker-compose.yml`: проброс на хост, чтобы не конфликтовать с локальным Postgres на 5432)
- **Пользователь, пароль, имя БД** — как в `server/.env` (`POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`).

## Зависимости сервера

Основные npm-пакеты в `server` и зачем они нужны:

| Пакет                       | Назначение                                                  |
| --------------------------- | ----------------------------------------------------------- |
| `@nestjs/config`            | Конфигурация и переменные окружения (`.env`)                |
| `class-transformer`         | Преобразование plain-объектов в классы (часто вместе с DTO) |
| `class-validator`           | Валидация DTO через декораторы                              |
| `argon2`                    | Хеширование паролей (безопасная альтернатива bcrypt)        |
| `@prisma/client`            | ORM-клиент для работы с базой данных через Prisma           |
| `cookie-parser`             | Парсинг cookies из HTTP-запросов в Express                  |
| `connect-redis`             | Хранение сессий express-session в Redis                     |
| `express-session`           | Управление сессиями пользователей (session-based auth)      |
| `ioredis`                   | Клиент для работы с Redis                                   |
| `@nestlab/google-recaptcha` | Интеграция Google reCAPTCHA                                 |
| `@nestjs-modules/mailer`    | Отправка писем (SMTP, шаблоны)                              |
| `@react-email/components`   | UI-компоненты для создания email-шаблонов в React           |
| `@react-email/html`         | Рендеринг email-шаблонов в HTML                             |

Подробнее про настройку API — в [`server/README.md`](server/README.md).
