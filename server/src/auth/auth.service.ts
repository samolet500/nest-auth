import { ConflictException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { UserService } from '@/user/user.service';
import { AuthMethod } from 'generated/prisma/enums';
import { User } from 'generated/prisma/client';

@Injectable()
export class AuthService {
  public constructor(private readonly userService: UserService) {}

  /**
   * Регистрация по email: проверяет уникальность email, создаёт пользователя
   * с методом входа EMAIL и без верификации, возвращает созданную запись.
   */
  public async register(req: Request, dto: RegisterDto) {
    const isUserExists = await this.userService.findByEmail(dto.email);

    if (isUserExists) {
      throw new ConflictException(
        'Регистрация не удалась. Пользователь с таким email уже существует. Пожалуйста, используйте другой email или войдите в систему.',
      );
    }

    const user = await this.userService.create(
      dto.email,
      dto.password,
      dto.name,
      '',
      AuthMethod.EMAIL,
      false,
    );
    
    await this.saveSession(req, user);

    return user;
  }

  /** Вход в систему (реализация позже). */
  public async login() {}

  /** Выход из системы: очистка сессии и т.п. (реализация позже). */
  public async logout() {}

  /** Сохранение сессии после успешной аутентификации. */
  private async saveSession(req: Request, user: User) {
    return new Promise((resolve, reject) => {
      req.session.user = user.id;
      
      req.session.save((err) => {
        if (err) {
          return reject(
            new InternalServerErrorException(
              'Не удалось сохранить сессию. Проверьте, правильно ли настроены параметры сессии.',
            ),
          );
        }
        resolve(true);
      });
    })
  }
}
