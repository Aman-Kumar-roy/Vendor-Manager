import { apiClient } from '../../services/api.client';
import { Seller, SellerSummary, CreateSellerDto, CreateTransactionDto, Transaction } from './types';

export interface GetSellersResponse {
  success: boolean;
  data: {
    sellers: Seller[];
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
  getSellers: async (): Promise<GetSellersResponse> => {
    const res = await apiClient.get<GetSellersResponse>('/sellers');
    return res.data;
  },

  getSellerById: async (id: string): Promise<GetSellerDetailResponse> => {
    const res = await apiClient.get<GetSellerDetailResponse>(`/sellers/${id}`);
    return res.data;
  },

  createSeller: async (data: CreateSellerDto): Promise<CreateSellerResponse> => {
    const res = await apiClient.post<CreateSellerResponse>('/sellers', data);
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

  deleteTransaction: async (id: string): Promise<{ success: boolean; message: string }> => {
    const res = await apiClient.delete<{ success: boolean; message: string }>(`/transactions/${id}`);
    return res.data;
  },
};
