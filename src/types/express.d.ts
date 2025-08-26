import 'express-serve-static-core';

declare module 'express-serve-static-core' {
  interface Request {
    cookies?: Record<string, any>;
    signedCookies?: Record<string, any>;
  }
}
