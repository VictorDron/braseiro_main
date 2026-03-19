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

// GET /api/purchases - List purchase requests
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query as any);
    const { search, status, department, createdByMe } = req.query;

    const where: any = {};
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { code: { contains: search as string, mode: 'insensitive' } },
      ];
    }
    if (status) where.status = status;
    if (department) where.department = department;
    if (createdByMe === 'true') where.createdById = req.user!.id;

    const [purchases, total] = await Promise.all([
      prisma.purchaseRequest.findMany({
        where,
        include: {
          createdBy: { select: { id: true, name: true, email: true } },
          items: true,
          _count: { select: { approvalActions: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.purchaseRequest.count({ where }),
    ]);

    return res.json({
      data: purchases,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao listar requisições' });
  }
});

// GET /api/purchases/stats/overview
router.get('/stats/overview', async (req: AuthRequest, res: Response) => {
  try {
    const [pending, approved, total] = await Promise.all([
      prisma.purchaseRequest.count({ where: { status: 'PENDING_APPROVAL' } }),
      prisma.purchaseRequest.count({ where: { status: 'APPROVED' } }),
      prisma.purchaseRequest.count(),
    ]);

    const purchased = await prisma.purchaseRequest.findMany({
      where: { status: 'PURCHASED' },
      select: { totalAmount: true },
    });

    const totalSpent = purchased.reduce((sum, p) => sum + Number(p.totalAmount), 0);

    return res.json({ pending, approved, total, totalSpent });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao carregar estatísticas' });
  }
});

// GET /api/purchases/:id
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const purchase = await prisma.purchaseRequest.findUnique({
      where: { id: req.params.id },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        items: true,
        approvalActions: {
          include: { user: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' },
        },
        purchaseOrder: {
          include: {
            supplier: true,
            executedBy: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!purchase) {
      return res.status(404).json({ error: 'Requisição não encontrada' });
    }

    return res.json(purchase);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao buscar requisição' });
  }
});

// POST /api/purchases
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { title, department, priority, justification, items, notes } = req.body;

    if (!title || !justification || !items?.length) {
      return res.status(400).json({ error: 'Título, justificativa e itens são obrigatórios' });
    }

    const code = generateCode('REQ');

    const totalAmount = items.reduce((sum: number, item: any) => {
      return sum + (item.quantity * item.estimatedUnitPrice);
    }, 0);

    const purchase = await prisma.purchaseRequest.create({
      data: {
        code,
        title,
        department,
        priority: priority || 'NORMAL',
        justification,
        totalAmount,
        notes,
        createdById: req.user!.id,
        items: {
          create: items.map((item: any) => ({
            description: item.description,
            quantity: item.quantity,
            unit: item.unit || 'UN',
            estimatedUnitPrice: item.estimatedUnitPrice,
            totalPrice: item.quantity * item.estimatedUnitPrice,
            notes: item.notes,
          })),
        },
      },
      include: { items: true, createdBy: { select: { id: true, name: true } } },
    });

    await createAuditLog(
      { action: AuditAction.PURCHASE_CREATED, entityType: 'PurchaseRequest', entityId: purchase.id, details: { code, title, totalAmount } },
      req as AuthRequest
    );

    return res.status(201).json(purchase);
  } catch (error) {
    console.error('Create purchase error:', error);
    return res.status(500).json({ error: 'Erro ao criar requisição' });
  }
});

// PATCH /api/purchases/:id
router.patch('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const purchase = await prisma.purchaseRequest.findUnique({ where: { id: req.params.id } });
    if (!purchase) {
      return res.status(404).json({ error: 'Requisição não encontrada' });
    }

    if (purchase.status !== 'DRAFT') {
      return res.status(400).json({ error: 'Apenas requisições em rascunho podem ser editadas' });
    }

    if (purchase.createdById !== req.user!.id && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Sem permissão para editar esta requisição' });
    }

    const { title, department, priority, justification, items, notes } = req.body;

    let totalAmount = purchase.totalAmount;

    if (items) {
      await prisma.purchaseItem.deleteMany({ where: { purchaseRequestId: purchase.id } });
      totalAmount = items.reduce((sum: number, item: any) => sum + (item.quantity * item.estimatedUnitPrice), 0);

      await prisma.purchaseItem.createMany({
        data: items.map((item: any) => ({
          purchaseRequestId: purchase.id,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit || 'UN',
          estimatedUnitPrice: item.estimatedUnitPrice,
          totalPrice: item.quantity * item.estimatedUnitPrice,
          notes: item.notes,
        })),
      });
    }

    const updated = await prisma.purchaseRequest.update({
      where: { id: purchase.id },
      data: {
        ...(title && { title }),
        ...(department !== undefined && { department }),
        ...(priority && { priority }),
        ...(justification && { justification }),
        ...(notes !== undefined && { notes }),
        totalAmount,
      },
      include: { items: true },
    });

    await createAuditLog(
      { action: AuditAction.PURCHASE_UPDATED, entityType: 'PurchaseRequest', entityId: purchase.id },
      req as AuthRequest
    );

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao atualizar requisição' });
  }
});

