/**
 * HTTP-слой восстановления пароля: запрос ссылки на email и установка нового пароля по токену.
 */
import { Body, Controller, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { PasswordRecoveryService } from './password-recovery.service';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Recaptcha } from '@nestlab/google-recaptcha';
import { NewPasswordDto } from './dto/new-password.dto';

@Controller('auth/password-recovery')
export class PasswordRecoveryController {
  /** Подключает сервис сценариев сброса пароля. */
  constructor(private readonly passwordRecoveryService: PasswordRecoveryService) { }

  /** Принимает email, создаёт токен PASSWORD_RESET и отправляет письмо со ссылкой/токеном. */
  @Recaptcha()
  @Post('reset')
  @HttpCode(HttpStatus.OK)
  public async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.passwordRecoveryService.resetPassword(dto);
  }

  /** Устанавливает новый пароль по одноразовому токену из письма (в URL). */
  @Recaptcha()
  @Post('new/:token')
  @HttpCode(HttpStatus.OK)
  public async newPassword(
    @Body() dto: NewPasswordDto,
    @Param('token') token: string
  ) {
    return this.passwordRecoveryService.newPassword(dto, token);
  }
}
