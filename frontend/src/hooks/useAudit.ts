import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { AuditLog, PaginatedResponse } from '../types';

export function useAuditLogs(params?: { page?: number; search?: string; action?: string; entityType?: string; userId?: string; startDate?: string; endDate?: string }) {
  return useQuery({
    queryKey: ['audit-logs', params],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<AuditLog>>('/audit', { params });
      return data;
    },
  });
}

export function useAuditStats() {
  return useQuery({
    queryKey: ['audit-stats'],
    queryFn: async () => {
      const { data } = await api.get('/audit/stats');
      return data;
    },
  });
}
