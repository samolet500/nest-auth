/**
 * HTTP-контроллер аутентификации: регистрация, вход, OAuth-подключение и выход.
 */
import { BadRequestException, Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import type { Request, Response } from 'express';
import { LoginDto } from './dto/login.dto';
import { Recaptcha } from '@nestlab/google-recaptcha';
import { AuthProviderGuard } from './guards/provider.guard';
import { ProviderService } from './provider/provider.service';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class AuthController {
  /** Внедряет зависимости сервисов аутентификации, провайдеров и конфигурации. */
  public constructor(
    private readonly authService: AuthService,
    private readonly providerService: ProviderService,
    private readonly configService: ConfigService
  ) { }

  /** Регистрирует пользователя по email/паролю и создаёт серверную сессию. */
  @Recaptcha()
  @Post('register')
  @HttpCode(HttpStatus.OK)
  public async register(@Req() req: Request, @Body() dto: RegisterDto) {
    return await this.authService.register(req, dto);
  }

  /** Выполняет вход по email/паролю и сохраняет userId в сессии. */
  @Recaptcha()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  public async login(@Req() req: Request, @Body() dto: LoginDto) {
    return await this.authService.login(req, dto);
  }

  /** Обрабатывает callback OAuth-провайдера по коду авторизации. */
  @Get('/oauth/callback/:provider')
  /** Возвращает URL для старта OAuth-авторизации через выбранный провайдер. */
  @UseGuards(AuthProviderGuard)
  public async callback(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Query('code') code: string,
    @Param('provider') provider: string
  ) {
    if (!code) {
      throw new BadRequestException('Не был предоставлен код авторизации');
    }

    await this.authService.extractProfileFromCode(req, provider, code);

    return res.redirect(`${this.configService.getOrThrow<string>('ALLOWED_ORIGIN')}/dashboard/settings`);
  }

  @UseGuards(AuthProviderGuard)
  @Get('/oauth/connect/:provider')
  public async connect(@Param('provider') provider: string) {
    const providerInstance = this.providerService.findByService(provider);

    return {
      url: providerInstance?.getAuthUrl(),
    }
  }

  /** Завершает пользовательскую сессию и очищает cookie сессии. */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  public async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return await this.authService.logout(req, res);
  }
}
