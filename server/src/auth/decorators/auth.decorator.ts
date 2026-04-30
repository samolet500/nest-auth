/**
 * Комбинированный декоратор `@Authorization`: вешает на маршрут guard’ы аутентификации и при необходимости проверки ролей.
 *
 * - Без аргументов: только `AuthGuard` (нужна сессия с `userId`, в `request.user` попадает пользователь).
 * - С ролями: сначала `Roles(...)` задаёт метаданные допустимых ролей, затем `AuthGuard`, затем `RolesGuard`
 *   сравнивает `request.user.role` с этим списком.
 *
 * Используйте вместе с `@Authorized()` в параметрах обработчика, если нужен доступ к текущему пользователю.
 */
import { applyDecorators, UseGuards } from '@nestjs/common';
import { UserRole } from 'generated/prisma/enums';

import { AuthGuard } from '../guards/auth.guard';
import { RolesGuard } from '../guards/roles.guard';

import { Roles } from './roles.decorator';

/**
 * Собирает декораторы Nest: либо только вход по сессии, либо вход + ограничение по `UserRole`.
 */
export function Authorization(...roles: UserRole[]) {
	if (roles.length > 0) {
		return applyDecorators(
			Roles(...roles),
			UseGuards(AuthGuard, RolesGuard)
		);
	}

	return applyDecorators(UseGuards(AuthGuard));
}
