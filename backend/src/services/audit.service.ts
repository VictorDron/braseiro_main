import prisma from '../config/database';
import { AuthRequest, AuditAction } from '../types';

interface AuditLogData {
  action: AuditAction | string;
  entityType: string;
  entityId?: string;
  details?: Record<string, any>;
}

export async function createAuditLog(data: AuditLogData, req: AuthRequest): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        userEmail: req.user!.email,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        details: data.details || {},
        ipAddress: (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
      },
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
}
