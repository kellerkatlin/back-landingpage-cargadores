import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

type SignedCookieReq = Request & {
  signedCookies?: Record<string, unknown>;
};

@Injectable()
export class SimpleAuthGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<SignedCookieReq>();

    // LOG útil para depurar (borra en prod)
    // console.log('headers', req.headers);
    // console.log('cookies', req.cookies);
    // console.log('signedCookies', req.signedCookies);

    // 1) intenta leer cookie firmada
    const signed = req.signedCookies?.admin_session;
    const signedValue = typeof signed === 'string' ? signed : undefined;

    // 2) fallback: cookie no firmada (por si el secret difiere o no se firmó)
    const plain = (req.cookies as Record<string, unknown> | undefined)
      ?.admin_session;
    const plainValue = typeof plain === 'string' ? plain : undefined;

    const token = signedValue ?? plainValue;

    if (token !== 'ok') {
      throw new UnauthorizedException();
    }
    return true;
  }
}
