import { useMutation, useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { AuthResponse, LoginCredentials, User } from '../types';
import toast from 'react-hot-toast';

export function useLogin() {
  const { login } = useAuthStore();

  return useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const { data } = await api.post<AuthResponse>('/auth/login', credentials);
      return data;
    },
    onSuccess: (data) => {
      login(data.user, data.token);
      toast.success(`Bem-vindo, ${data.user.name}!`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erro ao fazer login');
    },
  });
}

export function useMe() {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const { data } = await api.get<User>('/auth/me');
      return data;
    },
    enabled: isAuthenticated,
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const { data: result } = await api.put('/auth/password', data);
      return result;
    },
    onSuccess: () => toast.success('Senha alterada com sucesso'),
    onError: (error: any) => toast.error(error.response?.data?.error || 'Erro ao alterar senha'),
  });
}

export function useUpdateProfile() {
  const { updateUser } = useAuthStore();

  return useMutation({
    mutationFn: async (data: { name?: string; phone?: string; department?: string }) => {
      const { data: result } = await api.put<User>('/auth/profile', data);
      return result;
    },
    onSuccess: (data) => {
      updateUser(data);
      toast.success('Perfil atualizado');
    },
    onError: (error: any) => toast.error(error.response?.data?.error || 'Erro ao atualizar perfil'),
  });
}
