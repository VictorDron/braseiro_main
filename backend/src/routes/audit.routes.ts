import { Router, Response } from 'express';
import prisma from '../config/database';
import { authenticate, requireAdmin } from '../middlewares/auth';
import { AuthRequest } from '../types';
import { getPaginationParams } from '../utils/helpers';

const router = Router();
router.use(authenticate);
router.use(requireAdmin);

// GET /api/audit - List audit logs (admin only)
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query as any);
    const { search, action, entityType, userId, startDate, endDate } = req.query;

    const where: any = {};

    if (search) {
      where.OR = [
        { userEmail: { contains: search as string, mode: 'insensitive' } },
        { action: { contains: search as string, mode: 'insensitive' } },
        { entityId: { contains: search as string, mode: 'insensitive' } },
      ];
    }
    if (action) where.action = action;
    if (entityType) where.entityType = entityType;
    if (userId) where.userId = userId;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return res.json({
      data: logs,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao listar logs' });
  }
});

// GET /api/audit/stats
router.get('/stats', async (req: AuthRequest, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thisWeek = new Date(today);
    thisWeek.setDate(thisWeek.getDate() - 7);
    const thisMonth = new Date(today);
    thisMonth.setDate(1);

    const [todayCount, weekCount, monthCount, totalCount] = await Promise.all([
      prisma.auditLog.count({ where: { createdAt: { gte: today } } }),
      prisma.auditLog.count({ where: { createdAt: { gte: thisWeek } } }),
      prisma.auditLog.count({ where: { createdAt: { gte: thisMonth } } }),
      prisma.auditLog.count(),
    ]);

    const byAction = await prisma.auditLog.groupBy({
      by: ['action'],
      _count: true,
      where: { createdAt: { gte: thisMonth } },
      orderBy: { _count: { action: 'desc' } },
      take: 10,
    });

    const byUser = await prisma.auditLog.groupBy({
      by: ['userId', 'userEmail'],
      _count: true,
      where: { createdAt: { gte: thisMonth } },
      orderBy: { _count: { userId: 'desc' } },
      take: 10,
    });

    return res.json({
      today: todayCount,
      thisWeek: weekCount,
      thisMonth: monthCount,
      total: totalCount,
      byAction: byAction.map((a) => ({ action: a.action, count: a._count })),
      byUser: byUser.map((u) => ({ userId: u.userId, email: u.userEmail, count: u._count })),
    });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao carregar estatísticas de audit' });
  }
});

// GET /api/audit/entity/:entityType/:entityId
router.get('/entity/:entityType/:entityId', async (req: AuthRequest, res: Response) => {
  try {
    const logs = await prisma.auditLog.findMany({
      where: {
        entityType: req.params.entityType,
        entityId: req.params.entityId,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json(logs);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao buscar logs da entidade' });
  }
});

export default router;
