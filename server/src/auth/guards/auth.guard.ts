import {
	CanActivate,
	ExecutionContext,
	Injectable,
	UnauthorizedException
} from '@nestjs/common';

import { UserService } from '@/user/user.service';

/**
 * Guard аутентификации: проверяет наличие userId в сессии.
 * Если сессия валидна — загружает пользователя и кладёт его в request.user
 * для дальнейшего использования в контроллерах и guard'ах (например RolesGuard).
 */
@Injectable()
export class AuthGuard implements CanActivate {
	public constructor(private readonly userService: UserService) {}

	public async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest();

		if (typeof request.session.userId === 'undefined') {
			throw new UnauthorizedException(
				'Пользователь не авторизован. Пожалуйста, войдите в систему, чтобы получить доступ.'
			);
		}

		const user = await this.userService.findById(request.session.userId);

		request.user = user;

		return true;
	}
}
