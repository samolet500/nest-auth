import { Controller, Get, HttpCode, HttpStatus, Param } from '@nestjs/common';
import { UserRole, type User } from 'generated/prisma/client';
import { Authorized } from '@/auth/decorators/authorized.decorator';
import { Authorization } from '@/auth/decorators/auth.decorator';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('profile')
  @HttpCode(HttpStatus.OK)
  @Authorization()
  public async findeProfile(@Authorized() user: User) {
    return user;
  }

  @Get('/:id')
  @HttpCode(HttpStatus.OK)
  @Authorization(UserRole.ADMIN)
  public async findeUser(@Param('id') id: string) {
    return this.userService.findById(id);
  }

  @Get()
  getHello(): string {
    return 'Hello Max World!';
  }
}
