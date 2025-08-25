import { Body, Controller, Post, Res } from '@nestjs/common';
import { Response } from 'express';

@Controller('auth')
export class AuthController {
  @Post('login')
  login(@Body('password') password: string, @Res() res: Response) {
    if (!password || password !== 'keller123') {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    res.cookie('admin_session', 'ok', {
      httpOnly: true,
      signed: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return res.json({ ok: true });
  }
}
