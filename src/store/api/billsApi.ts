import { baseApi } from './baseApi';

export interface BillResponse {
  id: string;
  storeId: string;
  customerId: string;
  billNumber: string;
  status: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  dueDate: string | null;
  notes: string | null;
  createdBy: string;
  finalizedAt: string | null;
  cancelledAt: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CreateBillData {
  storeId: string;
  customerId: string;
  notes?: string;
  subtotal: number;
  discountAmount?: number;
  taxAmount?: number;
  totalAmount: number;
  dueDate?: string;
}

export const billsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getBills: builder.query<BillResponse[], { storeId: string }>({
      query: ({ storeId }) => `/bills/store/${storeId}`,
      providesTags: ['Bills'],
    }),

    getBillsByStatus: builder.query<BillResponse[], { storeId: string; status: string }>({
      query: ({ storeId, status }) => `/bills/store/${storeId}/status/${status}`,
      providesTags: ['Bills'],
    }),

    getBillsByCustomer: builder.query<BillResponse[], { customerId: string }>({
      query: ({ customerId }) => `/bills/customer/${customerId}`,
      providesTags: ['Bills'],
    }),

    getBill: builder.query<BillResponse, { id: string }>({
      query: ({ id }) => `/bills/${id}`,
      providesTags: (_r, _e, { id }) => [{ type: 'Bills', id }],
    }),

    createBill: builder.mutation<BillResponse, CreateBillData>({
      query: (data) => ({
        url: '/bills',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Bills'],
    }),

    updateBill: builder.mutation<BillResponse, { id: string; data: Partial<CreateBillData> }>({
      query: ({ id, data }) => ({
        url: `/bills/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Bills', id }, 'Bills'],
    }),

    updateBillStatus: builder.mutation<BillResponse, { id: string; status: string }>({
      query: ({ id, status }) => ({
        url: `/bills/${id}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Bills', id }, 'Bills'],
    }),

    deleteBill: builder.mutation<void, { id: string }>({
      query: ({ id }) => ({
        url: `/bills/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Bills'],
    }),
  }),
});

export const {
  useGetBillsQuery,
  useGetBillsByStatusQuery,
  useGetBillsByCustomerQuery,
  useGetBillQuery,
  useCreateBillMutation,
  useUpdateBillMutation,
  useUpdateBillStatusMutation,
  useDeleteBillMutation,
} = billsApi;
