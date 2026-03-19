import { useDashboard } from '../hooks/useDashboard';
import { useAuthStore } from '../stores/authStore';
import {
  Package,
  ShoppingCart,
  Users,
  Truck,
  CheckCircle,
  AlertCircle,
  Clock,
  Wrench,
  TrendingUp,
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
    { label: 'Total de Ativos', value: stats?.totalAssets || 0, icon: Package, color: 'bg-blue-500', change: '' },
    { label: 'Disponíveis', value: stats?.availableAssets || 0, icon: CheckCircle, color: 'bg-green-500', change: '' },
    { label: 'Em Uso', value: stats?.inUseAssets || 0, icon: TrendingUp, color: 'bg-purple-500', change: '' },
    { label: 'Manutenção', value: stats?.maintenanceAssets || 0, icon: Wrench, color: 'bg-yellow-500', change: '' },
    { label: 'Compras Pendentes', value: stats?.pendingPurchases || 0, icon: ShoppingCart, color: 'bg-orange-500', change: '' },
    { label: 'Total de Compras', value: stats?.totalPurchases || 0, icon: ShoppingCart, color: 'bg-indigo-500', change: '' },
    { label: 'Fornecedores', value: stats?.totalSuppliers || 0, icon: Truck, color: 'bg-teal-500', change: '' },
    { label: 'Usuários Ativos', value: stats?.totalUsers || 0, icon: Users, color: 'bg-pink-500', change: '' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Olá, {user?.name?.split(' ')[0]}!
        </h1>
        <p className="text-gray-500 mt-1">
          Aqui está o resumo do seu sistema
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, index) => (
          <motion.div
            key={card.label}
            className="card p-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
              </div>
              <div className={`w-10 h-10 ${card.color} rounded-lg flex items-center justify-center`}>
                <card.icon size={20} className="text-white" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="card">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Atividade Recente</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {recentActivity.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500 text-sm">
                Nenhuma atividade recente
              </div>
            ) : (
              recentActivity.slice(0, 8).map((activity: any) => (
                <div key={activity.id} className="px-6 py-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Clock size={14} className="text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 truncate">
                      <span className="font-medium">{activity.user?.name}</span>{' '}
                      {actionLabels[activity.action] || activity.action}
                    </p>
                    <p className="text-xs text-gray-500">
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
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Manutenções Próximas</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {upcomingMaintenance.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500 text-sm">
                Nenhuma manutenção agendada
              </div>
            ) : (
              upcomingMaintenance.map((m: any) => (
                <div key={m.id} className="px-6 py-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                    <AlertCircle size={14} className="text-yellow-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {m.asset?.name} ({m.asset?.code})
                    </p>
                    <p className="text-xs text-gray-500">
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
