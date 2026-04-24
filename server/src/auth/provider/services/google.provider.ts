/**
 * OAuth-адаптер Google: задаёт endpoints и маппит профиль в единый формат.
 */
import { BaseOAuthService } from "./base-oauth.service";
import { GoogleProfile } from "./types/google-profile.types";
import { TypeProviderOptions } from "./types/provider.options.types";
import { TypeUserInfo } from "./types/user-info.types";

export class GoogleProvider extends BaseOAuthService {
  /** Инициализирует OAuth-настройки Google из переданных credentials/scopes. */
  public constructor(options: TypeProviderOptions) {
    super({
      name: 'google',
      authorize_url: 'https://accounts.google.com/o/oauth2/v2/auth',
      access_url: 'https://oauth2.googleapis.com/token',
      profile_url: 'https://www.googleapis.com/oauth2/v3/userinfo',
      client_id: options.client_id,
      client_secret: options.client_secret,
      scopes: options.scopes,
    })
  }

  /** Преобразует ответ Google UserInfo в внутренний формат TypeUserInfo. */
  public async extractUserInfo(data: GoogleProfile): Promise<TypeUserInfo> {
    return super.extractUserInfo({
      email: data.email,
      name: data.name,
      picture: data.picture,
    });
  }
}