/**
 * Сервис-реестр OAuth-провайдеров: инициализирует их и ищет по имени сервиса.
 */
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ProviderOptionsSymbols, type TypeOptions } from './provider.constants';
import { BaseOAuthService } from './services/base-oauth.service';

@Injectable()
export class ProviderService implements OnModuleInit {
  /** Получает конфигурацию провайдеров из DI-контейнера Nest. */
  public constructor(@Inject(ProviderOptionsSymbols) private readonly options: TypeOptions) { }

  /** При старте модуля проставляет общий baseUrl каждому провайдеру. */
  public onModuleInit() {
    for (const provider of this.options.services) {
      provider.baseUrl = this.options.baseUrl;
    }
  }

  /** Возвращает экземпляр провайдера по имени или null, если не найден. */
  public findByService(service: string): BaseOAuthService | null {
    return this.options.services.find(s => s.name === service) ?? null;
  }
}