// POST /api/purchases/:id/submit
router.post('/:id/submit', async (req: AuthRequest, res: Response) => {
  try {
    const purchase = await prisma.purchaseRequest.findUnique({ where: { id: req.params.id } });
    if (!purchase) {
      return res.status(404).json({ error: 'Requisição não encontrada' });
    }

    if (purchase.status !== 'DRAFT') {
      return res.status(400).json({ error: 'Apenas requisições em rascunho podem ser submetidas' });
    }

    if (purchase.createdById !== req.user!.id) {
      return res.status(403).json({ error: 'Apenas o criador pode submeter a requisição' });
    }

    const updated = await prisma.purchaseRequest.update({
      where: { id: purchase.id },
      data: {
        status: 'PENDING_APPROVAL',
        submittedAt: new Date(),
      },
    });

    await prisma.approvalAction.create({
      data: {
        purchaseRequestId: purchase.id,
        userId: req.user!.id,
        action: 'SUBMITTED',
        previousStatus: 'DRAFT',
        newStatus: 'PENDING_APPROVAL',
      },
    });

    await createAuditLog(
      { action: AuditAction.PURCHASE_SUBMITTED, entityType: 'PurchaseRequest', entityId: purchase.id },
      req as AuthRequest
    );

    // Notify admins
    const admins = await prisma.user.findMany({ where: { role: 'ADMIN', status: 'ACTIVE' } });
    for (const admin of admins) {
      await createNotification({
        userId: admin.id,
        title: 'Nova requisição de compra',
        message: `${req.user!.name} submeteu a requisição "${purchase.title}" (${purchase.code}) para aprovação.`,
        type: 'purchase_pending',
        sendEmailNotification: true,
      });
    }

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao submeter requisição' });
  }
});

// POST /api/purchases/:id/approve
router.post('/:id/approve', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { approved, comments } = req.body;
    if (approved === undefined) {
      return res.status(400).json({ error: 'Campo "approved" é obrigatório' });
    }

    const purchase = await prisma.purchaseRequest.findUnique({ where: { id: req.params.id } });
    if (!purchase) {
      return res.status(404).json({ error: 'Requisição não encontrada' });
    }

    if (purchase.status !== 'PENDING_APPROVAL') {
      return res.status(400).json({ error: 'Requisição não está pendente de aprovação' });
    }

    const newStatus = approved ? 'APPROVED' : 'REJECTED';

    const updated = await prisma.purchaseRequest.update({
      where: { id: purchase.id },
      data: {
        status: newStatus,
        ...(approved ? { approvedAt: new Date() } : { rejectedAt: new Date() }),
      },
    });

    await prisma.approvalAction.create({
      data: {
        purchaseRequestId: purchase.id,
        userId: req.user!.id,
        action: approved ? 'APPROVED' : 'REJECTED',
        comments,
        previousStatus: 'PENDING_APPROVAL',
        newStatus,
      },
    });

    const auditAction = approved ? AuditAction.PURCHASE_APPROVED : AuditAction.PURCHASE_REJECTED;
    await createAuditLog(
      { action: auditAction, entityType: 'PurchaseRequest', entityId: purchase.id, details: { approved, comments } },
      req as AuthRequest
    );

    await createNotification({
      userId: purchase.createdById,
      title: approved ? 'Requisição aprovada!' : 'Requisição rejeitada',
      message: `Sua requisição "${purchase.title}" (${purchase.code}) foi ${approved ? 'aprovada' : 'rejeitada'} por ${req.user!.name}.${comments ? ` Comentário: ${comments}` : ''}`,
      type: 'purchase_status',
      sendEmailNotification: true,
    });

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao processar aprovação' });
  }
});

