import { Router, Response } from 'express';
import prisma from '../config/database';
import { authenticate } from '../middlewares/auth';
import { AuthRequest } from '../types';

const router = Router();
router.use(authenticate);

// GET /api/dashboard
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const [
      totalAssets,
      availableAssets,
      inUseAssets,
      maintenanceAssets,
      totalPurchases,
      pendingPurchases,
      totalSuppliers,
      totalUsers,
    ] = await Promise.all([
      prisma.asset.count(),
      prisma.asset.count({ where: { status: 'AVAILABLE' } }),
      prisma.asset.count({ where: { status: 'IN_USE' } }),
      prisma.asset.count({ where: { status: 'MAINTENANCE' } }),
      prisma.purchaseRequest.count(),
      prisma.purchaseRequest.count({ where: { status: 'PENDING_APPROVAL' } }),
      prisma.supplier.count({ where: { isActive: true } }),
      prisma.user.count({ where: { status: 'ACTIVE' } }),
    ]);

    // Recent activity
    const recentActivity = await prisma.auditLog.findMany({
      include: {
        user: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Upcoming maintenance
    const upcomingMaintenance = await prisma.assetMaintenance.findMany({
      where: {
        status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
        scheduledDate: { gte: new Date() },
      },
      include: {
        asset: { select: { name: true, code: true } },
      },
      orderBy: { scheduledDate: 'asc' },
      take: 5,
    });

    return res.json({
      stats: {
        totalAssets,
        availableAssets,
        inUseAssets,
        maintenanceAssets,
        totalPurchases,
        pendingPurchases,
        totalSuppliers,
        totalUsers,
      },
      recentActivity,
      upcomingMaintenance,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao carregar dashboard' });
  }
});

export default router;
