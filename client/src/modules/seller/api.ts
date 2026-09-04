import { apiClient } from '../../services/api.client';
import { Seller, SellerSummary, CreateSellerDto, CreateTransactionDto, Transaction } from './types';

export interface GetSellersParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface GetSellersResponse {
  success: boolean;
  data: {
    sellers: Seller[];
    pagination?: PaginationMeta;
    summary: SellerSummary;
  };
}

export interface GetSellerDetailResponse {
  success: boolean;
  data: {
    seller: Seller;
  };
}

export interface CreateSellerResponse {
  success: boolean;
  message: string;
  data: {
    seller: Seller;
  };
}

export interface CreateTransactionResponse {
  success: boolean;
  message: string;
  data: {
    transaction: Transaction;
    sellerTotals: {
      totalDeliveries: number;
      totalPaid: number;
      totalDues: number;
    };
  };
}

export const sellerApi = {
  getSellers: async (params?: GetSellersParams): Promise<GetSellersResponse> => {
    const res = await apiClient.get<GetSellersResponse>('/sellers', { params });
    return res.data;
  },

  getSellerById: async (id: string, params?: { page?: number; limit?: number }): Promise<GetSellerDetailResponse> => {
    const res = await apiClient.get<GetSellerDetailResponse>(`/sellers/${id}`, { params });
    return res.data;
  },

  createSeller: async (data: CreateSellerDto): Promise<CreateSellerResponse> => {
    const res = await apiClient.post<CreateSellerResponse>('/sellers', data);
    return res.data;
  },

  updateSeller: async (id: string, data: Partial<CreateSellerDto>): Promise<{ success: boolean; message: string; data?: { seller: Seller } }> => {
    const res = await apiClient.put<{ success: boolean; message: string; data?: { seller: Seller } }>(`/sellers/${id}`, data);
    return res.data;
  },

  deleteSeller: async (id: string): Promise<{ success: boolean; message: string }> => {
    const res = await apiClient.delete<{ success: boolean; message: string }>(`/sellers/${id}`);
    return res.data;
  },

  createTransaction: async (data: CreateTransactionDto): Promise<CreateTransactionResponse> => {
    const res = await apiClient.post<CreateTransactionResponse>('/transactions', data);
    return res.data;
  },

  updateTransaction: async (id: string, data: Partial<CreateTransactionDto>): Promise<{ success: boolean; message: string; data?: { transaction: Transaction } }> => {
    const res = await apiClient.put<{ success: boolean; message: string; data?: { transaction: Transaction } }>(`/transactions/${id}`, data);
    return res.data;
  },

  deleteTransaction: async (id: string): Promise<{ success: boolean; message: string }> => {
    const res = await apiClient.delete<{ success: boolean; message: string }>(`/transactions/${id}`);
    return res.data;
  },

  getTransactions: async (params?: GetTransactionsParams): Promise<GetTransactionsResponse> => {
    const res = await apiClient.get<GetTransactionsResponse>('/transactions', { params });
    return res.data;
  },
};

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface GetTransactionsParams {
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
  sellerId?: string;
}

export interface TransactionWithSeller extends Transaction {
  sellerName: string;
  sellerEmail?: string | null;
  sellerPhone?: string | null;
  sellerAddress?: string | null;
  sellerGstNumber?: string | null;
}

export interface GetTransactionsResponse {
  success: boolean;
  data: {
    transactions: TransactionWithSeller[];
    pagination: PaginationMeta;
  };
}
