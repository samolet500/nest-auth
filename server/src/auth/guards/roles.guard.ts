import {
	CanActivate,
	ExecutionContext,
	ForbiddenException,
	Injectable
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from 'generated/prisma/enums';

import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * Guard для проверки ролей пользователя.
 * Считывает метаданные, установленные декоратором @Roles(), и сравнивает
 * с ролью текущего пользователя из запроса. Если роли не указаны — пропускает.
 */
@Injectable()
export class RolesGuard implements CanActivate {
	public constructor(private readonly reflector: Reflector) {}

	public async canActivate(context: ExecutionContext): Promise<boolean> {
		/** Получаем список допустимых ролей из метаданных (декоратор @Roles). */
		const roles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
			context.getHandler(),
			context.getClass()
		]);
		const request = context.switchToHttp().getRequest();

		/** Если декоратор @Roles не навешан — доступ открыт для всех. */
		if (!roles) return true;

		if (!roles.includes(request.user.role)) {
			throw new ForbiddenException(
				'Недостаточно прав. У вас нет прав доступа к этому ресурсу.'
			);
		}

		return true;
	}
}
