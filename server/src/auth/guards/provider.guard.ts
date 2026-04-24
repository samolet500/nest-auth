/**
 * Guard проверки OAuth-провайдера: убеждается, что провайдер зарегистрирован.
 */
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException
} from '@nestjs/common'
import { Request } from 'express'

import { ProviderService } from '../provider/provider.service'

@Injectable()
export class AuthProviderGuard implements CanActivate {
  /** Внедряет сервис поиска OAuth-провайдеров. */
  public constructor(private readonly providerService: ProviderService) { }

  /** Проверяет наличие провайдера в конфигурации перед доступом к маршруту. */
  public canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest() as Request

    const provider = request.params.provider as string

    const providerInstance = this.providerService.findByService(provider as string)

    if (!providerInstance) {
      throw new NotFoundException(
        `Провайдер "${provider}" не найден. Пожалуйста, проверьте правильность введенных данных.`
      )
    }

    return true
  }
}
