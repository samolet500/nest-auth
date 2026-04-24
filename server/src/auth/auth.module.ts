/**
 * Nest-модуль домена аутентификации: HTTP-слой и сервис.
 *
 * reCAPTCHA: на клиенте пользователь проходит проверку Google и получает одноразовый токен;
 * клиент передаёт его в запросе (см. заголовок в recaptcha.config — по умолчанию `recaptcha`).
 * На сервере `@nestlab/google-recaptcha` по секрету из env отправляет токен в Google и отклоняет
 * запрос, если проверка не прошла — так снижают брутфорс и регистрацию ботов на login/register.
 */
import { Module } from '@nestjs/common';
import { UserModule } from 'src/user/user.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { getRecaptchaConfig } from '@/config/recaptcha.config';
import { GoogleRecaptchaModule } from '@nestlab/google-recaptcha';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ProviderModule } from './provider/provider.module';
import { getProvidersConfig } from '@/config/providers.config';

/**
 * Регистрирует UserModule и глобально настраивает Google reCAPTCHA (секрет и способ чтения токена из запроса).
 * Фактическая проверка включается декоратором `@Recaptcha()` на нужных методах контроллера.
 */
@Module({
  imports: [
    ProviderModule.registerAsync({
      imports: [ConfigModule],
      useFactory: getProvidersConfig,
      inject: [ConfigService],
    }),
    UserModule,
    GoogleRecaptchaModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: getRecaptchaConfig,
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule { }
