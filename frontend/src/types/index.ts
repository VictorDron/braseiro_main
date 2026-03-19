// User types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'USER';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  avatar?: string;
  phone?: string;
  department?: string;
  createdAt: string;
  updatedAt?: string;
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// Asset types
export type AssetStatus = 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'DECOMMISSIONED' | 'DISPOSED';

export interface AssetCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  _count?: { assets: number };
}

export interface AssetLocation {
  id: string;
  name: string;
  description?: string;
  address?: string;
  parentId?: string;
  parent?: AssetLocation;
  children?: AssetLocation[];
  _count?: { assets: number };
}

export interface Asset {
  id: string;
  code: string;
  name: string;
  description?: string;
  categoryId: string;
  locationId: string;
  status: AssetStatus;
  brand?: string;
  model?: string;
  serialNumber?: string;
  acquisitionDate?: string;
  acquisitionValue?: number;
  currentValue?: number;
  depreciationRate?: number;
  warrantyExpiry?: string;
  photoUrl?: string;
  qrCodeUrl?: string;
  responsibleId?: string;
  tags: string[];
  metadata?: Record<string, any>;
  category: AssetCategory;
  location: AssetLocation;
  responsible?: { id: string; name: string; email: string };
  createdBy: { id: string; name: string };
  movements?: AssetMovement[];
  maintenances?: AssetMaintenance[];
  createdAt: string;
}

export interface AssetMovement {
  id: string;
  assetId: string;
  fromLocation: AssetLocation;
  toLocation: AssetLocation;
  reason?: string;
  movedBy: { id: string; name: string };
  movedAt: string;
}

// Maintenance types
export type MaintenanceType = 'PREVENTIVE' | 'CORRECTIVE' | 'INSPECTION' | 'CALIBRATION' | 'CLEANING';
export type MaintenanceStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'OVERDUE';

export interface AssetMaintenance {
  id: string;
  assetId: string;
  type: MaintenanceType;
  description: string;
  cost?: number;
  scheduledDate: string;
  startDate?: string;
  endDate?: string;
  status: MaintenanceStatus;
  priority: string;
  vendor?: string;
  notes?: string;
  asset?: Asset;
  createdBy: { id: string; name: string };
  completedBy?: { id: string; name: string };
}

// Inventory types
export type InventoryStatus = 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type InventoryItemStatus = 'PENDING' | 'FOUND' | 'NOT_FOUND' | 'DISCREPANCY';

export interface InventorySession {
  id: string;
  code: string;
  name: string;
  description?: string;
  status: InventoryStatus;
  locationId?: string;
  categoryId?: string;
  totalAssets: number;
  foundCount: number;
  missingCount: number;
  startedAt?: string;
  completedAt?: string;
  location?: AssetLocation;
  category?: AssetCategory;
  startedBy?: { id: string; name: string };
  completedBy?: { id: string; name: string };
  items?: InventoryItem[];
}

export interface InventoryItem {
  id: string;
  sessionId: string;
  assetId: string;
  status: InventoryItemStatus;
  checkedAt?: string;
  notes?: string;
  asset: Asset;
  checkedBy?: { id: string; name: string };
}

// Purchase types
export type PurchaseStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'PURCHASED' | 'CANCELLED';
export type PurchasePriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export interface PurchaseRequest {
  id: string;
  code: string;
  title: string;
  department?: string;
  priority: PurchasePriority;
  status: PurchaseStatus;
  justification: string;
  totalAmount: number;
  submittedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  purchasedAt?: string;
  notes?: string;
  createdBy: { id: string; name: string; email: string };
  items: PurchaseItem[];
  approvalActions?: ApprovalAction[];
  purchaseOrder?: PurchaseOrder;
  createdAt: string;
}

export interface PurchaseItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  estimatedUnitPrice: number;
  totalPrice: number;
  notes?: string;
}

export interface ApprovalAction {
  id: string;
  action: string;
  comments?: string;
  previousStatus: string;
  newStatus: string;
  user: { id: string; name: string };
  createdAt: string;
}

export interface PurchaseOrder {
  id: string;
  supplierId?: string;
  invoiceNumber?: string;
  invoiceUrl?: string;
  totalAmount: number;
  executedAt: string;
  supplier?: Supplier;
  executedBy: { id: string; name: string };
}

// Supplier types
export interface Supplier {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  document?: string;
  address?: string;
  notes?: string;
  isActive: boolean;
  _count?: { purchaseOrders: number };
}

// Audit types
export interface AuditLog {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  entityType: string;
  entityId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  user: { id: string; name: string; email: string; role: string };
  createdAt: string;
}

// Notification types
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

// Dashboard types
export interface DashboardStats {
  totalAssets: number;
  availableAssets: number;
  inUseAssets: number;
  maintenanceAssets: number;
  totalPurchases: number;
  pendingPurchases: number;
  totalSuppliers: number;
  totalUsers: number;
}

// Pagination
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
