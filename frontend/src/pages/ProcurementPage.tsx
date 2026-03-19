import { useState } from 'react';
import { usePurchases, usePurchaseStats, useCreatePurchase, useSubmitPurchase, useApprovePurchase, useExecutePurchase, useCancelPurchase, useSuppliers, useCreateSupplier, useArchiveSupplier } from '../hooks/usePurchases';
import { useAuthStore } from '../stores/authStore';
import { PurchaseRequest } from '../types';
import StatusBadge from '../components/ui/StatusBadge';
import Modal from '../components/ui/Modal';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import Pagination from '../components/ui/Pagination';
import { ShoppingCart, Plus, Search, Send, CheckCircle, XCircle, Play, Truck, DollarSign, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

type Tab = 'dashboard' | 'requests' | 'suppliers';

export default function ProcurementPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';
  const [activeTab, setActiveTab] = useState<Tab>('requests');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedPurchase, setSelectedPurchase] = useState<PurchaseRequest | null>(null);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showExecuteModal, setShowExecuteModal] = useState(false);
  const [showCreateSupplierModal, setShowCreateSupplierModal] = useState(false);
  const [supplierPage, setSupplierPage] = useState(1);

  // Data
  const { data: purchasesData, isLoading } = usePurchases({ page, search: search || undefined, status: statusFilter || undefined });
  const { data: stats } = usePurchaseStats();
  const { data: suppliersData } = useSuppliers({ page: supplierPage });

  // Mutations
  const createPurchase = useCreatePurchase();
  const submitPurchase = useSubmitPurchase();
  const approvePurchase = useApprovePurchase();
  const executePurchase = useExecutePurchase();
  const cancelPurchase = useCancelPurchase();
  const createSupplier = useCreateSupplier();
  const archiveSupplier = useArchiveSupplier();

  // Form
  const [formData, setFormData] = useState<any>({});
  const [items, setItems] = useState<any[]>([{ description: '', quantity: 1, unit: 'UN', estimatedUnitPrice: 0 }]);

  const addItem = () => setItems([...items, { description: '', quantity: 1, unit: 'UN', estimatedUnitPrice: 0 }]);
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: string, value: any) => {
    const updated = [...items];
    updated[i] = { ...updated[i], [field]: value };
    setItems(updated);
  };

  const handleCreatePurchase = (e: React.FormEvent) => {
    e.preventDefault();
    createPurchase.mutate({ ...formData, items }, {
      onSuccess: () => { setShowCreateModal(false); setFormData({}); setItems([{ description: '', quantity: 1, unit: 'UN', estimatedUnitPrice: 0 }]); },
    });
  };

  const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.estimatedUnitPrice), 0);

  const tabs = [
    { id: 'dashboard' as Tab, label: 'Resumo', icon: ShoppingCart },
    { id: 'requests' as Tab, label: 'Requisições', icon: ShoppingCart },
    { id: 'suppliers' as Tab, label: 'Fornecedores', icon: Truck },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-display text-2xl font-semibold text-dark-800">Gestão de Compras</h1>
        {activeTab === 'requests' && (
          <button onClick={() => { setFormData({}); setItems([{ description: '', quantity: 1, unit: 'UN', estimatedUnitPrice: 0 }]); setShowCreateModal(true); }} className="btn-primary flex items-center gap-2">
            <Plus size={18} /> Nova Requisição
          </button>
        )}
        {activeTab === 'suppliers' && isAdmin && (
          <button onClick={() => { setFormData({}); setShowCreateSupplierModal(true); }} className="btn-primary flex items-center gap-2">
            <Plus size={18} /> Novo Fornecedor
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-dark-100 p-1 rounded-lg w-fit overflow-x-auto flex-nowrap">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-white text-dark-800 shadow-sm' : 'text-dark-500 hover:text-dark-800'}`}>
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Pendentes', value: stats?.pending || 0, icon: Clock, color: 'bg-yellow-500' },
            { label: 'Aprovadas', value: stats?.approved || 0, icon: CheckCircle, color: 'bg-green-500' },
            { label: 'Total', value: stats?.total || 0, icon: ShoppingCart, color: 'bg-blue-500' },
            { label: 'Total Gasto', value: `R$ ${(stats?.totalSpent || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: DollarSign, color: 'bg-purple-500' },
          ].map((stat, i) => (
            <motion.div key={stat.label} className="card p-5" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-dark-400">{stat.label}</p>
                  <p className="text-2xl font-bold text-dark-800 mt-1">{stat.value}</p>
                </div>
                <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center`}>
                  <stat.icon size={20} className="text-white" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Requests Tab */}
      {activeTab === 'requests' && (
        <div className="card">
          <div className="p-4 border-b border-dark-200 flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-300" />
              <input type="text" placeholder="Buscar requisições..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="input-field pl-9 py-2 text-sm" />
            </div>
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="input-field py-2 text-sm w-44">
              <option value="">Todos Status</option>
              <option value="DRAFT">Rascunho</option>
              <option value="PENDING_APPROVAL">Pendente</option>
              <option value="APPROVED">Aprovada</option>
              <option value="REJECTED">Rejeitada</option>
              <option value="PURCHASED">Comprada</option>
              <option value="CANCELLED">Cancelada</option>
            </select>
          </div>

          {isLoading ? (
            <LoadingSpinner className="h-48" />
          ) : !purchasesData?.data.length ? (
            <EmptyState icon={<ShoppingCart size={24} />} title="Nenhuma requisição" description="Crie sua primeira requisição de compra" action={<button onClick={() => setShowCreateModal(true)} className="btn-primary text-sm">Criar Requisição</button>} />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-dark-200 bg-dark-50">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-dark-400 uppercase">Código</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-dark-400 uppercase">Título</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-dark-400 uppercase">Solicitante</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-dark-400 uppercase">Valor</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-dark-400 uppercase">Prioridade</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-dark-400 uppercase">Status</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-dark-400 uppercase">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-100">
                    {purchasesData.data.map((purchase) => (
                      <tr key={purchase.id} className="hover:bg-dark-50 transition-colors">
                        <td className="px-4 py-3 text-sm font-mono text-primary-600">{purchase.code}</td>
                        <td className="px-4 py-3">
                          <button onClick={() => { setSelectedPurchase(purchase); setShowDetailModal(true); }} className="text-sm font-medium text-dark-800 hover:text-primary-600 text-left">
                            {purchase.title}
                          </button>
                          <p className="text-xs text-dark-400">{purchase.items?.length} {purchase.items?.length === 1 ? 'item' : 'itens'}</p>
                        </td>
                        <td className="px-4 py-3 text-sm text-dark-500">{purchase.createdBy?.name}</td>
                        <td className="px-4 py-3 text-sm font-medium">R$ {Number(purchase.totalAmount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        <td className="px-4 py-3"><StatusBadge status={purchase.priority} /></td>
                        <td className="px-4 py-3"><StatusBadge status={purchase.status} /></td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            {purchase.status === 'DRAFT' && purchase.createdBy?.id === user?.id && (
                              <>
                                <button onClick={() => submitPurchase.mutate(purchase.id)} className="p-1.5 rounded hover:bg-blue-50 text-blue-600" title="Submeter"><Send size={14} /></button>
                                <button onClick={() => cancelPurchase.mutate({ id: purchase.id })} className="p-1.5 rounded hover:bg-red-50 text-red-600" title="Cancelar"><XCircle size={14} /></button>
                              </>
                            )}
                            {purchase.status === 'PENDING_APPROVAL' && isAdmin && (
                              <>
                                <button onClick={() => approvePurchase.mutate({ id: purchase.id, approved: true })} className="p-1.5 rounded hover:bg-green-50 text-green-600" title="Aprovar"><CheckCircle size={14} /></button>
                                <button onClick={() => approvePurchase.mutate({ id: purchase.id, approved: false })} className="p-1.5 rounded hover:bg-red-50 text-red-600" title="Rejeitar"><XCircle size={14} /></button>
                              </>
                            )}
                            {purchase.status === 'APPROVED' && isAdmin && (
                              <button onClick={() => { setSelectedPurchase(purchase); setFormData({}); setShowExecuteModal(true); }} className="p-1.5 rounded hover:bg-green-50 text-green-600" title="Executar"><Play size={14} /></button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination page={page} totalPages={purchasesData.pagination.totalPages} onPageChange={setPage} />
            </>
          )}
        </div>
      )}

      {/* Suppliers Tab */}
      {activeTab === 'suppliers' && (
        <div className="card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-200 bg-dark-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-dark-400 uppercase">Nome</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-dark-400 uppercase">Email</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-dark-400 uppercase">Telefone</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-dark-400 uppercase">Documento</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-dark-400 uppercase">Pedidos</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-dark-400 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-100">
                {suppliersData?.data.map((supplier) => (
                  <tr key={supplier.id} className="hover:bg-dark-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-dark-800">{supplier.name}</td>
                    <td className="px-4 py-3 text-sm text-dark-500">{supplier.email || '-'}</td>
                    <td className="px-4 py-3 text-sm text-dark-500">{supplier.phone || '-'}</td>
                    <td className="px-4 py-3 text-sm text-dark-500">{supplier.document || '-'}</td>
                    <td className="px-4 py-3 text-sm text-dark-500">{supplier._count?.purchaseOrders || 0}</td>
                    <td className="px-4 py-3">
                      {isAdmin && (
                        <button onClick={() => archiveSupplier.mutate(supplier.id)} className="text-xs text-red-500 hover:text-red-700">Arquivar</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {suppliersData && <Pagination page={supplierPage} totalPages={suppliersData.pagination.totalPages} onPageChange={setSupplierPage} />}
        </div>
      )}

      {/* Create Purchase Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Nova Requisição de Compra" size="xl">
        <form onSubmit={handleCreatePurchase} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1">Título *</label>
              <input type="text" required className="input-field" value={formData.title || ''} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1">Departamento</label>
              <input type="text" className="input-field" value={formData.department || ''} onChange={(e) => setFormData({ ...formData, department: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1">Prioridade</label>
              <select className="input-field" value={formData.priority || 'NORMAL'} onChange={(e) => setFormData({ ...formData, priority: e.target.value })}>
                <option value="LOW">Baixa</option>
                <option value="NORMAL">Normal</option>
                <option value="HIGH">Alta</option>
                <option value="URGENT">Urgente</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-700 mb-1">Justificativa *</label>
            <textarea required className="input-field" rows={2} value={formData.justification || ''} onChange={(e) => setFormData({ ...formData, justification: e.target.value })} />
          </div>

          {/* Items */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-dark-700">Itens</label>
              <button type="button" onClick={addItem} className="text-xs text-primary-600 hover:text-primary-700 font-medium">+ Adicionar Item</button>
            </div>
            <div className="space-y-3">
              {items.map((item, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <input type="text" placeholder="Descrição" required className="input-field flex-1 text-sm" value={item.description} onChange={(e) => updateItem(i, 'description', e.target.value)} />
                  <input type="number" placeholder="Qtd" required min={1} className="input-field w-20 text-sm" value={item.quantity} onChange={(e) => updateItem(i, 'quantity', parseInt(e.target.value) || 1)} />
                  <select className="input-field w-20 text-sm" value={item.unit} onChange={(e) => updateItem(i, 'unit', e.target.value)}>
                    <option>UN</option><option>CX</option><option>KG</option><option>L</option><option>M</option><option>PCT</option>
                  </select>
                  <input type="number" placeholder="Preço unit." required step="0.01" min={0} className="input-field w-32 text-sm" value={item.estimatedUnitPrice || ''} onChange={(e) => updateItem(i, 'estimatedUnitPrice', parseFloat(e.target.value) || 0)} />
                  {items.length > 1 && (
                    <button type="button" onClick={() => removeItem(i)} className="p-2 text-red-500 hover:text-red-700"><XCircle size={16} /></button>
                  )}
                </div>
              ))}
            </div>
            <div className="text-right mt-2">
              <span className="text-sm font-semibold">Total: R$ {totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={createPurchase.isPending} className="btn-primary">{createPurchase.isPending ? 'Criando...' : 'Criar Requisição'}</button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} title={`${selectedPurchase?.code} - ${selectedPurchase?.title}`} size="lg">
        {selectedPurchase && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-dark-400">Status</p><StatusBadge status={selectedPurchase.status} size="md" /></div>
              <div><p className="text-xs text-dark-400">Prioridade</p><StatusBadge status={selectedPurchase.priority} size="md" /></div>
              <div><p className="text-xs text-dark-400">Solicitante</p><p className="text-sm font-medium">{selectedPurchase.createdBy?.name}</p></div>
              <div><p className="text-xs text-dark-400">Valor Total</p><p className="text-sm font-semibold">R$ {Number(selectedPurchase.totalAmount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p></div>
            </div>
            <div><p className="text-xs text-dark-400 mb-1">Justificativa</p><p className="text-sm text-dark-700">{selectedPurchase.justification}</p></div>
            <div>
              <p className="text-xs text-dark-400 mb-2">Itens ({selectedPurchase.items?.length})</p>
              <div className="border rounded-lg divide-y">
                {selectedPurchase.items?.map((item) => (
                  <div key={item.id} className="px-4 py-2 flex justify-between text-sm">
                    <span>{item.description}</span>
                    <span className="text-dark-400">{item.quantity} {item.unit} x R$ {Number(item.estimatedUnitPrice).toFixed(2)} = <strong>R$ {Number(item.totalPrice).toFixed(2)}</strong></span>
                  </div>
                ))}
              </div>
            </div>
            {selectedPurchase.approvalActions && selectedPurchase.approvalActions.length > 0 && (
              <div>
                <p className="text-xs text-dark-400 mb-2">Histórico</p>
                <div className="space-y-2">
                  {selectedPurchase.approvalActions.map((action) => (
                    <div key={action.id} className="flex items-center gap-2 text-sm">
                      <StatusBadge status={action.newStatus} />
                      <span className="text-dark-500">por {action.user?.name}</span>
                      <span className="text-dark-300 text-xs">{format(new Date(action.createdAt), 'dd/MM/yyyy HH:mm')}</span>
                      {action.comments && <span className="text-dark-400 italic">- {action.comments}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Execute Purchase Modal */}
      <Modal isOpen={showExecuteModal} onClose={() => setShowExecuteModal(false)} title="Executar Compra" size="lg">
        <form onSubmit={(e) => { e.preventDefault(); executePurchase.mutate({ id: selectedPurchase!.id, ...formData }, { onSuccess: () => { setShowExecuteModal(false); setFormData({}); } }); }} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1">Fornecedor</label>
              <select className="input-field" value={formData.supplierId || ''} onChange={(e) => setFormData({ ...formData, supplierId: e.target.value || undefined })}>
                <option value="">Selecione...</option>
                {suppliersData?.data.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1">Nº Nota Fiscal</label>
              <input type="text" className="input-field" value={formData.invoiceNumber || ''} onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1">Valor Total</label>
              <input type="number" step="0.01" className="input-field" value={formData.totalAmount || ''} onChange={(e) => setFormData({ ...formData, totalAmount: parseFloat(e.target.value) || undefined })} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-700 mb-1">Observações</label>
            <textarea className="input-field" rows={2} value={formData.notes || ''} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={() => setShowExecuteModal(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={executePurchase.isPending} className="btn-primary">{executePurchase.isPending ? 'Executando...' : 'Executar Compra'}</button>
          </div>
        </form>
      </Modal>

      {/* Create Supplier Modal */}
      <Modal isOpen={showCreateSupplierModal} onClose={() => setShowCreateSupplierModal(false)} title="Novo Fornecedor">
        <form onSubmit={(e) => { e.preventDefault(); createSupplier.mutate(formData, { onSuccess: () => { setShowCreateSupplierModal(false); setFormData({}); } }); }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-700 mb-1">Nome *</label>
            <input type="text" required className="input-field" value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1">Email</label>
              <input type="email" className="input-field" value={formData.email || ''} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1">Telefone</label>
              <input type="text" className="input-field" value={formData.phone || ''} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-700 mb-1">CNPJ/CPF</label>
            <input type="text" className="input-field" value={formData.document || ''} onChange={(e) => setFormData({ ...formData, document: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-700 mb-1">Endereço</label>
            <input type="text" className="input-field" value={formData.address || ''} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={() => setShowCreateSupplierModal(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={createSupplier.isPending} className="btn-primary">Criar Fornecedor</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
