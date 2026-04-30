/**
 * HTTP-контроллер пользователей: профиль текущего пользователя, просмотр по id (админ), обновление профиля.
 */
import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch } from '@nestjs/common';
import { UserRole, type User } from 'generated/prisma/client';
import { Authorized } from '@/auth/decorators/authorized.decorator';
import { Authorization } from '@/auth/decorators/auth.decorator';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UserController {
  /** Подключает сервис домена пользователя. */
  constructor(private readonly userService: UserService) { }

  /** Возвращает профиль авторизованного пользователя из сессии (без повторного запроса в БД). */
  @Get('profile')
  @HttpCode(HttpStatus.OK)
  @Authorization()
  public async findeProfile(@Authorized() user: User) {
    return user;
  }

  /** Возвращает пользователя по id; доступ только у роли ADMIN. */
  @Get('/:id')
  @HttpCode(HttpStatus.OK)
  @Authorization(UserRole.ADMIN)
  public async findeUser(@Param('id') id: string) {
    return this.userService.findById(id);
  }

  /** Обновляет данные профиля текущего пользователя (email, имя, флаг 2FA). */
  @Authorization()
  @HttpCode(HttpStatus.OK)
  @Patch('profile')
  public async updateProfile(
    @Authorized('id') userId: string,
    @Body() dto: UpdateUserDto
  ) {
    return this.userService.update(userId, dto)
  }
}
