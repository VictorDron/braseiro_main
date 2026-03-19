import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { User, PaginatedResponse } from '../types';
import toast from 'react-hot-toast';

export function useUsers(params?: { page?: number; search?: string; role?: string; status?: string }) {
  return useQuery({
    queryKey: ['users', params],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<User>>('/users', { params });
      return data;
    },
  });
}

export function useUsersList() {
  return useQuery({
    queryKey: ['users-list'],
    queryFn: async () => {
      const { data } = await api.get<{ id: string; name: string; email: string; department?: string }[]>('/users/list/all');
      return data;
    },
  });
}

export function useCreateUser() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (userData: { email: string; password: string; name: string; role?: string; phone?: string; department?: string }) => {
      const { data } = await api.post<User>('/users', userData);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      toast.success('Usuário criado com sucesso');
    },
    onError: (error: any) => toast.error(error.response?.data?.error || 'Erro ao criar usuário'),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name?: string; role?: string; status?: string; phone?: string; department?: string }) => {
      const { data: result } = await api.patch<User>(`/users/${id}`, data);
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      toast.success('Usuário atualizado');
    },
    onError: (error: any) => toast.error(error.response?.data?.error || 'Erro ao atualizar usuário'),
  });
}
