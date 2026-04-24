/**
 * Типы и токены DI для настройки модуля OAuth-провайдеров.
 */
import { FactoryProvider, ModuleMetadata } from "@nestjs/common"
import { BaseOAuthService } from "./services/base-oauth.service"

export const ProviderOptionsSymbols = Symbol()

export type TypeOptions = {
  baseUrl: string
  services: BaseOAuthService[]
}

export type TypeAsyncOptions = Pick<ModuleMetadata, 'imports'> & Pick<FactoryProvider<TypeOptions>, 'useFactory' | 'inject'>