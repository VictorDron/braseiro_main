import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { Asset, AssetCategory, AssetLocation, AssetMaintenance, InventorySession, PaginatedResponse } from '../types';
import toast from 'react-hot-toast';

// Assets
export function useAssets(params?: { page?: number; search?: string; status?: string; categoryId?: string; locationId?: string }) {
  return useQuery({
    queryKey: ['assets', params],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Asset>>('/assets', { params });
      return data;
    },
  });
}

export function useAsset(id: string) {
  return useQuery({
    queryKey: ['asset', id],
    queryFn: async () => {
      const { data } = await api.get<Asset>(`/assets/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useAssetStats() {
  return useQuery({
    queryKey: ['asset-stats'],
    queryFn: async () => {
      const { data } = await api.get('/assets/stats/overview');
      return data;
    },
  });
}

export function useCreateAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (assetData: any) => {
      const { data } = await api.post<Asset>('/assets', assetData);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assets'] });
      qc.invalidateQueries({ queryKey: ['asset-stats'] });
      toast.success('Ativo criado com sucesso');
    },
    onError: (error: any) => toast.error(error.response?.data?.error || 'Erro ao criar ativo'),
  });
}

export function useUpdateAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; [key: string]: any }) => {
      const { data: result } = await api.patch<Asset>(`/assets/${id}`, data);
      return result;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['assets'] });
      qc.invalidateQueries({ queryKey: ['asset', data.id] });
      toast.success('Ativo atualizado');
    },
    onError: (error: any) => toast.error(error.response?.data?.error || 'Erro ao atualizar ativo'),
  });
}

export function useMoveAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, toLocationId, reason }: { id: string; toLocationId: string; reason?: string }) => {
      const { data } = await api.post(`/assets/${id}/move`, { toLocationId, reason });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assets'] });
      qc.invalidateQueries({ queryKey: ['asset-stats'] });
      toast.success('Ativo movido com sucesso');
    },
    onError: (error: any) => toast.error(error.response?.data?.error || 'Erro ao mover ativo'),
  });
}

export function useAssignAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, responsibleId }: { id: string; responsibleId: string | null }) => {
      const { data } = await api.post(`/assets/${id}/assign`, { responsibleId });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assets'] });
      qc.invalidateQueries({ queryKey: ['asset-stats'] });
      toast.success('Responsável atualizado');
    },
    onError: (error: any) => toast.error(error.response?.data?.error || 'Erro ao atribuir responsável'),
  });
}

export function useDecommissionAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      const { data } = await api.post(`/assets/${id}/decommission`, { reason });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assets'] });
      qc.invalidateQueries({ queryKey: ['asset-stats'] });
      toast.success('Ativo desativado');
    },
    onError: (error: any) => toast.error(error.response?.data?.error || 'Erro ao desativar ativo'),
  });
}

// Categories
export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await api.get<AssetCategory[]>('/assets/config/categories');
      return data;
    },
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (catData: { name: string; description?: string; icon?: string; color?: string }) => {
      const { data } = await api.post('/assets/config/categories', catData);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Categoria criada');
    },
    onError: (error: any) => toast.error(error.response?.data?.error || 'Erro ao criar categoria'),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/assets/config/categories/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Categoria removida');
    },
    onError: (error: any) => toast.error(error.response?.data?.error || 'Erro ao remover categoria'),
  });
}

// Locations
export function useLocations() {
  return useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const { data } = await api.get<AssetLocation[]>('/assets/config/locations');
      return data;
    },
  });
}

export function useCreateLocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (locData: { name: string; description?: string; address?: string; parentId?: string }) => {
      const { data } = await api.post('/assets/config/locations', locData);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['locations'] });
      toast.success('Localização criada');
    },
    onError: (error: any) => toast.error(error.response?.data?.error || 'Erro ao criar localização'),
  });
}

export function useDeleteLocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/assets/config/locations/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['locations'] });
      toast.success('Localização removida');
    },
    onError: (error: any) => toast.error(error.response?.data?.error || 'Erro ao remover localização'),
  });
}

// Maintenance
export function useUpcomingMaintenance() {
  return useQuery({
    queryKey: ['maintenance-upcoming'],
    queryFn: async () => {
      const { data } = await api.get<AssetMaintenance[]>('/assets/maintenance/upcoming');
      return data;
    },
  });
}

export function useOverdueMaintenance() {
  return useQuery({
    queryKey: ['maintenance-overdue'],
    queryFn: async () => {
      const { data } = await api.get<AssetMaintenance[]>('/assets/maintenance/overdue');
      return data;
    },
  });
}

export function useCreateMaintenance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ assetId, ...data }: { assetId: string; type: string; description: string; scheduledDate: string; priority?: string; vendor?: string; cost?: number }) => {
      const { data: result } = await api.post(`/assets/${assetId}/maintenance`, data);
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['maintenance-upcoming'] });
      qc.invalidateQueries({ queryKey: ['assets'] });
      toast.success('Manutenção agendada');
    },
    onError: (error: any) => toast.error(error.response?.data?.error || 'Erro ao agendar manutenção'),
  });
}

export function useCompleteMaintenance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ assetId, maintenanceId, ...data }: { assetId: string; maintenanceId: string; notes?: string; cost?: number }) => {
      const { data: result } = await api.post(`/assets/${assetId}/maintenance/${maintenanceId}/complete`, data);
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['maintenance-upcoming'] });
      qc.invalidateQueries({ queryKey: ['maintenance-overdue'] });
      qc.invalidateQueries({ queryKey: ['assets'] });
      toast.success('Manutenção concluída');
    },
    onError: (error: any) => toast.error(error.response?.data?.error || 'Erro ao concluir manutenção'),
  });
}

// Inventory
export function useInventorySessions() {
  return useQuery({
    queryKey: ['inventory-sessions'],
    queryFn: async () => {
      const { data } = await api.get<InventorySession[]>('/assets/inventory/sessions');
      return data;
    },
  });
}

export function useInventorySession(id: string) {
  return useQuery({
    queryKey: ['inventory-session', id],
    queryFn: async () => {
      const { data } = await api.get<InventorySession>(`/assets/inventory/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateInventory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; description?: string; locationId?: string; categoryId?: string }) => {
      const { data: result } = await api.post('/assets/inventory', data);
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory-sessions'] });
      toast.success('Inventário criado');
    },
    onError: (error: any) => toast.error(error.response?.data?.error || 'Erro ao criar inventário'),
  });
}

export function useStartInventory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (sessionId: string) => {
      const { data } = await api.post(`/assets/inventory/${sessionId}/start`);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory-sessions'] });
      toast.success('Inventário iniciado');
    },
    onError: (error: any) => toast.error(error.response?.data?.error || 'Erro ao iniciar inventário'),
  });
}

export function useCheckInventoryItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ sessionId, itemId, status, notes }: { sessionId: string; itemId: string; status: string; notes?: string }) => {
      const { data } = await api.post(`/assets/inventory/${sessionId}/items/${itemId}/check`, { status, notes });
      return data;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['inventory-session', variables.sessionId] });
    },
    onError: (error: any) => toast.error(error.response?.data?.error || 'Erro ao verificar item'),
  });
}

export function useCompleteInventory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (sessionId: string) => {
      const { data } = await api.post(`/assets/inventory/${sessionId}/complete`);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory-sessions'] });
      toast.success('Inventário concluído');
    },
    onError: (error: any) => toast.error(error.response?.data?.error || 'Erro ao concluir inventário'),
  });
}
