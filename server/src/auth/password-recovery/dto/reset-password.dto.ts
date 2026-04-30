/**
 * DTO запроса сброса пароля: только email для отправки письма с токеном.
 */
import { IsEmail, IsNotEmpty } from 'class-validator'

export class ResetPasswordDto {
  @IsEmail({}, { message: 'Введите корректный адрес электронной почты.' })
  @IsNotEmpty({ message: 'Поле email не может быть пустым.' })
  email: string
}
