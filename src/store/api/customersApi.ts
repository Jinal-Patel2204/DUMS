import { baseApi } from './baseApi';
import type { Customer } from '@/types/database';
import type { CustomerInput } from '@/lib/validations/customer';

interface ListParams {
  storeId: string;
  page?: number;
  pageSize?: number;
  search?: string;
  isActive?: boolean;
}

interface ListResponse {
  data: Customer[];
  total: number;
}

export const customersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCustomers: builder.query<ListResponse, ListParams>({
      query: ({ storeId, page = 1, pageSize = 20, search, isActive }) => ({
        url: `/stores/${storeId}/customers`,
        params: { page, pageSize, search, isActive },
      }),
      providesTags: ['Customers'],
    }),
    getCustomer: builder.query<Customer, { id: string }>({
      query: ({ id }) => `/customers/${id}`,
      providesTags: (_r, _e, { id }) => [{ type: 'Customers', id }],
    }),
    createCustomer: builder.mutation<Customer, { storeId: string; data: CustomerInput }>({
      query: ({ storeId, data }) => ({
        url: `/stores/${storeId}/customers`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Customers'],
    }),
    updateCustomer: builder.mutation<Customer, { id: string; data: Partial<CustomerInput> }>({
      query: ({ id, data }) => ({
        url: `/customers/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Customers', id }, 'Customers'],
    }),
    deleteCustomer: builder.mutation<void, { id: string }>({
      query: ({ id }) => ({
        url: `/customers/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Customers'],
    }),
  }),
});

export const {
  useGetCustomersQuery,
  useGetCustomerQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation,
} = customersApi;
