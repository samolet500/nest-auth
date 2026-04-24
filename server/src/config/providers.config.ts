/**
 * Сборка конфигурации OAuth-провайдеров (Google, Yandex) из переменных окружения.
 */
import { ConfigService } from "@nestjs/config";
import { TypeOptions } from "@/auth/provider/provider.constants";
import { GoogleProvider } from "@/auth/provider/services/google.provider";
import { YandexProvider } from "@/auth/provider/services/yandex.provider";

/**
 * Публичный origin приложения для redirect_uri. В .env плейсхолдер ${APPLICATION_PORT}
 * не раскрывается самим dotenv — подставляем порт из APPLICATION_PORT вручную.
 */
function resolveApplicationBaseUrl(configService: ConfigService): string {
  const template = configService.getOrThrow<string>('APPLICATION_URL');
  const port = configService.getOrThrow<string | number>('APPLICATION_PORT');
  return template
    .replace(/\$\{APPLICATION_PORT\}/g, String(port))
    .replace(/\/+$/, '');
}

/**
 * Возвращает baseUrl и инстансы провайдеров с учётом env.
 */
export const getProvidersConfig = (configService: ConfigService): TypeOptions => ({
  baseUrl: resolveApplicationBaseUrl(configService),
  services: [
    new GoogleProvider({
      client_id: configService.getOrThrow<string>('GOOGLE_CLIENT_ID'),
      client_secret: configService.getOrThrow<string>(
        'GOOGLE_CLIENT_SECRET'
      ),
      scopes: ['email', 'profile']
    }),
    new YandexProvider({
      client_id: configService.getOrThrow<string>('YANDEX_CLIENT_ID'),
      client_secret: configService.getOrThrow<string>(
        'YANDEX_CLIENT_SECRET'
      ),
      scopes: ['login:email', 'login:avatar', 'login:info']
    })
  ]
})