import { Router, Response } from 'express';
import prisma from '../config/database';
import { authenticate, requireAdmin } from '../middlewares/auth';
import { createAuditLog } from '../services/audit.service';
import { createNotification } from '../services/notification.service';
import { AuthRequest, AuditAction } from '../types';
import { generateCode, getPaginationParams } from '../utils/helpers';
import QRCode from 'qrcode';
import { uploadFile } from '../config/s3';

const router = Router();
router.use(authenticate);

// ==================== ASSETS CRUD ====================

// GET /api/assets - List assets
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query as any);
    const { search, status, categoryId, locationId, responsibleId } = req.query;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { code: { contains: search as string, mode: 'insensitive' } },
        { brand: { contains: search as string, mode: 'insensitive' } },
        { serialNumber: { contains: search as string, mode: 'insensitive' } },
      ];
    }
    if (status) where.status = status;
    if (categoryId) where.categoryId = categoryId;
    if (locationId) where.locationId = locationId;
    if (responsibleId) where.responsibleId = responsibleId;

    const [assets, total] = await Promise.all([
      prisma.asset.findMany({
        where,
        include: {
          category: true,
          location: true,
          responsible: { select: { id: true, name: true, email: true } },
          createdBy: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.asset.count({ where }),
    ]);

    return res.json({
      data: assets,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao listar ativos' });
  }
});

// GET /api/assets/stats/overview
router.get('/stats/overview', async (req: AuthRequest, res: Response) => {
  try {
    const [total, available, inUse, maintenance, decommissioned] = await Promise.all([
      prisma.asset.count(),
      prisma.asset.count({ where: { status: 'AVAILABLE' } }),
      prisma.asset.count({ where: { status: 'IN_USE' } }),
      prisma.asset.count({ where: { status: 'MAINTENANCE' } }),
      prisma.asset.count({ where: { status: 'DECOMMISSIONED' } }),
    ]);

    const byCategory = await prisma.asset.groupBy({
      by: ['categoryId'],
      _count: { id: true },
    });

    const categories = await prisma.assetCategory.findMany();
    const byCategoryWithNames = byCategory.map((item) => ({
      category: categories.find((c) => c.id === item.categoryId)?.name || 'Unknown',
      count: item._count.id,
    }));

    const byLocation = await prisma.asset.groupBy({
      by: ['locationId'],
      _count: { id: true },
    });

    const locations = await prisma.assetLocation.findMany();
    const byLocationWithNames = byLocation.map((item) => ({
      location: locations.find((l) => l.id === item.locationId)?.name || 'Unknown',
      count: item._count.id,
    }));

    return res.json({
      total,
      available,
      inUse,
      maintenance,
      decommissioned,
      byCategory: byCategoryWithNames,
      byLocation: byLocationWithNames,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao carregar estatísticas' });
  }
});

// GET /api/assets/:id
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const asset = await prisma.asset.findUnique({
      where: { id: req.params.id },
      include: {
        category: true,
        location: true,
        responsible: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true } },
        movements: {
          include: {
            fromLocation: true,
            toLocation: true,
            movedBy: { select: { id: true, name: true } },
          },
          orderBy: { movedAt: 'desc' },
          take: 10,
        },
        maintenances: {
          include: {
            createdBy: { select: { id: true, name: true } },
            completedBy: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!asset) {
      return res.status(404).json({ error: 'Ativo não encontrado' });
    }

    return res.json(asset);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao buscar ativo' });
  }
});

// POST /api/assets
router.post('/', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, categoryId, locationId, brand, model, serialNumber, acquisitionDate, acquisitionValue, warrantyExpiry, tags, metadata } = req.body;

    if (!name || !categoryId || !locationId) {
      return res.status(400).json({ error: 'Nome, categoria e localização são obrigatórios' });
    }

    const code = generateCode('AST');

    // Generate QR code
    let qrCodeUrl: string | undefined;
    try {
      const qrBuffer = await QRCode.toBuffer(code, { type: 'png', width: 300 });
      qrCodeUrl = await uploadFile(qrBuffer, `${code}.png`, 'image/png', 'qrcodes');
    } catch (qrError) {
      console.error('QR code generation failed:', qrError);
    }

    const asset = await prisma.asset.create({
      data: {
        code,
        name,
        description,
        categoryId,
        locationId,
        brand,
        model,
        serialNumber,
        acquisitionDate: acquisitionDate ? new Date(acquisitionDate) : null,
        acquisitionValue: acquisitionValue || null,
        warrantyExpiry: warrantyExpiry ? new Date(warrantyExpiry) : null,
        tags: tags || [],
        metadata: metadata || {},
        qrCodeUrl,
        createdById: req.user!.id,
      },
      include: {
        category: true,
        location: true,
        createdBy: { select: { id: true, name: true } },
      },
    });

    await createAuditLog(
      { action: AuditAction.ASSET_CREATED, entityType: 'Asset', entityId: asset.id, details: { code: asset.code, name: asset.name } },
      req as AuthRequest
    );

    return res.status(201).json(asset);
  } catch (error) {
    console.error('Create asset error:', error);
    return res.status(500).json({ error: 'Erro ao criar ativo' });
  }
});