// POST /api/purchases/:id/execute
router.post('/:id/execute', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { supplierId, invoiceNumber, totalAmount, items, notes, autoCreateAssets, assetCategoryId, assetLocationId } = req.body;

    const purchase = await prisma.purchaseRequest.findUnique({
      where: { id: req.params.id },
      include: { items: true },
    });

    if (!purchase) {
      return res.status(404).json({ error: 'Requisição não encontrada' });
    }

    if (purchase.status !== 'APPROVED') {
      return res.status(400).json({ error: 'Apenas requisições aprovadas podem ser executadas' });
    }

    // Create purchase order
    const order = await prisma.purchaseOrder.create({
      data: {
        purchaseRequestId: purchase.id,
        supplierId,
        invoiceNumber,
        totalAmount: totalAmount || purchase.totalAmount,
        autoCreateAssets: autoCreateAssets || false,
        executedById: req.user!.id,
        notes,
      },
    });

    // Auto-create assets if requested
    if (autoCreateAssets && items) {
      for (const item of items) {
        if (item.createAsset) {
          for (let i = 0; i < (item.quantity || 1); i++) {
            const code = generateCode('AST');
            let qrCodeUrl: string | undefined;
            try {
              const qrBuffer = await QRCode.toBuffer(code, { type: 'png', width: 300 });
              qrCodeUrl = await uploadFile(qrBuffer, `${code}.png`, 'image/png', 'qrcodes');
            } catch {}

            await prisma.asset.create({
              data: {
                code,
                name: item.description,
                categoryId: assetCategoryId || item.categoryId,
                locationId: assetLocationId || item.locationId,
                acquisitionDate: new Date(),
                acquisitionValue: item.actualUnitPrice || item.estimatedUnitPrice,
                qrCodeUrl,
                createdById: req.user!.id,
                purchaseOrderId: order.id,
              },
            });
          }
        }
      }
    }

    // Update purchase status
    await prisma.purchaseRequest.update({
      where: { id: purchase.id },
      data: {
        status: 'PURCHASED',
        purchasedAt: new Date(),
      },
    });

    await prisma.approvalAction.create({
      data: {
        purchaseRequestId: purchase.id,
        userId: req.user!.id,
        action: 'EXECUTED',
        previousStatus: 'APPROVED',
        newStatus: 'PURCHASED',
        comments: notes,
      },
    });

    await createAuditLog(
      { action: AuditAction.PURCHASE_EXECUTED, entityType: 'PurchaseRequest', entityId: purchase.id, details: { orderId: order.id, supplierId, totalAmount } },
      req as AuthRequest
    );

    await createNotification({
      userId: purchase.createdById,
      title: 'Compra executada!',
      message: `A requisição "${purchase.title}" (${purchase.code}) foi executada por ${req.user!.name}.`,
      type: 'purchase_executed',
      sendEmailNotification: true,
    });

    return res.json(order);
  } catch (error) {
    console.error('Execute purchase error:', error);
    return res.status(500).json({ error: 'Erro ao executar compra' });
  }
});

// POST /api/purchases/:id/cancel
router.post('/:id/cancel', async (req: AuthRequest, res: Response) => {
  try {
    const { reason } = req.body;

    const purchase = await prisma.purchaseRequest.findUnique({ where: { id: req.params.id } });
    if (!purchase) {
      return res.status(404).json({ error: 'Requisição não encontrada' });
    }

    if (!['DRAFT', 'PENDING_APPROVAL'].includes(purchase.status)) {
      return res.status(400).json({ error: 'Requisição não pode ser cancelada neste status' });
    }

    if (purchase.createdById !== req.user!.id && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Sem permissão para cancelar esta requisição' });
    }

    const updated = await prisma.purchaseRequest.update({
      where: { id: purchase.id },
      data: { status: 'CANCELLED' },
    });

    await prisma.approvalAction.create({
      data: {
        purchaseRequestId: purchase.id,
        userId: req.user!.id,
        action: 'CANCELLED',
        comments: reason,
        previousStatus: purchase.status,
        newStatus: 'CANCELLED',
      },
    });

    await createAuditLog(
      { action: AuditAction.PURCHASE_CANCELLED, entityType: 'PurchaseRequest', entityId: purchase.id, details: { reason } },
      req as AuthRequest
    );

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao cancelar requisição' });
  }
});

export default router;
