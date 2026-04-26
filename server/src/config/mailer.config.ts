/**
 * Конфигурация SMTP-транспорта и дефолтного отправителя для MailerModule.
 */
import { MailerOptions } from '@nestjs-modules/mailer'
import { ConfigService } from '@nestjs/config'

/** Собирает настройки SMTP из env для асинхронной инициализации MailerModule. */
export const getMailerConfig = async (
  configService: ConfigService
): Promise<MailerOptions> => ({
  transport: {
    host: configService.getOrThrow<string>('MAIL_HOST'),
    port: configService.getOrThrow<number>('MAIL_PORT'),
    secure: configService.getOrThrow<boolean>('MAIL_SECURE'),
    auth: {
      user: configService.getOrThrow<string>('MAIL_LOGIN'),
      pass: configService.getOrThrow<string>('MAIL_PASSWORD')
    }
  },
  defaults: {
    from: `"Nest Auth App" ${configService.getOrThrow<string>('MAIL_LOGIN')}`
  }
})