// PATCH /api/assets/:id
router.patch('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const asset = await prisma.asset.findUnique({ where: { id: req.params.id } });
    if (!asset) {
      return res.status(404).json({ error: 'Ativo não encontrado' });
    }

    const { name, description, categoryId, brand, model, serialNumber, acquisitionDate, acquisitionValue, currentValue, depreciationRate, warrantyExpiry, tags, metadata } = req.body;

    const updated = await prisma.asset.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(categoryId && { categoryId }),
        ...(brand !== undefined && { brand }),
        ...(model !== undefined && { model }),
        ...(serialNumber !== undefined && { serialNumber }),
        ...(acquisitionDate !== undefined && { acquisitionDate: acquisitionDate ? new Date(acquisitionDate) : null }),
        ...(acquisitionValue !== undefined && { acquisitionValue }),
        ...(currentValue !== undefined && { currentValue }),
        ...(depreciationRate !== undefined && { depreciationRate }),
        ...(warrantyExpiry !== undefined && { warrantyExpiry: warrantyExpiry ? new Date(warrantyExpiry) : null }),
        ...(tags && { tags }),
        ...(metadata && { metadata }),
      },
      include: { category: true, location: true },
    });

    await createAuditLog(
      { action: AuditAction.ASSET_UPDATED, entityType: 'Asset', entityId: updated.id, details: req.body },
      req as AuthRequest
    );

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao atualizar ativo' });
  }
});

// POST /api/assets/:id/move
router.post('/:id/move', async (req: AuthRequest, res: Response) => {
  try {
    const { toLocationId, reason } = req.body;
    if (!toLocationId) {
      return res.status(400).json({ error: 'Localização de destino é obrigatória' });
    }

    const asset = await prisma.asset.findUnique({ where: { id: req.params.id } });
    if (!asset) {
      return res.status(404).json({ error: 'Ativo não encontrado' });
    }

    const [movement, updatedAsset] = await prisma.$transaction([
      prisma.assetMovement.create({
        data: {
          assetId: asset.id,
          fromLocationId: asset.locationId,
          toLocationId,
          reason,
          movedById: req.user!.id,
        },
      }),
      prisma.asset.update({
        where: { id: asset.id },
        data: { locationId: toLocationId },
        include: { location: true },
      }),
    ]);

    await createAuditLog(
      { action: AuditAction.ASSET_MOVED, entityType: 'Asset', entityId: asset.id, details: { from: asset.locationId, to: toLocationId, reason } },
      req as AuthRequest
    );

    return res.json({ asset: updatedAsset, movement });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao mover ativo' });
  }
});

// POST /api/assets/:id/assign
router.post('/:id/assign', async (req: AuthRequest, res: Response) => {
  try {
    const { responsibleId } = req.body;

    const asset = await prisma.asset.findUnique({ where: { id: req.params.id } });
    if (!asset) {
      return res.status(404).json({ error: 'Ativo não encontrado' });
    }

    const updated = await prisma.asset.update({
      where: { id: asset.id },
      data: {
        responsibleId: responsibleId || null,
        status: responsibleId ? 'IN_USE' : 'AVAILABLE',
      },
      include: {
        responsible: { select: { id: true, name: true, email: true } },
      },
    });

    const action = responsibleId ? AuditAction.ASSET_ASSIGNED : AuditAction.ASSET_UNASSIGNED;
    await createAuditLog(
      { action, entityType: 'Asset', entityId: asset.id, details: { responsibleId } },
      req as AuthRequest
    );

    if (responsibleId) {
      await createNotification({
        userId: responsibleId,
        title: 'Ativo atribuído a você',
        message: `O ativo "${asset.name}" (${asset.code}) foi atribuído a você.`,
        type: 'asset_assigned',
      });
    }

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao atribuir responsável' });
  }
});

