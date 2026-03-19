import prisma from '../config/database';
import { sendEmail } from '../config/email';

interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  type: string;
  metadata?: Record<string, any>;
  sendEmailNotification?: boolean;
}

export async function createNotification(params: CreateNotificationParams): Promise<void> {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId: params.userId,
        title: params.title,
        message: params.message,
        type: params.type,
        metadata: params.metadata || {},
      },
    });

    if (params.sendEmailNotification) {
      const user = await prisma.user.findUnique({
        where: { id: params.userId },
        select: { email: true, name: true },
      });

      if (user) {
        await sendEmail(
          user.email,
          params.title,
          `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1a1a1a;">Braseiro - Notificação</h2>
            <p>Olá, <strong>${user.name}</strong>!</p>
            <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <h3 style="margin: 0 0 8px 0;">${params.title}</h3>
              <p style="margin: 0; color: #666;">${params.message}</p>
            </div>
            <p style="color: #999; font-size: 12px;">Braseiro - Sistema de Gestão de Patrimônio</p>
          </div>
          `
        );
      }
    }
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
}

export async function getNotifications(userId: string, page: number = 1, limit: number = 20) {
  const skip = (page - 1) * limit;
  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.notification.count({ where: { userId } }),
  ]);

  const unreadCount = await prisma.notification.count({
    where: { userId, read: false },
  });

  return { notifications, total, unreadCount };
}

export async function markAsRead(notificationId: string, userId: string) {
  return prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { read: true },
  });
}

export async function markAllAsRead(userId: string) {
  return prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });
}
