import type { AuthenticatedUser } from '../modules/auth/token-service';

declare global {
  namespace Express {
    interface Request {
      /** Set by the authentication middleware once the access token is verified. */
      authenticatedUser?: AuthenticatedUser;
    }
  }
}

export {};
