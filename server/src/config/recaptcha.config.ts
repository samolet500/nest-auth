/**
 * Конфигурация `@nestlab/google-recaptcha` для сервера.
 *
 * - secretKey — серверный ключ из Google reCAPTCHA (env `GOOGLE_RECAPTCHA_SECRET_KEY`); им подписывается
 *   запрос к API Google для валидации токена. Сайт-ключ остаётся только на фронте.
 * - response — откуда взять токен из входящего HTTP-запроса: здесь заголовок `recaptcha`
 *   (клиент должен положить туда токен после выполнения виджета/SDK на фронте).
 * - skipIf — в dev проверку можно отключить, чтобы не настраивать ключи при локальной разработке.
 * 
 * Описание пакета: https://www.npmjs.com/package/@nestlab/google-recaptcha
 */
import { isDev } from "@/common/utils/is-dev.util";
import { ConfigService } from "@nestjs/config";
import { GoogleRecaptchaModuleOptions } from "@nestlab/google-recaptcha";

/**
 * Собирает опции модуля: секрет, резолвер токена из запроса и условие пропуска в dev.
 */
export const getRecaptchaConfig = async (configService: ConfigService): Promise<GoogleRecaptchaModuleOptions> => ({
  secretKey: configService.getOrThrow<string>('GOOGLE_RECAPTCHA_SECRET_KEY'),
  response: req => req.headers.recaptcha,
  // skipIf: false,
  skipIf: isDev(configService),
  actions: ['register', 'login'],
  score: 0.8,
});
