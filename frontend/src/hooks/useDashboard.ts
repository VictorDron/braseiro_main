import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const { data } = await api.get('/dashboard');
      return data;
    },
    refetchInterval: 30000,
  });
}
