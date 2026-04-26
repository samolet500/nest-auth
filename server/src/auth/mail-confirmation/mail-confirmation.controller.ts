/**
 * Контроллер подтверждения email: принимает токен и завершает верификацию аккаунта.
 */
import { Body, Controller, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import { MailConfirmationService } from './mail-confirmation.service';
import { ConfirmationDto } from './dto/mail-confirmation.dto';
import type { Request } from 'express';

@Controller('auth/email-confirmation')
export class MailConfirmationController {
  /** Внедряет сервис подтверждения email. */
  constructor(private readonly mailConfirmationService: MailConfirmationService) { }

  /** Подтверждает email по токену и создаёт сессию для пользователя. */
  @Post()
  @HttpCode(HttpStatus.OK)
  public async newVerification(@Req() req: Request, @Body() dto: ConfirmationDto) {
    return this.mailConfirmationService.newVerification(req, dto)
  }
}
