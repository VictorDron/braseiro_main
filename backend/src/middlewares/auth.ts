import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';
import { config } from '../config';
import { AuthRequest, AuthUser, UserRole } from '../types';
import { AppError } from './errorHandler';

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwt.secret) as { userId: string };

    prisma.user
      .findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
        },
      })
      .then((user) => {
        if (!user) {
          return res.status(401).json({ error: 'Usuário não encontrado' });
        }

        if (user.status !== 'ACTIVE') {
          return res.status(403).json({ error: 'Conta desativada' });
        }

        req.user = user as AuthUser;
        next();
      })
      .catch(() => {
        return res.status(500).json({ error: 'Erro interno de autenticação' });
      });
  } catch {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== UserRole.ADMIN) {
    return res.status(403).json({ error: 'Acesso restrito a administradores' });
  }
  next();
}

export function requireRole(...roles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role as UserRole)) {
      return res.status(403).json({ error: 'Permissão insuficiente' });
    }
    next();
  };
}
