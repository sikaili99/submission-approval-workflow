import type { NextFunction, Request, Response } from 'express';
import type { Role } from '../../domain/workflow.js';
import { prisma } from '../../lib/db.js';
import { ApiError } from '../errors.js';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/**
 * Resolves `Authorization: Bearer <token>` to a seeded user. This is
 * intentionally simple (no JWT/passwords) but the lookup is real and the
 * resulting role is what every downstream authorization check trusts.
 */
export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const header = req.header('authorization') ?? '';
    const match = /^Bearer\s+(.+)$/i.exec(header);
    if (!match) {
      throw ApiError.unauthenticated('Provide an Authorization: Bearer <token> header');
    }

    const token = match[1]!.trim();
    const user = await prisma.user.findUnique({ where: { token } });
    if (!user) {
      throw ApiError.unauthenticated('Invalid or unknown token');
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as Role,
    };
    next();
  } catch (err) {
    next(err);
  }
}

export function requireRole(role: Role) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(ApiError.unauthenticated());
      return;
    }
    if (req.user.role !== role) {
      next(ApiError.forbidden(`This action requires the ${role} role`));
      return;
    }
    next();
  };
}
