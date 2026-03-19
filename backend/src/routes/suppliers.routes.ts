import { Router, Response } from 'express';
import prisma from '../config/database';
import { authenticate, requireAdmin } from '../middlewares/auth';
import { createAuditLog } from '../services/audit.service';
import { AuthRequest, AuditAction } from '../types';
import { getPaginationParams } from '../utils/helpers';

const router = Router();
router.use(authenticate);

// GET /api/suppliers
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query as any);
    const { search, isActive } = req.query;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
        { document: { contains: search as string, mode: 'insensitive' } },
      ];
    }
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const [suppliers, total] = await Promise.all([
      prisma.supplier.findMany({
        where,
        include: { _count: { select: { purchaseOrders: true } } },
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      }),
      prisma.supplier.count({ where }),
    ]);

    return res.json({
      data: suppliers,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao listar fornecedores' });
  }
});

// GET /api/suppliers/:id
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const supplier = await prisma.supplier.findUnique({
      where: { id: req.params.id },
      include: {
        purchaseOrders: {
          include: {
            purchaseRequest: { select: { title: true, code: true } },
          },
          orderBy: { executedAt: 'desc' },
          take: 10,
        },
        _count: { select: { purchaseOrders: true } },
      },
    });

    if (!supplier) {
      return res.status(404).json({ error: 'Fornecedor não encontrado' });
    }

    return res.json(supplier);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao buscar fornecedor' });
  }
});

// POST /api/suppliers
router.post('/', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, phone, document, address, notes } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Nome é obrigatório' });
    }

    const supplier = await prisma.supplier.create({
      data: { name, email, phone, document, address, notes },
    });

    await createAuditLog(
      { action: AuditAction.SUPPLIER_CREATED, entityType: 'Supplier', entityId: supplier.id, details: { name } },
      req as AuthRequest
    );

    return res.status(201).json(supplier);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao criar fornecedor' });
  }
});

// PATCH /api/suppliers/:id
router.patch('/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, phone, document, address, notes, isActive } = req.body;

    const supplier = await prisma.supplier.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(document !== undefined && { document }),
        ...(address !== undefined && { address }),
        ...(notes !== undefined && { notes }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    await createAuditLog(
      { action: AuditAction.SUPPLIER_UPDATED, entityType: 'Supplier', entityId: supplier.id, details: req.body },
      req as AuthRequest
    );

    return res.json(supplier);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao atualizar fornecedor' });
  }
});

// DELETE /api/suppliers/:id - soft delete (archive)
router.delete('/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const supplier = await prisma.supplier.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });

    await createAuditLog(
      { action: AuditAction.SUPPLIER_ARCHIVED, entityType: 'Supplier', entityId: supplier.id },
      req as AuthRequest
    );

    return res.json({ message: 'Fornecedor arquivado' });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao arquivar fornecedor' });
  }
});

export default router;
