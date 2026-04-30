/**
 * Параметр-декоратор `@Authorized`: подставляет в аргумент обработчика данные текущего пользователя из `request.user`.
 *
 * Как это связано с guard: на маршруте должен быть `@Authorization()` (или с ролями). Он подключает `AuthGuard`,
 * который по `session.userId` загружает пользователя и записывает его в `request.user`. После этого
 * `@Authorized(...)` только читает уже готовый объект — повторного запроса к БД из декоратора нет.
 *
 * Варианты использования:
 * - `@Authorized() user: User` — весь объект пользователя;
 * - `@Authorized('id') userId: string` — одно поле из модели (любой ключ `keyof User`).
 *
 * Первый аргумент колбэка `createParamDecorator` — это то, что вы передали в скобках декоратора (`'id'` или `undefined`).
 */
import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { User } from 'generated/prisma/client';

export const Authorized = createParamDecorator(
	/**
	 * Достаёт `user` из запроса; если передан `data` — возвращает `user[data]`, иначе весь `user`.
	 */
	(data: keyof User | undefined, ctx: ExecutionContext) => {
		const request = ctx.switchToHttp().getRequest();
		const user = request.user;

		return data ? user[data] : user;
	}
);
