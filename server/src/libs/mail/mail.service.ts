/**
 * Сервис отправки писем: рендерит HTML-шаблоны и отправляет их через SMTP.
 */
import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { render } from '@react-email/components';
import { ConfirmationTemplate } from './templates/confirmaton.template';

@Injectable()
export class MailService {
  /** Внедряет SMTP-транспорт и конфигурацию приложения. */
  public constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService
  ) { }

  /** Формирует и отправляет письмо со ссылкой подтверждения email. */
  public async sendConfirmationEmail(email: string, token: string) {
    const domain = this.configService.getOrThrow<string>('ALLOWED_ORIGIN')
    const template = await render(ConfirmationTemplate({ domain, token }))

    return this.sendEmail(email, 'Подтверждение почты', template)
  }

  /** Отправляет готовое HTML-письмо получателю через MailerService. */
  private async sendEmail(email: string, subject: string, template: string) {
    return this.mailerService.sendMail({
      to: email,
      subject: subject || 'No subject',
      html: template,
    });
  }
}