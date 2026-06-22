import { baseApi } from './baseApi';
import type { Product } from '@/types/database';

interface ListProductsParams {
  storeId: string;
  search?: string;
}

export const productsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProducts: builder.query<Product[], ListProductsParams>({
      query: ({ storeId, search }) => ({
        url: `/stores/${storeId}/products`,
        params: { search },
      }),
      providesTags: ['Products'],
    }),
  }),
});

export const { useGetProductsQuery } = productsApi;
