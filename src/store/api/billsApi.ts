import { baseApi } from './baseApi';
import type { Bill, BillItem } from '@/types/database';

interface BillWithCustomer extends Bill {
  customers?: { name: string; phone: string };
}

interface ListBillsParams {
  storeId: string;
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
}

interface ListBillsResponse {
  data: BillWithCustomer[];
  total: number;
}

interface BillDetailResponse extends Bill {
  customers: { id: string; name: string; phone: string; email: string | null; current_balance: number; credit_limit: number };
  bill_items: (BillItem & { products: { name: string; unit: string } | null })[];
  ledger_entries: { id: string; entry_type: string; debit_amount: number; credit_amount: number; balance_after: number; created_at: string }[];
}

interface CreateBillPayload {
  storeId: string;
  customerId: string;
  notes?: string;
  dueDate?: string;
  items: {
    product_id: string;
    description: string;
    quantity: number;
    unit_price: number;
    discount_percent: number;
  }[];
}

export const billsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getBills: builder.query<ListBillsResponse, ListBillsParams>({
      query: ({ storeId, page = 1, pageSize = 20, search, status }) => ({
        url: `/stores/${storeId}/bills`,
        params: { page, pageSize, search, status },
      }),
      providesTags: ['Bills'],
    }),
    getBill: builder.query<BillDetailResponse, { id: string }>({
      query: ({ id }) => `/bills/${id}`,
      providesTags: (_r, _e, { id }) => [{ type: 'Bills', id }],
    }),
    createBill: builder.mutation<Bill, CreateBillPayload>({
      query: ({ storeId, ...body }) => ({
        url: `/stores/${storeId}/bills`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Bills', 'Customers'],
    }),
  }),
});

export const {
  useGetBillsQuery,
  useGetBillQuery,
  useCreateBillMutation,
} = billsApi;