// POST /api/assets/:id/decommission
router.post('/:id/decommission', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { reason } = req.body;

    const asset = await prisma.asset.findUnique({ where: { id: req.params.id } });
    if (!asset) {
      return res.status(404).json({ error: 'Ativo não encontrado' });
    }

    const updated = await prisma.asset.update({
      where: { id: asset.id },
      data: {
        status: 'DECOMMISSIONED',
        responsibleId: null,
      },
    });

    await createAuditLog(
      { action: AuditAction.ASSET_DECOMMISSIONED, entityType: 'Asset', entityId: asset.id, details: { reason } },
      req as AuthRequest
    );

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao desativar ativo' });
  }
});

// ==================== MAINTENANCE ====================

// GET /api/assets/maintenance/upcoming
router.get('/maintenance/upcoming', async (req: AuthRequest, res: Response) => {
  try {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const maintenances = await prisma.assetMaintenance.findMany({
      where: {
        scheduledDate: { lte: thirtyDaysFromNow },
        status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
      },
      include: {
        asset: { include: { category: true, location: true } },
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: { scheduledDate: 'asc' },
      take: 20,
    });

    return res.json(maintenances);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao listar manutenções' });
  }
});

// GET /api/assets/maintenance/overdue
router.get('/maintenance/overdue', async (req: AuthRequest, res: Response) => {
  try {
    const maintenances = await prisma.assetMaintenance.findMany({
      where: {
        scheduledDate: { lt: new Date() },
        status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
      },
      include: {
        asset: { include: { category: true, location: true } },
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: { scheduledDate: 'asc' },
    });

    return res.json(maintenances);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao listar manutenções atrasadas' });
  }
});

// POST /api/assets/:id/maintenance
router.post('/:id/maintenance', async (req: AuthRequest, res: Response) => {
  try {
    const { type, description, scheduledDate, priority, vendor, cost, notes } = req.body;

    if (!type || !description || !scheduledDate) {
      return res.status(400).json({ error: 'Tipo, descrição e data agendada são obrigatórios' });
    }

    const asset = await prisma.asset.findUnique({ where: { id: req.params.id } });
    if (!asset) {
      return res.status(404).json({ error: 'Ativo não encontrado' });
    }

    const maintenance = await prisma.assetMaintenance.create({
      data: {
        assetId: asset.id,
        type,
        description,
        scheduledDate: new Date(scheduledDate),
        priority: priority || 'NORMAL',
        vendor,
        cost,
        notes,
        createdById: req.user!.id,
      },
      include: { asset: true },
    });

    if (type === 'CORRECTIVE') {
      await prisma.asset.update({
        where: { id: asset.id },
        data: { status: 'MAINTENANCE' },
      });
    }

    await createAuditLog(
      { action: AuditAction.MAINTENANCE_CREATED, entityType: 'AssetMaintenance', entityId: maintenance.id, details: { assetId: asset.id, type } },
      req as AuthRequest
    );

    return res.status(201).json(maintenance);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao criar manutenção' });
  }
});

// POST /api/assets/:id/maintenance/:maintenanceId/complete
router.post('/:id/maintenance/:maintenanceId/complete', async (req: AuthRequest, res: Response) => {
  try {
    const { notes, cost } = req.body;

    const maintenance = await prisma.assetMaintenance.findFirst({
      where: { id: req.params.maintenanceId, assetId: req.params.id },
    });

    if (!maintenance) {
      return res.status(404).json({ error: 'Manutenção não encontrada' });
    }

    const updated = await prisma.assetMaintenance.update({
      where: { id: maintenance.id },
      data: {
        status: 'COMPLETED',
        endDate: new Date(),
        completedById: req.user!.id,
        ...(notes && { notes }),
        ...(cost !== undefined && { cost }),
      },
    });

    // Restore asset status
    const asset = await prisma.asset.findUnique({ where: { id: req.params.id } });
    if (asset && asset.status === 'MAINTENANCE') {
      await prisma.asset.update({
        where: { id: asset.id },
        data: { status: asset.responsibleId ? 'IN_USE' : 'AVAILABLE' },
      });
    }

    await createAuditLog(
      { action: AuditAction.MAINTENANCE_COMPLETED, entityType: 'AssetMaintenance', entityId: maintenance.id },
      req as AuthRequest
    );

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao completar manutenção' });
  }
});

// ==================== INVENTORY ====================

// GET /api/assets/inventory
router.get('/inventory/sessions', async (req: AuthRequest, res: Response) => {
  try {
    const sessions = await prisma.inventorySession.findMany({
      include: {
        location: true,
        category: true,
        startedBy: { select: { id: true, name: true } },
        completedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json(sessions);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao listar inventários' });
  }
});

// POST /api/assets/inventory
router.post('/inventory', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, locationId, categoryId } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Nome é obrigatório' });
    }

    const code = generateCode('INV');

    const assetWhere: any = { status: { not: 'DECOMMISSIONED' } };
    if (locationId) assetWhere.locationId = locationId;
    if (categoryId) assetWhere.categoryId = categoryId;

    const assets = await prisma.asset.findMany({ where: assetWhere, select: { id: true } });

    const session = await prisma.inventorySession.create({
      data: {
        code,
        name,
        description,
        locationId,
        categoryId,
        totalAssets: assets.length,
        items: {
          create: assets.map((a) => ({ assetId: a.id })),
        },
      },
      include: { items: true },
    });

    await createAuditLog(
      { action: AuditAction.INVENTORY_CREATED, entityType: 'InventorySession', entityId: session.id, details: { totalAssets: assets.length } },
      req as AuthRequest
    );

    return res.status(201).json(session);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao criar inventário' });
  }
});

// GET /api/assets/inventory/:sessionId
router.get('/inventory/:sessionId', async (req: AuthRequest, res: Response) => {
  try {
    const session = await prisma.inventorySession.findUnique({
      where: { id: req.params.sessionId },
      include: {
        location: true,
        category: true,
        startedBy: { select: { id: true, name: true } },
        completedBy: { select: { id: true, name: true } },
        items: {
          include: {
            asset: { include: { category: true, location: true } },
            checkedBy: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!session) {
      return res.status(404).json({ error: 'Inventário não encontrado' });
    }

    return res.json(session);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao buscar inventário' });
  }
});

// POST /api/assets/inventory/:sessionId/start
router.post('/inventory/:sessionId/start', async (req: AuthRequest, res: Response) => {
  try {
    const session = await prisma.inventorySession.findUnique({ where: { id: req.params.sessionId } });
    if (!session) {
      return res.status(404).json({ error: 'Inventário não encontrado' });
    }

    if (session.status !== 'DRAFT') {
      return res.status(400).json({ error: 'Inventário já foi iniciado' });
    }

    const updated = await prisma.inventorySession.update({
      where: { id: session.id },
      data: {
        status: 'IN_PROGRESS',
        startedById: req.user!.id,
        startedAt: new Date(),
      },
    });

    await createAuditLog(
      { action: AuditAction.INVENTORY_STARTED, entityType: 'InventorySession', entityId: session.id },
      req as AuthRequest
    );

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao iniciar inventário' });
  }
});

// POST /api/assets/inventory/:sessionId/items/:itemId/check
router.post('/inventory/:sessionId/items/:itemId/check', async (req: AuthRequest, res: Response) => {
  try {
    const { status, notes } = req.body;

    if (!['FOUND', 'NOT_FOUND', 'DISCREPANCY'].includes(status)) {
      return res.status(400).json({ error: 'Status inválido' });
    }

    const item = await prisma.inventoryItem.findFirst({
      where: { id: req.params.itemId, sessionId: req.params.sessionId },
    });

    if (!item) {
      return res.status(404).json({ error: 'Item não encontrado' });
    }

    const updated = await prisma.inventoryItem.update({
      where: { id: item.id },
      data: {
        status,
        notes,
        checkedById: req.user!.id,
        checkedAt: new Date(),
      },
    });

    // Update session counters
    const counts = await prisma.inventoryItem.groupBy({
      by: ['status'],
      where: { sessionId: req.params.sessionId },
      _count: true,
    });

    const foundCount = counts.find((c) => c.status === 'FOUND')?._count || 0;
    const missingCount = counts.find((c) => c.status === 'NOT_FOUND')?._count || 0;

    await prisma.inventorySession.update({
      where: { id: req.params.sessionId },
      data: { foundCount, missingCount },
    });

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao verificar item' });
  }
});

// POST /api/assets/inventory/:sessionId/complete
router.post('/inventory/:sessionId/complete', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const session = await prisma.inventorySession.findUnique({
      where: { id: req.params.sessionId },
      include: { items: true },
    });

    if (!session) {
      return res.status(404).json({ error: 'Inventário não encontrado' });
    }

    if (session.status !== 'IN_PROGRESS') {
      return res.status(400).json({ error: 'Inventário não está em andamento' });
    }

    const pendingItems = session.items.filter((i) => i.status === 'PENDING');
    if (pendingItems.length > 0) {
      return res.status(400).json({ error: `Ainda existem ${pendingItems.length} itens pendentes` });
    }

    const updated = await prisma.inventorySession.update({
      where: { id: session.id },
      data: {
        status: 'COMPLETED',
        completedById: req.user!.id,
        completedAt: new Date(),
      },
    });

    await createAuditLog(
      { action: AuditAction.INVENTORY_COMPLETED, entityType: 'InventorySession', entityId: session.id },
      req as AuthRequest
    );

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao completar inventário' });
  }
});

// ==================== CATEGORIES & LOCATIONS ====================

// GET /api/assets/config/categories
router.get('/config/categories', async (req: AuthRequest, res: Response) => {
  try {
    const categories = await prisma.assetCategory.findMany({
      include: { _count: { select: { assets: true } } },
      orderBy: { name: 'asc' },
    });
    return res.json(categories);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao listar categorias' });
  }
});

// POST /api/assets/config/categories
router.post('/config/categories', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, icon, color } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Nome é obrigatório' });
    }

    const category = await prisma.assetCategory.create({
      data: { name, description, icon, color },
    });

    await createAuditLog(
      { action: AuditAction.CATEGORY_CREATED, entityType: 'AssetCategory', entityId: category.id, details: { name } },
      req as AuthRequest
    );

    return res.status(201).json(category);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Categoria já existe' });
    }
    return res.status(500).json({ error: 'Erro ao criar categoria' });
  }
});

