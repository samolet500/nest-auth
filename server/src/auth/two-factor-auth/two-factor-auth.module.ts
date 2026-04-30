/**
 * Модуль 2FA: регистрирует сервис кодов и подключает почту через MailModule.
 */
import { Module } from '@nestjs/common';
import { TwoFactorAuthService } from './two-factor-auth.service';
import { MailModule } from '@/libs/mail/mail.module';

@Module({
  imports: [MailModule],
  providers: [TwoFactorAuthService],
  exports: [TwoFactorAuthService],
})
export class TwoFactorAuthModule { }
