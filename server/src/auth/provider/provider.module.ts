/**
 * Динамический модуль провайдеров OAuth: регистрирует и отдаёт ProviderService.
 */
import { DynamicModule, Module } from '@nestjs/common';
import { ProviderService } from './provider.service';
import { ProviderOptionsSymbols, TypeAsyncOptions, TypeOptions } from './provider.constants';

@Module({})
export class ProviderModule {
  /** Синхронно регистрирует список OAuth-сервисов и базовый URL приложения. */
  public static register(options: TypeOptions): DynamicModule {
    return {
      module: ProviderModule,
      providers: [
        {
          provide: ProviderOptionsSymbols,
          useValue: options.services,
        },
        ProviderService,
      ],
      exports: [
        ProviderService,
      ],
    }
  }

  /** Асинхронно регистрирует провайдеры через фабрику и зависимости Nest. */
  public static registerAsync(options: TypeAsyncOptions): DynamicModule {
    return {
      module: ProviderModule,
      imports: options.imports,
      providers: [
        {
          useFactory: options.useFactory,
          provide: ProviderOptionsSymbols,
          inject: options.inject
        },
        ProviderService
      ],
      exports: [ProviderService]
    }
  }
}
