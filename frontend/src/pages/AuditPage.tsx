import { useState } from 'react';
import { useAuditLogs, useAuditStats } from '../hooks/useAudit';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Pagination from '../components/ui/Pagination';
import { ScrollText, Search, Activity, Calendar, User, Filter } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const actionLabels: Record<string, string> = {
  USER_LOGIN: 'Login',
  USER_LOGOUT: 'Logout',
  USER_CREATED: 'Usuário Criado',
  USER_UPDATED: 'Usuário Atualizado',
  USER_DEACTIVATED: 'Usuário Desativado',
  USER_ACTIVATED: 'Usuário Ativado',
  PASSWORD_CHANGED: 'Senha Alterada',
  ASSET_CREATED: 'Ativo Criado',
  ASSET_UPDATED: 'Ativo Atualizado',
  ASSET_MOVED: 'Ativo Movido',
  ASSET_ASSIGNED: 'Ativo Atribuído',
  ASSET_UNASSIGNED: 'Ativo Desatribuído',
  ASSET_DECOMMISSIONED: 'Ativo Desativado',
  MAINTENANCE_CREATED: 'Manutenção Agendada',
  MAINTENANCE_COMPLETED: 'Manutenção Concluída',
  INVENTORY_CREATED: 'Inventário Criado',
  INVENTORY_STARTED: 'Inventário Iniciado',
  INVENTORY_COMPLETED: 'Inventário Concluído',
  CATEGORY_CREATED: 'Categoria Criada',
  CATEGORY_UPDATED: 'Categoria Atualizada',
  CATEGORY_DELETED: 'Categoria Removida',
  LOCATION_CREATED: 'Localização Criada',
  LOCATION_UPDATED: 'Localização Atualizada',
  LOCATION_DELETED: 'Localização Removida',
  PURCHASE_CREATED: 'Requisição Criada',
  PURCHASE_UPDATED: 'Requisição Atualizada',
  PURCHASE_SUBMITTED: 'Requisição Submetida',
  PURCHASE_APPROVED: 'Requisição Aprovada',
  PURCHASE_REJECTED: 'Requisição Rejeitada',
  PURCHASE_EXECUTED: 'Compra Executada',
  PURCHASE_CANCELLED: 'Requisição Cancelada',
  SUPPLIER_CREATED: 'Fornecedor Criado',
  SUPPLIER_UPDATED: 'Fornecedor Atualizado',
  SUPPLIER_ARCHIVED: 'Fornecedor Arquivado',
};

const actionColors: Record<string, string> = {
  USER_LOGIN: 'bg-blue-100 text-blue-700',
  ASSET_CREATED: 'bg-green-100 text-green-700',
  ASSET_MOVED: 'bg-purple-100 text-purple-700',
  ASSET_DECOMMISSIONED: 'bg-red-100 text-red-700',
  PURCHASE_APPROVED: 'bg-green-100 text-green-700',
  PURCHASE_REJECTED: 'bg-red-100 text-red-700',
  PURCHASE_EXECUTED: 'bg-blue-100 text-blue-700',
};

export default function AuditPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [entityTypeFilter, setEntityTypeFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data: logsData, isLoading } = useAuditLogs({
    page,
    search: search || undefined,
    action: actionFilter || undefined,
    entityType: entityTypeFilter || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });
  const { data: stats } = useAuditStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Logs de Auditoria</h1>
        <p className="text-gray-500 mt-1">Registro completo de todas as ações do sistema</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: 'Hoje', value: stats?.today || 0, icon: Activity, color: 'bg-blue-500' },
          { label: 'Esta Semana', value: stats?.thisWeek || 0, icon: Calendar, color: 'bg-green-500' },
          { label: 'Este Mês', value: stats?.thisMonth || 0, icon: ScrollText, color: 'bg-purple-500' },
          { label: 'Total', value: stats?.total || 0, icon: ScrollText, color: 'bg-gray-500' },
        ].map((stat, i) => (
          <motion.div key={stat.label} className="card p-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">{stat.label}</p>
                <p className="text-xl font-bold mt-0.5">{stat.value}</p>
              </div>
              <div className={`w-8 h-8 ${stat.color} rounded-lg flex items-center justify-center`}>
                <stat.icon size={16} className="text-white" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Top Actions and Users This Month */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <div className="px-5 py-3 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700">Ações Mais Frequentes (Mês)</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {stats.byAction?.map((item: any) => (
                <div key={item.action} className="px-5 py-2.5 flex items-center justify-between">
                  <span className="text-sm text-gray-700">{actionLabels[item.action] || item.action}</span>
                  <span className="text-sm font-semibold text-gray-900">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <div className="px-5 py-3 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700">Usuários Mais Ativos (Mês)</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {stats.byUser?.map((item: any) => (
                <div key={item.userId} className="px-5 py-2.5 flex items-center justify-between">
                  <span className="text-sm text-gray-700">{item.email}</span>
                  <span className="text-sm font-semibold text-gray-900">{item.count} ações</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Logs Table */}
      <div className="card">
        <div className="p-4 border-b border-gray-200 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Buscar nos logs..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="input-field pl-9 py-2 text-sm" />
          </div>
          <select value={entityTypeFilter} onChange={(e) => { setEntityTypeFilter(e.target.value); setPage(1); }} className="input-field py-2 text-sm w-40">
            <option value="">Todas Entidades</option>
            <option value="User">Usuários</option>
            <option value="Asset">Ativos</option>
            <option value="AssetMaintenance">Manutenção</option>
            <option value="InventorySession">Inventário</option>
            <option value="PurchaseRequest">Compras</option>
            <option value="Supplier">Fornecedores</option>
            <option value="AssetCategory">Categorias</option>
            <option value="AssetLocation">Localizações</option>
          </select>
          <input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPage(1); }} className="input-field py-2 text-sm w-36" placeholder="Data início" />
          <input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setPage(1); }} className="input-field py-2 text-sm w-36" placeholder="Data fim" />
        </div>

        {isLoading ? (
          <LoadingSpinner className="h-48" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Data/Hora</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Usuário</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Ação</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Entidade</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">IP</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Detalhes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {logsData?.data.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                        {format(new Date(log.createdAt), "dd/MM/yyyy HH:mm:ss")}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-900">{log.user?.name}</p>
                        <p className="text-xs text-gray-500">{log.userEmail}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${actionColors[log.action] || 'bg-gray-100 text-gray-700'}`}>
                          {actionLabels[log.action] || log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-600">{log.entityType}</p>
                        {log.entityId && <p className="text-xs text-gray-400 font-mono">{log.entityId.slice(0, 8)}...</p>}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 font-mono">{log.ipAddress}</td>
                      <td className="px-4 py-3">
                        {log.details && Object.keys(log.details).length > 0 && (
                          <details className="text-xs">
                            <summary className="cursor-pointer text-brand-600 hover:text-brand-700">Ver</summary>
                            <pre className="mt-1 p-2 bg-gray-50 rounded text-[10px] max-w-xs overflow-auto">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {logsData && <Pagination page={page} totalPages={logsData.pagination.totalPages} onPageChange={setPage} />}
          </>
        )}
      </div>
    </div>
  );
}
