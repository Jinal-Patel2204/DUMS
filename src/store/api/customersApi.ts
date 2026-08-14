import { baseApi } from './baseApi';

/**
 * CUSTOMERS API — Java Backend ke customer endpoints
 * Backend ab Supabase PostgreSQL se data uthata hai (UUID based)
 */

export interface CustomerResponse {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  storeId: string;
  currentBalance: number;
  creditLimit: number;
  trustScore: number;
  invitationStatus: string | null;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ListParams {
  storeId: string;
  page?: number;
  pageSize?: number;
  search?: string;
}

interface ListResponse {
  data: CustomerResponse[];
  total: number;
}

interface CreateCustomerData {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  storeId: string;
  creditLimit?: number;
}

export const customersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCustomers: builder.query<ListResponse, ListParams>({
      query: ({ storeId, page = 0, pageSize = 20, search }) => ({
        url: `/customers/store/${storeId}`,
        params: { page, pageSize, ...(search ? { search } : {}) },
      }),
      providesTags: ['Customers'],
    }),

    getCustomer: builder.query<CustomerResponse, { id: string }>({
      query: ({ id }) => `/customers/${id}`,
      providesTags: (_r, _e, { id }) => [{ type: 'Customers', id }],
    }),

    createCustomer: builder.mutation<CustomerResponse, CreateCustomerData>({
      query: (data) => ({
        url: '/customers',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Customers'],
    }),

    updateCustomer: builder.mutation<CustomerResponse, { id: string; data: Partial<CreateCustomerData> }>({
      query: ({ id, data }) => ({
        url: `/customers/${id}`,
        method: 'PUT',
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