// PATCH /api/assets/config/categories/:id
router.patch('/config/categories/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, icon, color } = req.body;
    const category = await prisma.assetCategory.update({
      where: { id: req.params.id },
      data: { ...(name && { name }), ...(description !== undefined && { description }), ...(icon !== undefined && { icon }), ...(color !== undefined && { color }) },
    });

    await createAuditLog(
      { action: AuditAction.CATEGORY_UPDATED, entityType: 'AssetCategory', entityId: category.id, details: req.body },
      req as AuthRequest
    );

    return res.json(category);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao atualizar categoria' });
  }
});

// DELETE /api/assets/config/categories/:id
router.delete('/config/categories/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const count = await prisma.asset.count({ where: { categoryId: req.params.id } });
    if (count > 0) {
      return res.status(400).json({ error: `Categoria possui ${count} ativos vinculados` });
    }

    await prisma.assetCategory.delete({ where: { id: req.params.id } });

    await createAuditLog(
      { action: AuditAction.CATEGORY_DELETED, entityType: 'AssetCategory', entityId: req.params.id },
      req as AuthRequest
    );

    return res.json({ message: 'Categoria removida' });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao remover categoria' });
  }
});

// GET /api/assets/config/locations
router.get('/config/locations', async (req: AuthRequest, res: Response) => {
  try {
    const locations = await prisma.assetLocation.findMany({
      include: {
        parent: true,
        children: true,
        _count: { select: { assets: true } },
      },
      orderBy: { name: 'asc' },
    });
    return res.json(locations);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao listar localizações' });
  }
});

