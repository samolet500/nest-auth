/**
 * OAuth-адаптер Yandex: задаёт endpoints и маппит профиль в единый формат.
 */
import { BaseOAuthService } from "./base-oauth.service";
import { TypeProviderOptions } from "./types/provider.options.types";
import { TypeUserInfo } from "./types/user-info.types";
import { YandexProfile } from "./types/yandex-rofile.type";

export class YandexProvider extends BaseOAuthService {
  /** Инициализирует OAuth-настройки Yandex из переданных credentials/scopes. */
  public constructor(options: TypeProviderOptions) {
    super({
      name: 'yandex',
      authorize_url: 'https://oauth.yandex.ru/authorize',
      access_url: 'https://oauth.yandex.ru/token',
      profile_url: 'https://login.yandex.ru/info?format=json',
      scopes: options.scopes,
      client_id: options.client_id,
      client_secret: options.client_secret
    })
  }

  /** Преобразует ответ Yandex Info API в внутренний формат TypeUserInfo. */
  public async extractUserInfo(data: YandexProfile): Promise<TypeUserInfo> {
    return super.extractUserInfo({
      email: data.emails?.[0],
      name: data.display_name,
      picture: data.default_avatar_id
        ? `https://avatars.yandex.net/get-yapic/${data.default_avatar_id}/islands-200`
        : undefined
    });
  }
}