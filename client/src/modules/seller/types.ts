export type TransactionType = 'DELIVERY' | 'PAYMENT';

export type PaymentMode = 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CHEQUE';

export interface TankItemDto {
  size: 500 | 1000;
  quantity: number;
  layers: number;
  foam?: 'none' | 'single' | 'double';
}

export interface Transaction {
  id: string;
  sellerId: string;
  parentId?: string | null;
  type: TransactionType;
  amount: number;
  date: string;
  note?: string | null;
  tankSize?: '500' | '1000' | null;
  tank500?: number;
  tank1000?: number;
  tank500_layers?: number | null;
  tank1000_layers?: number | null;
  tank500_foam?: 'none' | 'single' | 'double' | null;
  tank1000_foam?: 'none' | 'single' | 'double' | null;
  tankItems?: TankItemDto[];
  paymentMode?: string | null;
  vehicleNumber?: string | null;
  createdAt: string;
  updatedAt: string;
  previousDues?: number;
  currentDues?: number;
  isPreviousAdvance?: boolean;
  isCurrentAdvance?: boolean;
  previousDuesFormatted?: string;
  currentDuesFormatted?: string;
  paidAmount?: number;
  remainingDue?: number;
  advanceCredit?: number;
  linkedPayments?: Transaction[];
  parentDelivery?: {
    id: string;
    note?: string | null;
    amount: number;
    date: string;
  } | null;
}

export interface Seller {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  gstNumber?: string | null;
  createdAt: string;
  updatedAt: string;
  totalDeliveries: number;
  totalPaid: number;
  totalDues: number;
  advanceCredit?: number;
  isOverpaid?: boolean;
  tank500?: number;
  tank1000?: number;
  totalTanks?: number;
  transactionCount?: number;
  transactions?: Transaction[];
}

export interface SellerSummary {
  totalSellers: number;
  totalDeliveries: number;
  totalPaid: number;
  totalDues: number;
  totalTank500?: number;
  totalTank1000?: number;
  totalTanks?: number;
}

export interface CreateSellerDto {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  gstNumber?: string;
  requireAdditional?: boolean;
}

export interface CreateTransactionDto {
  sellerId: string;
  parentId?: string | null;
  type: TransactionType;
  amount: number;
  date?: string;
  note?: string;
  tankSize?: string | null;
  tank500?: number;
  tank1000?: number;
  tank500_layers?: number;
  tank1000_layers?: number;
  tank500_foam?: 'none' | 'single' | 'double';
  tank1000_foam?: 'none' | 'single' | 'double';
  tankItems?: TankItemDto[];
  paymentMode?: string;
  vehicleNumber?: string;
}