// POST /api/assets/config/locations
router.post('/config/locations', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, address, parentId } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Nome é obrigatório' });
    }

    const location = await prisma.assetLocation.create({
      data: { name, description, address, parentId },
    });

    await createAuditLog(
      { action: AuditAction.LOCATION_CREATED, entityType: 'AssetLocation', entityId: location.id, details: { name } },
      req as AuthRequest
    );

    return res.status(201).json(location);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Localização já existe' });
    }
    return res.status(500).json({ error: 'Erro ao criar localização' });
  }
});

// PATCH /api/assets/config/locations/:id
router.patch('/config/locations/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, address, parentId } = req.body;
    const location = await prisma.assetLocation.update({
      where: { id: req.params.id },
      data: { ...(name && { name }), ...(description !== undefined && { description }), ...(address !== undefined && { address }), ...(parentId !== undefined && { parentId }) },
    });

    await createAuditLog(
      { action: AuditAction.LOCATION_UPDATED, entityType: 'AssetLocation', entityId: location.id, details: req.body },
      req as AuthRequest
    );

    return res.json(location);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao atualizar localização' });
  }
});

// DELETE /api/assets/config/locations/:id
router.delete('/config/locations/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const [assetCount, childCount] = await Promise.all([
      prisma.asset.count({ where: { locationId: req.params.id } }),
      prisma.assetLocation.count({ where: { parentId: req.params.id } }),
    ]);

    if (assetCount > 0) {
      return res.status(400).json({ error: `Localização possui ${assetCount} ativos vinculados` });
    }
    if (childCount > 0) {
      return res.status(400).json({ error: `Localização possui ${childCount} sub-localizações` });
    }

    await prisma.assetLocation.delete({ where: { id: req.params.id } });

    await createAuditLog(
      { action: AuditAction.LOCATION_DELETED, entityType: 'AssetLocation', entityId: req.params.id },
      req as AuthRequest
    );

    return res.json({ message: 'Localização removida' });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao remover localização' });
  }
});

export default router;
