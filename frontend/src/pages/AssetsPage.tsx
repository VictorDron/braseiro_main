import { useState } from 'react';
import { useAssets, useAssetStats, useCategories, useLocations, useCreateAsset, useMoveAsset, useAssignAsset, useDecommissionAsset, useCreateCategory, useDeleteCategory, useCreateLocation, useDeleteLocation, useUpcomingMaintenance, useOverdueMaintenance, useCreateMaintenance, useCompleteMaintenance, useInventorySessions, useCreateInventory, useStartInventory, useCompleteInventory } from '../hooks/useAssets';
import { useUsersList } from '../hooks/useUsers';
import { useAuthStore } from '../stores/authStore';
import { Asset } from '../types';
import StatusBadge from '../components/ui/StatusBadge';
import Modal from '../components/ui/Modal';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import Pagination from '../components/ui/Pagination';
import { Package, Plus, Search, MapPin, MoveRight, UserCheck, XCircle, Wrench, ClipboardList, Settings, Filter } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

type Tab = 'dashboard' | 'assets' | 'maintenance' | 'inventory' | 'config';

export default function AssetsPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';
  const [activeTab, setActiveTab] = useState<Tab>('assets');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [showCreateCategoryModal, setShowCreateCategoryModal] = useState(false);
  const [showCreateLocationModal, setShowCreateLocationModal] = useState(false);
  const [showCreateInventoryModal, setShowCreateInventoryModal] = useState(false);

  // Data
  const { data: assetsData, isLoading } = useAssets({ page, search: search || undefined, status: statusFilter || undefined, categoryId: categoryFilter || undefined });
  const { data: stats } = useAssetStats();
  const { data: categories } = useCategories();
  const { data: locations } = useLocations();
  const { data: users } = useUsersList();
  const { data: upcomingMaintenance } = useUpcomingMaintenance();
  const { data: overdueMaintenance } = useOverdueMaintenance();
  const { data: inventorySessions } = useInventorySessions();

  // Mutations
  const createAsset = useCreateAsset();
  const moveAsset = useMoveAsset();
  const assignAsset = useAssignAsset();
  const decommissionAsset = useDecommissionAsset();
  const createCategory = useCreateCategory();
  const deleteCategory = useDeleteCategory();
  const createLocation = useCreateLocation();
  const deleteLocation = useDeleteLocation();
  const createMaintenance = useCreateMaintenance();
  const completeMaintenance = useCompleteMaintenance();
  const createInventory = useCreateInventory();
  const startInventory = useStartInventory();
  const completeInventory = useCompleteInventory();

  // Form states
  const [formData, setFormData] = useState<any>({});

  const tabs = [
    { id: 'dashboard' as Tab, label: 'Resumo', icon: Package },
    { id: 'assets' as Tab, label: 'Ativos', icon: Package },
    { id: 'maintenance' as Tab, label: 'Manutenção', icon: Wrench },
    { id: 'inventory' as Tab, label: 'Inventário', icon: ClipboardList },
    ...(isAdmin ? [{ id: 'config' as Tab, label: 'Configurações', icon: Settings }] : []),
  ];

  const handleCreateAsset = (e: React.FormEvent) => {
    e.preventDefault();
    createAsset.mutate(formData, {
      onSuccess: () => { setShowCreateModal(false); setFormData({}); },
    });
  };

  const handleMoveAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset) return;
    moveAsset.mutate({ id: selectedAsset.id, toLocationId: formData.toLocationId, reason: formData.reason }, {
      onSuccess: () => { setShowMoveModal(false); setFormData({}); setSelectedAsset(null); },
    });
  };

  const handleAssignAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset) return;
    assignAsset.mutate({ id: selectedAsset.id, responsibleId: formData.responsibleId || null }, {
      onSuccess: () => { setShowAssignModal(false); setFormData({}); setSelectedAsset(null); },
    });
  };

  const handleCreateMaintenance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset) return;
    createMaintenance.mutate({ assetId: selectedAsset.id, ...formData }, {
      onSuccess: () => { setShowMaintenanceModal(false); setFormData({}); setSelectedAsset(null); },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-dark-800">Gestão de Patrimônio</h1>
        {isAdmin && activeTab === 'assets' && (
          <button onClick={() => { setFormData({}); setShowCreateModal(true); }} className="btn-primary flex items-center gap-2">
            <Plus size={18} /> Novo Ativo
          </button>
        )}
        {isAdmin && activeTab === 'inventory' && (
          <button onClick={() => { setFormData({}); setShowCreateInventoryModal(true); }} className="btn-primary flex items-center gap-2">
            <Plus size={18} /> Novo Inventário
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-dark-100 p-1 rounded-lg w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === tab.id ? 'bg-white text-dark-800 shadow-sm' : 'text-dark-500 hover:text-dark-800'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: 'Total', value: stats?.total || 0, color: 'text-dark-800' },
            { label: 'Disponíveis', value: stats?.available || 0, color: 'text-green-600' },
            { label: 'Em Uso', value: stats?.inUse || 0, color: 'text-blue-600' },
            { label: 'Manutenção', value: stats?.maintenance || 0, color: 'text-yellow-600' },
            { label: 'Desativados', value: stats?.decommissioned || 0, color: 'text-dark-400' },
          ].map((stat, i) => (
            <motion.div key={stat.label} className="card p-5" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <p className="text-sm text-dark-400">{stat.label}</p>
              <p className={`text-3xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Assets Tab */}
      {activeTab === 'assets' && (
        <div className="card">
          {/* Filters */}
          <div className="p-4 border-b border-dark-200 flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-300" />
              <input
                type="text"
                placeholder="Buscar ativos..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="input-field pl-9 py-2 text-sm"
              />
            </div>
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="input-field py-2 text-sm w-40">
              <option value="">Todos Status</option>
              <option value="AVAILABLE">Disponível</option>
              <option value="IN_USE">Em Uso</option>
              <option value="MAINTENANCE">Manutenção</option>
              <option value="DECOMMISSIONED">Desativado</option>
            </select>
            <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }} className="input-field py-2 text-sm w-48">
              <option value="">Todas Categorias</option>
              {categories?.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Table */}
          {isLoading ? (
            <LoadingSpinner className="h-48" />
          ) : !assetsData?.data.length ? (
            <EmptyState icon={<Package size={24} />} title="Nenhum ativo encontrado" description="Crie seu primeiro ativo para começar" action={isAdmin ? <button onClick={() => setShowCreateModal(true)} className="btn-primary text-sm">Criar Ativo</button> : undefined} />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-dark-200 bg-dark-50">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-dark-400 uppercase">Código</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-dark-400 uppercase">Nome</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-dark-400 uppercase">Categoria</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-dark-400 uppercase">Localização</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-dark-400 uppercase">Status</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-dark-400 uppercase">Responsável</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-dark-400 uppercase">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-100">
                    {assetsData.data.map((asset) => (
                      <tr key={asset.id} className="hover:bg-dark-50 transition-colors">
                        <td className="px-4 py-3 text-sm font-mono text-primary-600">{asset.code}</td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-dark-800">{asset.name}</p>
                          {asset.brand && <p className="text-xs text-dark-400">{asset.brand} {asset.model}</p>}
                        </td>
                        <td className="px-4 py-3 text-sm text-dark-500">
                          {asset.category?.icon} {asset.category?.name}
                        </td>
                        <td className="px-4 py-3 text-sm text-dark-500">
                          <span className="flex items-center gap-1"><MapPin size={12} /> {asset.location?.name}</span>
                        </td>
                        <td className="px-4 py-3"><StatusBadge status={asset.status} /></td>
                        <td className="px-4 py-3 text-sm text-dark-500">{asset.responsible?.name || '-'}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button onClick={() => { setSelectedAsset(asset); setFormData({}); setShowMoveModal(true); }} className="p-1.5 rounded hover:bg-dark-100 text-dark-400" title="Mover">
                              <MoveRight size={14} />
                            </button>
                            <button onClick={() => { setSelectedAsset(asset); setFormData({ responsibleId: asset.responsibleId }); setShowAssignModal(true); }} className="p-1.5 rounded hover:bg-dark-100 text-dark-400" title="Atribuir">
                              <UserCheck size={14} />
                            </button>
                            <button onClick={() => { setSelectedAsset(asset); setFormData({}); setShowMaintenanceModal(true); }} className="p-1.5 rounded hover:bg-dark-100 text-dark-400" title="Manutenção">
                              <Wrench size={14} />
                            </button>
                            {isAdmin && asset.status !== 'DECOMMISSIONED' && (
                              <button onClick={() => { if (confirm('Deseja desativar este ativo?')) decommissionAsset.mutate({ id: asset.id }); }} className="p-1.5 rounded hover:bg-red-50 text-dark-400 hover:text-red-600" title="Desativar">
                                <XCircle size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination page={page} totalPages={assetsData.pagination.totalPages} onPageChange={setPage} />
            </>
          )}
        </div>
      )}

      {/* Maintenance Tab */}
      {activeTab === 'maintenance' && (
        <div className="space-y-6">
          {(overdueMaintenance?.length || 0) > 0 && (
            <div className="card">
              <div className="px-6 py-4 border-b border-dark-200 bg-red-50">
                <h3 className="font-semibold text-red-800">Manutenções Atrasadas ({overdueMaintenance?.length})</h3>
              </div>
              <div className="divide-y divide-dark-100">
                {overdueMaintenance?.map((m) => (
                  <div key={m.id} className="px-6 py-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{m.asset?.name} - {m.description}</p>
                      <p className="text-xs text-dark-400">Agendado: {format(new Date(m.scheduledDate), 'dd/MM/yyyy')} | Tipo: {m.type}</p>
                    </div>
                    <button onClick={() => completeMaintenance.mutate({ assetId: m.assetId, maintenanceId: m.id })} className="btn-primary text-xs py-1.5">
                      Concluir
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="card">
            <div className="px-6 py-4 border-b border-dark-200">
              <h3 className="font-semibold">Próximas Manutenções ({upcomingMaintenance?.length || 0})</h3>
            </div>
            <div className="divide-y divide-dark-100">
              {!upcomingMaintenance?.length ? (
                <div className="px-6 py-8 text-center text-dark-400 text-sm">Nenhuma manutenção agendada</div>
              ) : (
                upcomingMaintenance.map((m) => (
                  <div key={m.id} className="px-6 py-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{m.asset?.name} - {m.description}</p>
                      <p className="text-xs text-dark-400">Agendado: {format(new Date(m.scheduledDate), 'dd/MM/yyyy')} | <StatusBadge status={m.status} /></p>
                    </div>
                    {m.status !== 'COMPLETED' && (
                      <button onClick={() => completeMaintenance.mutate({ assetId: m.assetId, maintenanceId: m.id })} className="btn-secondary text-xs py-1.5">
                        Concluir
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Inventory Tab */}
      {activeTab === 'inventory' && (
        <div className="card">
          <div className="px-6 py-4 border-b border-dark-200">
            <h3 className="font-semibold">Sessões de Inventário</h3>
          </div>
          <div className="divide-y divide-dark-100">
            {!inventorySessions?.length ? (
              <EmptyState icon={<ClipboardList size={24} />} title="Nenhum inventário" description="Crie uma sessão de inventário para verificar seus ativos" />
            ) : (
              inventorySessions.map((session) => (
                <div key={session.id} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{session.name} <span className="text-dark-300 font-mono text-xs">({session.code})</span></p>
                    <p className="text-xs text-dark-400">
                      Total: {session.totalAssets} | Encontrados: {session.foundCount} | Faltando: {session.missingCount}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={session.status} />
                    {session.status === 'DRAFT' && isAdmin && (
                      <button onClick={() => startInventory.mutate(session.id)} className="btn-primary text-xs py-1.5">Iniciar</button>
                    )}
                    {session.status === 'IN_PROGRESS' && isAdmin && (
                      <button onClick={() => completeInventory.mutate(session.id)} className="btn-secondary text-xs py-1.5">Concluir</button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Config Tab */}
      {activeTab === 'config' && isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Categories */}
          <div className="card">
            <div className="px-6 py-4 border-b border-dark-200 flex justify-between items-center">
              <h3 className="font-semibold">Categorias</h3>
              <button onClick={() => { setFormData({}); setShowCreateCategoryModal(true); }} className="btn-primary text-xs py-1.5 flex items-center gap-1"><Plus size={14} /> Nova</button>
            </div>
            <div className="divide-y divide-dark-100">
              {categories?.map((cat) => (
                <div key={cat.id} className="px-6 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>{cat.icon}</span>
                    <span className="text-sm font-medium">{cat.name}</span>
                    <span className="text-xs text-dark-300">({cat._count?.assets || 0})</span>
                  </div>
                  {(cat._count?.assets || 0) === 0 && (
                    <button onClick={() => deleteCategory.mutate(cat.id)} className="text-xs text-red-500 hover:text-red-700">Remover</button>
                  )}
                </div>
              ))}
            </div>
          </div>
          {/* Locations */}
          <div className="card">
            <div className="px-6 py-4 border-b border-dark-200 flex justify-between items-center">
              <h3 className="font-semibold">Localizações</h3>
              <button onClick={() => { setFormData({}); setShowCreateLocationModal(true); }} className="btn-primary text-xs py-1.5 flex items-center gap-1"><Plus size={14} /> Nova</button>
            </div>
            <div className="divide-y divide-dark-100">
              {locations?.map((loc) => (
                <div key={loc.id} className="px-6 py-3 flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium">{loc.name}</span>
                    {loc.description && <span className="text-xs text-dark-300 ml-2">{loc.description}</span>}
                    <span className="text-xs text-dark-300 ml-2">({loc._count?.assets || 0})</span>
                  </div>
                  {(loc._count?.assets || 0) === 0 && (!loc.children || loc.children.length === 0) && (
                    <button onClick={() => deleteLocation.mutate(loc.id)} className="text-xs text-red-500 hover:text-red-700">Remover</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Create Asset Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Novo Ativo" size="lg">
        <form onSubmit={handleCreateAsset} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1">Nome *</label>
              <input type="text" required className="input-field" value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1">Categoria *</label>
              <select required className="input-field" value={formData.categoryId || ''} onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}>
                <option value="">Selecione...</option>
                {categories?.map((cat) => (<option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1">Localização *</label>
              <select required className="input-field" value={formData.locationId || ''} onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}>
                <option value="">Selecione...</option>
                {locations?.map((loc) => (<option key={loc.id} value={loc.id}>{loc.name}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1">Marca</label>
              <input type="text" className="input-field" value={formData.brand || ''} onChange={(e) => setFormData({ ...formData, brand: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1">Modelo</label>
              <input type="text" className="input-field" value={formData.model || ''} onChange={(e) => setFormData({ ...formData, model: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1">Número de Série</label>
              <input type="text" className="input-field" value={formData.serialNumber || ''} onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1">Data de Aquisição</label>
              <input type="date" className="input-field" value={formData.acquisitionDate || ''} onChange={(e) => setFormData({ ...formData, acquisitionDate: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1">Valor de Aquisição (R$)</label>
              <input type="number" step="0.01" className="input-field" value={formData.acquisitionValue || ''} onChange={(e) => setFormData({ ...formData, acquisitionValue: parseFloat(e.target.value) || undefined })} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-700 mb-1">Descrição</label>
            <textarea className="input-field" rows={3} value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={createAsset.isPending} className="btn-primary">{createAsset.isPending ? 'Criando...' : 'Criar Ativo'}</button>
          </div>
        </form>
      </Modal>

      {/* Move Asset Modal */}
      <Modal isOpen={showMoveModal} onClose={() => setShowMoveModal(false)} title={`Mover: ${selectedAsset?.name || ''}`}>
        <form onSubmit={handleMoveAsset} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-700 mb-1">Local Atual</label>
            <input type="text" disabled className="input-field bg-dark-50" value={selectedAsset?.location?.name || ''} />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-700 mb-1">Novo Local *</label>
            <select required className="input-field" value={formData.toLocationId || ''} onChange={(e) => setFormData({ ...formData, toLocationId: e.target.value })}>
              <option value="">Selecione...</option>
              {locations?.filter((l) => l.id !== selectedAsset?.locationId).map((loc) => (<option key={loc.id} value={loc.id}>{loc.name}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-700 mb-1">Motivo</label>
            <input type="text" className="input-field" value={formData.reason || ''} onChange={(e) => setFormData({ ...formData, reason: e.target.value })} />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={() => setShowMoveModal(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={moveAsset.isPending} className="btn-primary">{moveAsset.isPending ? 'Movendo...' : 'Mover'}</button>
          </div>
        </form>
      </Modal>

      {/* Assign Modal */}
      <Modal isOpen={showAssignModal} onClose={() => setShowAssignModal(false)} title={`Atribuir: ${selectedAsset?.name || ''}`}>
        <form onSubmit={handleAssignAsset} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-700 mb-1">Responsável</label>
            <select className="input-field" value={formData.responsibleId || ''} onChange={(e) => setFormData({ ...formData, responsibleId: e.target.value })}>
              <option value="">Sem responsável</option>
              {users?.map((u) => (<option key={u.id} value={u.id}>{u.name} ({u.email})</option>))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={() => setShowAssignModal(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={assignAsset.isPending} className="btn-primary">Salvar</button>
          </div>
        </form>
      </Modal>

      {/* Maintenance Modal */}
      <Modal isOpen={showMaintenanceModal} onClose={() => setShowMaintenanceModal(false)} title={`Manutenção: ${selectedAsset?.name || ''}`}>
        <form onSubmit={handleCreateMaintenance} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1">Tipo *</label>
              <select required className="input-field" value={formData.type || ''} onChange={(e) => setFormData({ ...formData, type: e.target.value })}>
                <option value="">Selecione...</option>
                <option value="PREVENTIVE">Preventiva</option>
                <option value="CORRECTIVE">Corretiva</option>
                <option value="INSPECTION">Inspeção</option>
                <option value="CALIBRATION">Calibração</option>
                <option value="CLEANING">Limpeza</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1">Data Agendada *</label>
              <input type="date" required className="input-field" value={formData.scheduledDate || ''} onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-700 mb-1">Descrição *</label>
            <textarea required className="input-field" rows={3} value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1">Fornecedor/Prestador</label>
              <input type="text" className="input-field" value={formData.vendor || ''} onChange={(e) => setFormData({ ...formData, vendor: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1">Custo Estimado (R$)</label>
              <input type="number" step="0.01" className="input-field" value={formData.cost || ''} onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || undefined })} />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={() => setShowMaintenanceModal(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={createMaintenance.isPending} className="btn-primary">Agendar</button>
          </div>
        </form>
      </Modal>

      {/* Create Category Modal */}
      <Modal isOpen={showCreateCategoryModal} onClose={() => setShowCreateCategoryModal(false)} title="Nova Categoria">
        <form onSubmit={(e) => { e.preventDefault(); createCategory.mutate(formData, { onSuccess: () => { setShowCreateCategoryModal(false); setFormData({}); } }); }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-700 mb-1">Nome *</label>
            <input type="text" required className="input-field" value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-700 mb-1">Descrição</label>
            <input type="text" className="input-field" value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1">Ícone (emoji)</label>
              <input type="text" className="input-field" value={formData.icon || ''} onChange={(e) => setFormData({ ...formData, icon: e.target.value })} placeholder="Ex: 💻" />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1">Cor</label>
              <input type="color" className="input-field h-10" value={formData.color || '#3B82F6'} onChange={(e) => setFormData({ ...formData, color: e.target.value })} />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={() => setShowCreateCategoryModal(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={createCategory.isPending} className="btn-primary">Criar</button>
          </div>
        </form>
      </Modal>

      {/* Create Location Modal */}
      <Modal isOpen={showCreateLocationModal} onClose={() => setShowCreateLocationModal(false)} title="Nova Localização">
        <form onSubmit={(e) => { e.preventDefault(); createLocation.mutate(formData, { onSuccess: () => { setShowCreateLocationModal(false); setFormData({}); } }); }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-700 mb-1">Nome *</label>
            <input type="text" required className="input-field" value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-700 mb-1">Descrição</label>
            <input type="text" className="input-field" value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-700 mb-1">Localização Pai</label>
            <select className="input-field" value={formData.parentId || ''} onChange={(e) => setFormData({ ...formData, parentId: e.target.value || undefined })}>
              <option value="">Nenhuma (nível raiz)</option>
              {locations?.map((loc) => (<option key={loc.id} value={loc.id}>{loc.name}</option>))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={() => setShowCreateLocationModal(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={createLocation.isPending} className="btn-primary">Criar</button>
          </div>
        </form>
      </Modal>

      {/* Create Inventory Modal */}
      <Modal isOpen={showCreateInventoryModal} onClose={() => setShowCreateInventoryModal(false)} title="Novo Inventário">
        <form onSubmit={(e) => { e.preventDefault(); createInventory.mutate(formData, { onSuccess: () => { setShowCreateInventoryModal(false); setFormData({}); } }); }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-700 mb-1">Nome *</label>
            <input type="text" required className="input-field" value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-700 mb-1">Descrição</label>
            <textarea className="input-field" rows={2} value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1">Filtrar por Local</label>
              <select className="input-field" value={formData.locationId || ''} onChange={(e) => setFormData({ ...formData, locationId: e.target.value || undefined })}>
                <option value="">Todos</option>
                {locations?.map((loc) => (<option key={loc.id} value={loc.id}>{loc.name}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1">Filtrar por Categoria</label>
              <select className="input-field" value={formData.categoryId || ''} onChange={(e) => setFormData({ ...formData, categoryId: e.target.value || undefined })}>
                <option value="">Todas</option>
                {categories?.map((cat) => (<option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={() => setShowCreateInventoryModal(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={createInventory.isPending} className="btn-primary">Criar Inventário</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
