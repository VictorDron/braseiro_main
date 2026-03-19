import { useState } from 'react';
import { useUsers, useCreateUser, useUpdateUser } from '../hooks/useUsers';
import { User } from '../types';
import StatusBadge from '../components/ui/StatusBadge';
import Modal from '../components/ui/Modal';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import Pagination from '../components/ui/Pagination';
import { Users as UsersIcon, Plus, Search, Edit2, Shield, ShieldOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<any>({});

  const { data: usersData, isLoading } = useUsers({ page, search: search || undefined });
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    createUser.mutate(formData, {
      onSuccess: () => { setShowCreateModal(false); setFormData({}); },
    });
  };

  const handleUpdateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    updateUser.mutate({ id: selectedUser.id, ...formData }, {
      onSuccess: () => { setShowEditModal(false); setFormData({}); setSelectedUser(null); },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-display text-2xl font-semibold text-dark-800">Gestão de Usuários</h1>
        <button onClick={() => { setFormData({}); setShowCreateModal(true); }} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Novo Usuário
        </button>
      </div>

      <div className="card">
        {/* Search */}
        <div className="p-4 border-b border-dark-200">
          <div className="relative max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-300" />
            <input
              type="text"
              placeholder="Buscar por nome ou email..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="input-field pl-9 py-2 text-sm"
            />
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <LoadingSpinner className="h-48" />
        ) : !usersData?.data.length ? (
          <EmptyState icon={<UsersIcon size={24} />} title="Nenhum usuário" description="Crie o primeiro usuário do sistema" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dark-200 bg-dark-50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-dark-400 uppercase">Usuário</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-dark-400 uppercase">Email</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-dark-400 uppercase">Departamento</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-dark-400 uppercase">Perfil</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-dark-400 uppercase">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-dark-400 uppercase">Criado em</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-dark-400 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-100">
                  {usersData.data.map((u) => (
                    <motion.tr
                      key={u.id}
                      className="hover:bg-dark-50 transition-colors"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-medium text-dark-800">{u.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-dark-500">{u.email}</td>
                      <td className="px-4 py-3 text-sm text-dark-500">{u.department || '-'}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={u.role} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={u.status} />
                      </td>
                      <td className="px-4 py-3 text-sm text-dark-400">
                        {format(new Date(u.createdAt), 'dd/MM/yyyy')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setFormData({ name: u.name, role: u.role, status: u.status, phone: u.phone || '', department: u.department || '' });
                              setShowEditModal(true);
                            }}
                            className="p-1.5 rounded hover:bg-dark-100 text-dark-400"
                            title="Editar"
                          >
                            <Edit2 size={14} />
                          </button>
                          {u.status === 'ACTIVE' ? (
                            <button
                              onClick={() => updateUser.mutate({ id: u.id, status: 'INACTIVE' })}
                              className="p-1.5 rounded hover:bg-red-50 text-dark-400 hover:text-red-600"
                              title="Desativar"
                            >
                              <ShieldOff size={14} />
                            </button>
                          ) : (
                            <button
                              onClick={() => updateUser.mutate({ id: u.id, status: 'ACTIVE' })}
                              className="p-1.5 rounded hover:bg-green-50 text-dark-400 hover:text-green-600"
                              title="Ativar"
                            >
                              <Shield size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={usersData.pagination.totalPages} onPageChange={setPage} />
          </>
        )}
      </div>

      {/* Create User Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Novo Usuário">
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-700 mb-1">Nome *</label>
            <input type="text" required className="input-field" value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-700 mb-1">Email *</label>
            <input type="email" required className="input-field" value={formData.email || ''} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-700 mb-1">Senha *</label>
            <input type="password" required minLength={6} className="input-field" value={formData.password || ''} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1">Perfil</label>
              <select className="input-field" value={formData.role || 'USER'} onChange={(e) => setFormData({ ...formData, role: e.target.value })}>
                <option value="USER">Usuário</option>
                <option value="ADMIN">Administrador</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1">Departamento</label>
              <input type="text" className="input-field" value={formData.department || ''} onChange={(e) => setFormData({ ...formData, department: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-700 mb-1">Telefone</label>
            <input type="text" className="input-field" value={formData.phone || ''} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={createUser.isPending} className="btn-primary">{createUser.isPending ? 'Criando...' : 'Criar Usuário'}</button>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title={`Editar: ${selectedUser?.name || ''}`}>
        <form onSubmit={handleUpdateUser} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-700 mb-1">Nome</label>
            <input type="text" className="input-field" value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1">Perfil</label>
              <select className="input-field" value={formData.role || ''} onChange={(e) => setFormData({ ...formData, role: e.target.value })}>
                <option value="USER">Usuário</option>
                <option value="ADMIN">Administrador</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1">Status</label>
              <select className="input-field" value={formData.status || ''} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                <option value="ACTIVE">Ativo</option>
                <option value="INACTIVE">Inativo</option>
                <option value="SUSPENDED">Suspenso</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-700 mb-1">Departamento</label>
            <input type="text" className="input-field" value={formData.department || ''} onChange={(e) => setFormData({ ...formData, department: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-700 mb-1">Telefone</label>
            <input type="text" className="input-field" value={formData.phone || ''} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={() => setShowEditModal(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={updateUser.isPending} className="btn-primary">Salvar</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
