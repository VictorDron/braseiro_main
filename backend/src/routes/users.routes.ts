import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/database';
import { authenticate, requireAdmin } from '../middlewares/auth';
import { createAuditLog } from '../services/audit.service';
import { createNotification } from '../services/notification.service';
import { AuthRequest, AuditAction } from '../types';
import { getPaginationParams } from '../utils/helpers';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/users - List users (admin only)
router.get('/', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query as any);
    const { search, role, status } = req.query;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
      ];
    }
    if (role) where.role = role;
    if (status) where.status = status;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
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
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return res.json({
      data: users,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/users - Create user (admin only)
router.post('/', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { email, password, name, role, phone, department } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, senha e nome são obrigatórios' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'A senha deve ter no mínimo 6 caracteres' });
    }

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (existing) {
      return res.status(409).json({ error: 'Email já cadastrado' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        name,
        role: role || 'USER',
        phone,
        department,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        phone: true,
        department: true,
        createdAt: true,
      },
    });

    await createAuditLog(
      { action: AuditAction.USER_CREATED, entityType: 'User', entityId: user.id, details: { email: user.email, role: user.role } },
      req as AuthRequest
    );

    await createNotification({
      userId: user.id,
      title: 'Bem-vindo ao Braseiro!',
      message: `Sua conta foi criada por ${req.user!.name}. Faça login para começar.`,
      type: 'welcome',
      sendEmailNotification: true,
    });

    return res.status(201).json(user);
  } catch (error) {
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/users/:id
router.get('/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
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
        updatedAt: true,
        _count: {
          select: {
            responsibleAssets: true,
            purchaseRequests: true,
          },
        },
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

// PATCH /api/users/:id
router.patch('/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { name, role, status, phone, department } = req.body;

    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(role && { role }),
        ...(status && { status }),
        ...(phone !== undefined && { phone }),
        ...(department !== undefined && { department }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        phone: true,
        department: true,
      },
    });

    const action = status === 'INACTIVE' ? AuditAction.USER_DEACTIVATED
      : status === 'ACTIVE' ? AuditAction.USER_ACTIVATED
      : AuditAction.USER_UPDATED;

    await createAuditLog(
      { action, entityType: 'User', entityId: updated.id, details: { name, role, status, phone, department } },
      req as AuthRequest
    );

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/users/list/all - Simple user list for selects (any authenticated user)
router.get('/list/all', async (req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      where: { status: 'ACTIVE' },
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
      },
      orderBy: { name: 'asc' },
    });

    return res.json(users);
  } catch (error) {
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;
