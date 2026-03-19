interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

const statusColors: Record<string, string> = {
  // Asset Status
  AVAILABLE: 'bg-green-100 text-green-800',
  IN_USE: 'bg-blue-100 text-blue-800',
  MAINTENANCE: 'bg-yellow-100 text-yellow-800',
  DECOMMISSIONED: 'bg-dark-100 text-dark-800',
  DISPOSED: 'bg-red-100 text-red-800',

  // Purchase Status
  DRAFT: 'bg-dark-100 text-dark-800',
  PENDING_APPROVAL: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  PURCHASED: 'bg-blue-100 text-blue-800',
  CANCELLED: 'bg-dark-100 text-dark-500',

  // Maintenance Status
  SCHEDULED: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
  COMPLETED: 'bg-green-100 text-green-800',
  OVERDUE: 'bg-red-100 text-red-800',

  // Inventory
  FOUND: 'bg-green-100 text-green-800',
  NOT_FOUND: 'bg-red-100 text-red-800',
  DISCREPANCY: 'bg-orange-100 text-orange-800',
  PENDING: 'bg-dark-100 text-dark-800',

  // User Status
  ACTIVE: 'bg-green-100 text-green-800',
  INACTIVE: 'bg-dark-100 text-dark-800',
  SUSPENDED: 'bg-red-100 text-red-800',

  // Priority
  LOW: 'bg-dark-100 text-dark-700',
  NORMAL: 'bg-blue-100 text-blue-700',
  HIGH: 'bg-orange-100 text-orange-700',
  URGENT: 'bg-red-100 text-red-700',
};

const statusLabels: Record<string, string> = {
  AVAILABLE: 'Disponível',
  IN_USE: 'Em Uso',
  MAINTENANCE: 'Manutenção',
  DECOMMISSIONED: 'Desativado',
  DISPOSED: 'Descartado',
  DRAFT: 'Rascunho',
  PENDING_APPROVAL: 'Pendente',
  APPROVED: 'Aprovado',
  REJECTED: 'Rejeitado',
  PURCHASED: 'Comprado',
  CANCELLED: 'Cancelado',
  SCHEDULED: 'Agendado',
  IN_PROGRESS: 'Em Andamento',
  COMPLETED: 'Concluído',
  OVERDUE: 'Atrasado',
  FOUND: 'Encontrado',
  NOT_FOUND: 'Não Encontrado',
  DISCREPANCY: 'Divergência',
  PENDING: 'Pendente',
  ACTIVE: 'Ativo',
  INACTIVE: 'Inativo',
  SUSPENDED: 'Suspenso',
  LOW: 'Baixa',
  NORMAL: 'Normal',
  HIGH: 'Alta',
  URGENT: 'Urgente',
  ADMIN: 'Admin',
  USER: 'Usuário',
};

export default function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const colors = statusColors[status] || 'bg-dark-100 text-dark-800';
  const label = statusLabels[status] || status;
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${colors} ${sizeClass}`}>
      {label}
    </span>
  );
}
