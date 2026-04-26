/**
 * Сервис подтверждения email: выдача токена, отправка письма и подтверждение аккаунта.
 */
import { PrismaService } from '@/prisma/prisma.service';
import { BadRequestException, forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Request } from 'express';
import { TokenType, User } from 'generated/prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { ConfirmationDto } from './dto/mail-confirmation.dto';

import { UserService } from '@/user/user.service';
import { AuthService } from '../auth.service';
import { MailService } from '@/libs/mail/mail.service';


@Injectable()
export class MailConfirmationService {
  /** Внедряет зависимости для работы с токенами, пользователями, сессией и почтой. */
  public constructor(
    private readonly prismaService: PrismaService,
    private readonly userService: UserService,
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,
    private readonly mailService: MailService,
  ) { }

  /** Подтверждает email по токену, активирует пользователя и создаёт сессию. */
  public async newVerification(req: Request, dto: ConfirmationDto) {
    const existingToken = await this.prismaService.token.findUnique({
      where: {
        token: dto.token,
        type: TokenType.VERIFICATION,
      },
    })

    if (!existingToken) {
      throw new NotFoundException(
        'Токен подтверждения не найден. Пожалуйста, убедитесь, что у вас правильный токен.'
      )
    }
    const isExpired = new Date(existingToken.expiresIn * 1000) < new Date()

    if (isExpired) {
      throw new BadRequestException(
        'Токен подтверждения истек. Пожалуйста, запросите новый токен для подтверждения.'
      )
    }

    const existingUser = await this.userService.findByEmail(existingToken.email)

    if (!existingUser) {
      throw new NotFoundException(
        'Пользователь не найден. Пожалуйста, проверьте введенный адрес электронной почты и попробуйте снова.'
      )
    }

    await this.prismaService.user.update({
      where: {
        id: existingUser.id
      },
      data: {
        isVerified: true
      }
    })

    await this.prismaService.token.delete({
      where: {
        id: existingToken.id,
        type: TokenType.VERIFICATION
      }
    })

    return this.authService.saveSession(req, existingUser)
  }

  /** Генерирует новый verification-токен и отправляет письмо подтверждения. */
  public async sendVerificationToken(email: string) {
    const verificationToken = await this.generateVerificationToken(email)

    await this.mailService.sendConfirmationEmail(
      verificationToken.email,
      verificationToken.token
    )

    return true
  }

  /** Создаёт одноразовый токен подтверждения с TTL 1 час. */
  private async generateVerificationToken(email: string) {
    const token = uuidv4();
    const expiresIn = new Date(new Date().getTime() + 3600 * 1000);

    const existingToken = await this.prismaService.token.findFirst({
      where: {
        email,
        type: TokenType.VERIFICATION,
      },
    })

    if (existingToken) {
      await this.prismaService.token.delete({
        where: { id: existingToken.id },
      });
    }

    const verificationToken = await this.prismaService.token.create({
      data: {
        email,
        token,
        type: TokenType.VERIFICATION,
        expiresIn: Math.floor(expiresIn.getTime() / 1000),
      },
    });

    return verificationToken;
  }
}
