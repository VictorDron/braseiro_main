import { useDashboard } from '../hooks/useDashboard';
import { useAuthStore } from '../stores/authStore';
import {
  Package,
  ShoppingCart,
  Users,
  Truck,
  CheckCircle,
  Clock,
  Wrench,
  AlertCircle,
} from 'lucide-react';
import { motion } from 'framer-motion';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const actionLabels: Record<string, string> = {
  USER_LOGIN: 'Login realizado',
  USER_CREATED: 'Usuário criado',
  USER_UPDATED: 'Usuário atualizado',
  ASSET_CREATED: 'Ativo criado',
  ASSET_UPDATED: 'Ativo atualizado',
  ASSET_MOVED: 'Ativo movido',
  ASSET_ASSIGNED: 'Ativo atribuído',
  ASSET_DECOMMISSIONED: 'Ativo desativado',
  MAINTENANCE_CREATED: 'Manutenção agendada',
  MAINTENANCE_COMPLETED: 'Manutenção concluída',
  PURCHASE_CREATED: 'Requisição criada',
  PURCHASE_SUBMITTED: 'Requisição submetida',
  PURCHASE_APPROVED: 'Requisição aprovada',
  PURCHASE_REJECTED: 'Requisição rejeitada',
  PURCHASE_EXECUTED: 'Compra executada',
  SUPPLIER_CREATED: 'Fornecedor criado',
  INVENTORY_CREATED: 'Inventário criado',
  INVENTORY_STARTED: 'Inventário iniciado',
  INVENTORY_COMPLETED: 'Inventário concluído',
};

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { data, isLoading } = useDashboard();

  if (isLoading) {
    return <LoadingSpinner size="lg" className="h-64" />;
  }

  const stats = data?.stats;
  const recentActivity = data?.recentActivity || [];
  const upcomingMaintenance = data?.upcomingMaintenance || [];

  const cards = [
    { label: 'Total de Ativos', value: stats?.totalAssets || 0, icon: Package },
    { label: 'Disponíveis', value: stats?.availableAssets || 0, icon: CheckCircle },
    { label: 'Em Uso', value: stats?.inUseAssets || 0, icon: Package },
    { label: 'Manutenção', value: stats?.maintenanceAssets || 0, icon: Wrench },
    { label: 'Compras Pendentes', value: stats?.pendingPurchases || 0, icon: ShoppingCart },
    { label: 'Total Compras', value: stats?.totalPurchases || 0, icon: ShoppingCart },
    { label: 'Fornecedores', value: stats?.totalSuppliers || 0, icon: Truck },
    { label: 'Usuários', value: stats?.totalUsers || 0, icon: Users },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-dark-800">
          Olá, {user?.name?.split(' ')[0]}
        </h1>
        <p className="text-dark-400 text-sm mt-0.5">
          Resumo do seu sistema
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((card, index) => (
          <motion.div
            key={card.label}
            className="card p-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
          >
            <div className="flex items-center justify-between mb-2">
              <card.icon size={16} className="text-primary-500" />
            </div>
            <p className="text-2xl font-semibold text-dark-800">{card.value}</p>
            <p className="text-xs text-dark-400 mt-0.5">{card.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Activity */}
        <div className="card">
          <div className="px-5 py-3.5 border-b border-dark-200">
            <h2 className="font-display text-sm font-semibold text-dark-800">Atividade Recente</h2>
          </div>
          <div className="divide-y divide-dark-100">
            {recentActivity.length === 0 ? (
              <div className="px-5 py-8 text-center text-dark-400 text-sm">
                Nenhuma atividade recente
              </div>
            ) : (
              recentActivity.slice(0, 8).map((activity: any) => (
                <div key={activity.id} className="px-5 py-2.5 flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-primary-50 flex items-center justify-center flex-shrink-0">
                    <Clock size={12} className="text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-dark-700 truncate">
                      <span className="font-medium">{activity.user?.name}</span>{' '}
                      <span className="text-dark-400">{actionLabels[activity.action] || activity.action}</span>
                    </p>
                    <p className="text-[11px] text-dark-400">
                      {format(new Date(activity.createdAt), "dd 'de' MMM, HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Maintenance */}
        <div className="card">
          <div className="px-5 py-3.5 border-b border-dark-200">
            <h2 className="font-display text-sm font-semibold text-dark-800">Manutenções Próximas</h2>
          </div>
          <div className="divide-y divide-dark-100">
            {upcomingMaintenance.length === 0 ? (
              <div className="px-5 py-8 text-center text-dark-400 text-sm">
                Nenhuma manutenção agendada
              </div>
            ) : (
              upcomingMaintenance.map((m: any) => (
                <div key={m.id} className="px-5 py-2.5 flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
                    <AlertCircle size={12} className="text-amber-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-dark-700 truncate">
                      {m.asset?.name} ({m.asset?.code})
                    </p>
                    <p className="text-[11px] text-dark-400">
                      {m.description} - {format(new Date(m.scheduledDate), "dd/MM/yyyy")}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
