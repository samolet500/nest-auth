import { Injectable, NotFoundException } from '@nestjs/common';
import { AuthMethod } from 'generated/prisma/enums';
import { hash } from 'argon2';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UserService {
  public constructor(private readonly prismaService: PrismaService) {}

  /**
   * Возвращает пользователя по id вместе со связанными аккаунтами.
   * Если пользователя нет — выбрасывает NotFoundException.
   */
  public async findById(id: string) {
    const user = await this.prismaService.user.findUnique({
      where: {
        id,
      },
      include: {
        accounts: true,
      },
    });
    if (!user) {
      throw new NotFoundException(
        'Пользователь не найден, пожалуйста, проверьте корректность введенных данных',
      );
    }
    return user;
  }

  /**
   * Ищет пользователя по email вместе со связанными аккаунтами.
   * Если не найден — возвращает null (без исключения).
   */
  public async findByEmail(email: string) {
    const user = await this.prismaService.user.findUnique({
      where: {
        email,
      },
      include: {
        accounts: true,
      },
    });
    // if (!user) {
    //   throw new NotFoundException(
    //     'Пользователь не найден, пожалуйста, проверьте корректность введенных данных',
    //   );
    // }
    return user;
  }

  /**
   * Создаёт пользователя: пароль хешируется через argon2 (пустая строка, если пароля нет).
   * Возвращает созданную запись с аккаунтами.
   */
  public async create(
    email: string,
    password: string,
    name: string,
    picture: string,
    authMethod: AuthMethod,
    isVerified: boolean,
  ) {
    const user = await this.prismaService.user.create({
      data: {
        email,
        password: password ? await hash(password) : '',
        name,
        picture,
        authMethod,
        isVerified,
      },
      include: {
        accounts: true,
      },
    });
    return user;
  }
}
