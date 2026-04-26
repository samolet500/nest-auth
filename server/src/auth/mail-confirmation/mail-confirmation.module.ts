/**
 * Модуль подтверждения почты: связывает контроллер, сервис и зависимости для email-верификации.
 */
import { forwardRef, Module } from '@nestjs/common';
import { MailConfirmationService } from './mail-confirmation.service';
import { MailConfirmationController } from './mail-confirmation.controller';
import { AuthModule } from '../auth.module';
import { UserModule } from '@/user/user.module';
import { MailModule } from '@/libs/mail/mail.module';

@Module({
  imports: [UserModule, MailModule, forwardRef(() => AuthModule)],
  controllers: [MailConfirmationController],
  providers: [MailConfirmationService],
  exports: [MailConfirmationService],
})
export class MailConfirmationModule { }
