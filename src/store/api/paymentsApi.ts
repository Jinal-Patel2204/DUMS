import { baseApi } from './baseApi';

/**
 * PAYMENTS API — Java Backend ke payment endpoints
 */

export interface PaymentResponse {
  id: string;
  storeId: string;
  customerId: string;
  billId: string | null;
  amount: number;
  method: string;
  status: string;
  referenceId: string | null;
  proofUrl: string | null;
  rejectionReason: string | null;
  verifiedAt: string | null;
  verifiedBy: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentData {
  storeId: string;
  customerId: string;
  billId?: string;
  amount: number;
  method: string;
  referenceId?: string;
  notes?: string;
}

export interface UpdatePaymentStatusData {
  id: string;
  status: string;
  rejectionReason?: string;
}

export const paymentsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPayments: builder.query<PaymentResponse[], { storeId: string }>({
      query: ({ storeId }) => `/payments/store/${storeId}`,
      providesTags: ['Payments'],
    }),

    getPayment: builder.query<PaymentResponse, { id: string }>({
      query: ({ id }) => `/payments/${id}`,
      providesTags: (_r, _e, { id }) => [{ type: 'Payments', id }],
    }),

    getPaymentsByCustomer: builder.query<PaymentResponse[], { customerId: string }>({
      query: ({ customerId }) => `/payments/customer/${customerId}`,
      providesTags: ['Payments'],
    }),

    createPayment: builder.mutation<PaymentResponse, CreatePaymentData>({
      query: (data) => ({
        url: '/payments',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Payments'],
    }),

    updatePaymentStatus: builder.mutation<PaymentResponse, UpdatePaymentStatusData>({
      query: ({ id, ...body }) => ({
        url: `/payments/${id}/status`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Payments'],
    }),

    deletePayment: builder.mutation<void, { id: string }>({
      query: ({ id }) => ({
        url: `/payments/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Payments'],
    }),
  }),
});

export const {
  useGetPaymentsQuery,
  useGetPaymentQuery,
  useGetPaymentsByCustomerQuery,
  useCreatePaymentMutation,
  useUpdatePaymentStatusMutation,
  useDeletePaymentMutation,
} = paymentsApi;
