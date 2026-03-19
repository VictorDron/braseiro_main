import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { PurchaseRequest, Supplier, PaginatedResponse } from '../types';
import toast from 'react-hot-toast';

// Purchases
export function usePurchases(params?: { page?: number; search?: string; status?: string; department?: string; createdByMe?: boolean }) {
  return useQuery({
    queryKey: ['purchases', params],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<PurchaseRequest>>('/purchases', { params });
      return data;
    },
  });
}

export function usePurchase(id: string) {
  return useQuery({
    queryKey: ['purchase', id],
    queryFn: async () => {
      const { data } = await api.get<PurchaseRequest>(`/purchases/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function usePurchaseStats() {
  return useQuery({
    queryKey: ['purchase-stats'],
    queryFn: async () => {
      const { data } = await api.get('/purchases/stats/overview');
      return data;
    },
  });
}

export function useCreatePurchase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (purchaseData: any) => {
      const { data } = await api.post<PurchaseRequest>('/purchases', purchaseData);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purchases'] });
      toast.success('Requisição criada');
    },
    onError: (error: any) => toast.error(error.response?.data?.error || 'Erro ao criar requisição'),
  });
}

export function useUpdatePurchase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; [key: string]: any }) => {
      const { data: result } = await api.patch(`/purchases/${id}`, data);
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purchases'] });
      toast.success('Requisição atualizada');
    },
    onError: (error: any) => toast.error(error.response?.data?.error || 'Erro ao atualizar requisição'),
  });
}

export function useSubmitPurchase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/purchases/${id}/submit`);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purchases'] });
      qc.invalidateQueries({ queryKey: ['purchase-stats'] });
      toast.success('Requisição submetida para aprovação');
    },
    onError: (error: any) => toast.error(error.response?.data?.error || 'Erro ao submeter requisição'),
  });
}

export function useApprovePurchase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, approved, comments }: { id: string; approved: boolean; comments?: string }) => {
      const { data } = await api.post(`/purchases/${id}/approve`, { approved, comments });
      return data;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['purchases'] });
      qc.invalidateQueries({ queryKey: ['purchase-stats'] });
      toast.success(variables.approved ? 'Requisição aprovada' : 'Requisição rejeitada');
    },
    onError: (error: any) => toast.error(error.response?.data?.error || 'Erro ao processar aprovação'),
  });
}

export function useExecutePurchase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; [key: string]: any }) => {
      const { data: result } = await api.post(`/purchases/${id}/execute`, data);
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purchases'] });
      qc.invalidateQueries({ queryKey: ['purchase-stats'] });
      qc.invalidateQueries({ queryKey: ['assets'] });
      qc.invalidateQueries({ queryKey: ['asset-stats'] });
      toast.success('Compra executada com sucesso');
    },
    onError: (error: any) => toast.error(error.response?.data?.error || 'Erro ao executar compra'),
  });
}

export function useCancelPurchase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      const { data } = await api.post(`/purchases/${id}/cancel`, { reason });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purchases'] });
      qc.invalidateQueries({ queryKey: ['purchase-stats'] });
      toast.success('Requisição cancelada');
    },
    onError: (error: any) => toast.error(error.response?.data?.error || 'Erro ao cancelar requisição'),
  });
}

// Suppliers
export function useSuppliers(params?: { page?: number; search?: string; isActive?: boolean }) {
  return useQuery({
    queryKey: ['suppliers', params],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Supplier>>('/suppliers', { params });
      return data;
    },
  });
}

export function useSupplier(id: string) {
  return useQuery({
    queryKey: ['supplier', id],
    queryFn: async () => {
      const { data } = await api.get<Supplier>(`/suppliers/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (supplierData: any) => {
      const { data } = await api.post<Supplier>('/suppliers', supplierData);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success('Fornecedor criado');
    },
    onError: (error: any) => toast.error(error.response?.data?.error || 'Erro ao criar fornecedor'),
  });
}

export function useUpdateSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; [key: string]: any }) => {
      const { data: result } = await api.patch(`/suppliers/${id}`, data);
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success('Fornecedor atualizado');
    },
    onError: (error: any) => toast.error(error.response?.data?.error || 'Erro ao atualizar fornecedor'),
  });
}

export function useArchiveSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/suppliers/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success('Fornecedor arquivado');
    },
    onError: (error: any) => toast.error(error.response?.data?.error || 'Erro ao arquivar fornecedor'),
  });
}
