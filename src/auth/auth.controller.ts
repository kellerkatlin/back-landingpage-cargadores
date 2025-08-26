import {
  Body,
  Controller,
  Post,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { Response } from 'express';

@Controller('auth')
export class AuthController {
  @Post('login')
  login(
    @Body('password') password: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!password || password !== 'keller123') {
      throw new UnauthorizedException('Unauthorized');
    }

    // Cookie legible por el front (NO httpOnly)
    res.cookie('admin_session', 'ok', {
      httpOnly: false, // <-- clave para que el front la lea
      signed: false, // firmarla no aporta si el front la leerá
      sameSite: 'lax',
      secure: false, // en prod con HTTPS: true
      path: '/', // importante para borrarla luego
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return { ok: true };
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('admin_session', {
      httpOnly: true,
      sameSite: 'lax',
    });
    return { ok: true };
  }
}
