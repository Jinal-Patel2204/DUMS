import { baseApi } from './baseApi';

/**
 * PRODUCTS API — Java Backend ke product endpoints
 */

export interface ProductResponse {
  id: string;
  storeId: string;
  name: string;
  description: string | null;
  sku: string | null;
  unit: string;
  sellingPrice: number;
  purchasePrice: number;
  discountPercent: number;
  stockQuantity: number;
  lowStockThreshold: number;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductData {
  storeId: string;
  name: string;
  description?: string;
  sku?: string;
  unit?: string;
  sellingPrice: number;
  purchasePrice: number;
  discountPercent?: number;
  stockQuantity?: number;
  lowStockThreshold?: number;
}

export const productsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProducts: builder.query<ProductResponse[], { storeId: string }>({
      query: ({ storeId }) => `/products/store/${storeId}`,
      providesTags: ['Products'],
    }),

    getProduct: builder.query<ProductResponse, { id: string }>({
      query: ({ id }) => `/products/${id}`,
      providesTags: (_r, _e, { id }) => [{ type: 'Products', id }],
    }),

    createProduct: builder.mutation<ProductResponse, CreateProductData>({
      query: (data) => ({
        url: '/products',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Products'],
    }),

    updateProduct: builder.mutation<ProductResponse, { id: string; data: Partial<CreateProductData> }>({
      query: ({ id, data }) => ({
        url: `/products/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Products', id }, 'Products'],
    }),

    deleteProduct: builder.mutation<void, { id: string }>({
      query: ({ id }) => ({
        url: `/products/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Products'],
    }),
  }),
});

export const {
  useGetProductsQuery,
  useGetProductQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
} = productsApi;
