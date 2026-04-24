import { ConflictException, Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import type { Request, Response } from 'express';
import { RegisterDto } from './dto/register.dto';
import { UserService } from '@/user/user.service';
import { AuthMethod } from 'generated/prisma/enums';
import { User } from 'generated/prisma/client';
import { LoginDto } from './dto/login.dto';
import { verify } from 'argon2';
import { ConfigService } from '@nestjs/config';
import { ProviderService } from './provider/provider.service';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class AuthService {
  public constructor(
    private readonly prismaService: PrismaService,
    private readonly userService: UserService,
    private readonly configService: ConfigService,
    private readonly providerService: ProviderService
  ) { }

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

  /** Вход в систему. */
  public async login(req: Request, dto: LoginDto) {
    const user = await this.userService.findByEmail(dto.email);

    if (!user || !user.password) {
      throw new NotFoundException('Пользователь не найден. Пожалуйста, проверьте введенные данные.');
    }

    const isPasswordValid = await verify(user.password, dto.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Невернве email или пароль. Пожалуйста, попробуйте еще раз или восстановите пароль, если забыли его.');
    }

    await this.saveSession(req, user);
    return user;
  }

  public async extractProfileFromCode(req: Request, provider: string, code: string) {
    const providerInstance = this.providerService.findByService(provider);
    const profile = await providerInstance?.findUserByCode(code);

    if (!profile) {
      throw new NotFoundException('Профиль не найден. Пожалуйста, попробуйте еще раз или восстановите пароль, если забыли его.');
    }

    const account = await this.prismaService.account.findFirst({
      where: {
        id: profile.id,
        provider: profile.provider,
      },
    });

    let user = account?.userId ? await this.userService.findById(account.userId) : null;

    if (user) {
      return this.saveSession(req, user);
    }

    user = await this.userService.create(
      profile.email,
      '',
      profile.name,
      profile.picture,
      AuthMethod[profile.provider.toUpperCase()],
      true
    );

    if (!account) {
      await this.prismaService.account.create({
        data: {
          userId: user.id,
          type: 'oauth',
          provider: profile.provider,
          accessToken: profile.access_token,
          refreshToken: profile.refresh_token,
          expiresAt: new Date(profile.expires_at ?? 0 * 1000),
        }
      })
    }

    return this.saveSession(req, user);
  }

  /** Выход из системы: очистка сессии. */
  public async logout(req: Request, res: Response): Promise<void> {
    return new Promise((resolve, reject) => {
      req.session.destroy(err => {
        if (err) {
          return reject(
            new InternalServerErrorException(
              'Не удалось завершить сессию. Возможно, возникла проблема с сервером или сессия уже была завершена.'
            )
          )
        }
        res.clearCookie(
          this.configService.getOrThrow<string>('SESSION_NAME')
        )
        resolve()
      })
    })
  }

  /** Сохранение сессии после успешной аутентификации. */
  private async saveSession(req: Request, user: User): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      req.session.userId = user.id;
      req.session.save((err) => {
        if (err) {
          reject(
            new InternalServerErrorException(
              'Не удалось сохранить сессию. Проверьте Redis и параметры сессии.',
              { cause: err },
            ),
          );
          return;
        }
        resolve();
      });
    });
  }
}
