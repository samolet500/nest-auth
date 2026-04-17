import { SetMetadata } from '@nestjs/common';
import { UserRole } from 'generated/prisma/enums';

export const ROLES_KEY = 'roles';

/**
 * Декоратор для ограничения доступа к эндпоинту по ролям.
 * Навешивается на контроллер или метод и задаёт список допустимых ролей,
 * которые затем проверяет RolesGuard через Reflector по ключу ROLES_KEY.
 *
 * @example @Roles(UserRole.ADMIN)
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
