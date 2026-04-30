/**
 * Сервис восстановления пароля: токен PASSWORD_RESET в БД и письмо со ссылкой на сброс.
 */
import { MailService } from '@/libs/mail/mail.service';
import { PrismaService } from '@/prisma/prisma.service';
import { UserService } from '@/user/user.service';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { TokenType } from 'generated/prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { NewPasswordDto } from './dto/new-password.dto';
import { hash } from 'argon2';

@Injectable()
export class PasswordRecoveryService {
  /** Внедряет БД, поиск пользователя и отправку писем с токеном сброса. */
  public constructor(
    private readonly prismaService: PrismaService,
    private readonly userService: UserService,
    private readonly mailService: MailService,
  ) { }

  /** По email создаёт или заменяет токен сброса и отправляет письмо (если пользователь существует). */
  public async resetPassword(dto: ResetPasswordDto) {
    const existingUser = await this.userService.findByEmail(dto.email);

    if (!existingUser) {
      throw new NotFoundException('Пользователь не найден. Пожалуйста, проверьте введенный адрес электронной почты и попробуйте снова.')
    }

    const passwordResetToken = await this.generatePasswordResetToken(existingUser.email);

    await this.mailService.sendPasswordResetEmail(passwordResetToken.email, passwordResetToken.token);

    return true;
  }

  /** Проверяет токен, обновляет пароль пользователя и удаляет использованный токен. */
  public async newPassword(dto: NewPasswordDto, token: string) {
    const existingToken = await this.prismaService.token.findFirst({
      where: {
        token,
        type: TokenType.PASSWORD_RESET
      }
    })

    if (!existingToken) {
      throw new NotFoundException('Токен не найден. Пожалуйста, проверьте правильность введенного токена или запросите новый.')
    }

    const hasExpired = new Date(existingToken.expiresIn) < new Date()
    
    if (hasExpired) {
			throw new BadRequestException(
				'Токен истек. Пожалуйста, запросите новый токен для подтверждения сброса пароля.'
			)
		}

		const existingUser = await this.userService.findByEmail(
			existingToken.email
		)

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
				password: await hash(dto.password)
			}
		})

		await this.prismaService.token.delete({
			where: {
				id: existingToken.id,
				type: TokenType.PASSWORD_RESET
			}
		})

		return true
  }

  /** Генерирует uuid-токен с TTL ~1 час и записью в таблице tokens. */
  private async generatePasswordResetToken(email: string) {
    const token = uuidv4()
    const expiresIn = new Date(new Date().getTime() + 3600 * 1000)

    const existingToken = await this.prismaService.token.findFirst({
      where: {
        email,
        type: TokenType.PASSWORD_RESET
      }
    })

    if (existingToken) {
      await this.prismaService.token.delete({
        where: {
          id: existingToken.id,
          type: TokenType.PASSWORD_RESET
        }
      })
    }

    const passwordResetToken = await this.prismaService.token.create({
      data: {
        email,
        token,
        expiresIn,
        type: TokenType.PASSWORD_RESET
      }
    })

    return passwordResetToken
  }
}

