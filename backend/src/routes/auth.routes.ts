import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';
import { config } from '../config';
import { authenticate } from '../middlewares/auth';
import { createAuditLog } from '../services/audit.service';
import { createNotification } from '../services/notification.service';
import { AuthRequest, AuditAction } from '../types';

const router = Router();

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({ error: 'Conta desativada. Contate um administrador.' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const token = jwt.sign({ userId: user.id }, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn as any,
    });

    await createAuditLog(
      { action: AuditAction.USER_LOGIN, entityType: 'User', entityId: user.id },
      { user: { id: user.id, email: user.email, name: user.name, role: user.role, status: user.status }, headers: req.headers, ip: req.ip } as AuthRequest
    );

    const { password: _, ...userWithoutPassword } = user;

    return res.json({
      token,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        avatar: true,
        phone: true,
        department: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    return res.json(user);
  } catch (error) {
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT /api/auth/password
router.put('/password', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Senha atual e nova senha são obrigatórias' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'A nova senha deve ter no mínimo 6 caracteres' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const validPassword = await bcrypt.compare(currentPassword, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Senha atual incorreta' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    await createAuditLog(
      { action: AuditAction.PASSWORD_CHANGED, entityType: 'User', entityId: user.id },
      req as AuthRequest
    );

    return res.json({ message: 'Senha alterada com sucesso' });
  } catch (error) {
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT /api/auth/profile
router.put('/profile', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { name, phone, department } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        ...(name && { name }),
        ...(phone !== undefined && { phone }),
        ...(department !== undefined && { department }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        avatar: true,
        phone: true,
        department: true,
      },
    });

    await createAuditLog(
      { action: AuditAction.USER_UPDATED, entityType: 'User', entityId: user.id, details: { name, phone, department } },
      req as AuthRequest
    );

    return res.json(user);
  } catch (error) {
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;
