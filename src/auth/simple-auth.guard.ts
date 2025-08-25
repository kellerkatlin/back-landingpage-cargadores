import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class SimpleAuthGuard implements CanActivate {
  canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest();
    return req?.signedCookies?.admin_session === 'ok';
  }
}
