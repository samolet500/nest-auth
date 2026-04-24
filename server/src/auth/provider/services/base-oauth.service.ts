/**
 * Базовый OAuth-сервис: строит URL авторизации, меняет code на токены и получает профиль.
 */
import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import type { TypeBaseProviderOptions } from "./types/base-provider.options.types";
import type { TypeUserInfo } from "./types/user-info.types";

@Injectable()
export class BaseOAuthService {
  private BASE_URL: string;

  /** Сохраняет базовые параметры OAuth-провайдера. */
  public constructor(private readonly options: TypeBaseProviderOptions) { }

  /** Нормализует данные профиля и дописывает поле provider. */
  protected async extractUserInfo(data: any): Promise<TypeUserInfo> {
    return {
      ...data,
      provider: this.options.name,
    }
  }

  /** Формирует URL для редиректа пользователя на страницу авторизации провайдера. */
  public getAuthUrl() {
    const query = new URLSearchParams({
      response_type: 'code',
      client_id: this.options.client_id,
      redirect_uri: this.getRedirectUrl(),
      scope: (this.options.scopes ?? []).join(' '),
      access_type: 'offline',
      prompt: 'select_account',
    });

    return `${this.options.authorize_url}?${query}`;
  }

  /** По коду авторизации получает токены и профиль пользователя у провайдера. */
  public async findUserByCode(code: string): Promise<TypeUserInfo> {
    const client_id = this.options.client_id;
    const client_secret = this.options.client_secret;

    const tokenQuery = new URLSearchParams({
      client_id,
      client_secret,
      code,
      redirect_uri: this.getRedirectUrl(),
      grant_type: 'authorization_code',
    });

    const tokenRequest = await fetch(this.options.access_url, {
      method: 'POST',
      body: tokenQuery,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
    });

    if (!tokenRequest.ok) {
      throw new BadRequestException(`Не удалось получить пользователя с ${this.options.profile_url}. Проверьте правильность токена доступа.`);
    }

    const tokens = await tokenRequest.json();

    if (!tokens.access_token) {
      throw new BadRequestException(`Нет токенов с ${this.options.access_url}. Уббедитесь, что код авторизации действителен.`);
    }

    const userRequest = await fetch(this.options.profile_url, {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`,
      },
    })

    if (!userRequest.ok) {
      throw new UnauthorizedException(`Не удалось получить пользователя с ${this.options.profile_url}. Проверьте правильность токена доступа.`);
    }

    const user = await userRequest.json();

    const userData = await this.extractUserInfo(user);

    return {
      ...userData,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: tokens.expires_at || tokens.expires_in,
      provider: this.options.name,
    }
  }

  /** Возвращает callback URL текущего провайдера для OAuth-обмена кодом. */
  public getRedirectUrl(): string {
    return `${this.BASE_URL}/auth/oauth/callback/${this.options.name}`;
  }

  /** Устанавливает baseUrl приложения для формирования redirect_uri. */
  set baseUrl(value: string) {
    this.BASE_URL = value;
  }

  /** Возвращает имя текущего OAuth-провайдера. */
  get name(): string {
    return this.options.name;
  }

  /** Возвращает URL обмена code -> token для провайдера. */
  get accessUrl(): string {
    return this.options.access_url;
  }

  /** Возвращает URL получения профиля пользователя у провайдера. */
  get profileUrl(): string {
    return this.options.profile_url;
  }

  /** Возвращает список OAuth-scopes текущего провайдера. */
  get scopes(): string[] {
    return this.options.scopes;
  }
}