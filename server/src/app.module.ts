/**
 * Корневой модуль приложения: собирает основные функциональные модули и глобальную конфигурацию.
 */
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { IS_DEV_ENV } from './common/utils/is-dev.util';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { MailModule } from './libs/mail/mail.module';
import { MailConfirmationModule } from './auth/mail-confirmation/mail-confirmation.module';

@Module({
  imports: [
    /**
     * Подключает переменные окружения:
     * в dev читает `.env`, а в остальных окружениях берёт переменные из окружения процесса.
     * `isGlobal: true` делает ConfigService доступным во всех модулях без повторного импорта.
     */
    ConfigModule.forRoot({
      ignoreEnvFile: !IS_DEV_ENV,
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    UserModule,
    MailModule,
    MailConfirmationModule,
  ],
})
export class AppModule { }
