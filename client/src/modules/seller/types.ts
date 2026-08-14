export type TransactionType = 'DELIVERY' | 'PAYMENT';

export interface Transaction {
  id: string;
  sellerId: string;
  parentId?: string | null;
  type: TransactionType;
  amount: number;
  date: string;
  note?: string | null;
  tankSize?: '500' | '1000' | '2000' | null;
  tank500?: number;
  tank1000?: number;
  tank2000?: number;
  createdAt: string;
  updatedAt: string;
  paidAmount?: number;
  remainingDue?: number;
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
  transactionCount?: number;
  transactions?: Transaction[];
}

export interface SellerSummary {
  totalSellers: number;
  totalDeliveries: number;
  totalPaid: number;
  totalDues: number;
}

export interface CreateSellerDto {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  gstNumber?: string;
}

export interface CreateTransactionDto {
  sellerId: string;
  parentId?: string | null;
  type: TransactionType;
  amount: number;
  date?: string;
  note?: string;
  tankSize?: '500' | '1000' | '2000' | null;
  tank500?: number;
  tank1000?: number;
  tank2000?: number;
}
