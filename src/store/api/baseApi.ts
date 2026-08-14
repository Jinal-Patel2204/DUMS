import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

/**
 * BASE API — Java Backend (localhost:8080) se baat karne ka base setup
 *
 * Features:
 * - Har request mein JWT token automatically attach hota hai
 * - baseUrl = Java backend ka URL
 * - Agar token expired → login page pe redirect
 */
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: 'http://localhost:8080/api',
    prepareHeaders: (headers) => {
      // LocalStorage se token lo aur header mein lagao
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        if (token) {
          headers.set('Authorization', `Bearer ${token}`);
        }
      }
      return headers;
    },
  }),
  tagTypes: ['Customers', 'Bills', 'Payments', 'Products', 'Dashboard'],
  endpoints: () => ({}),
});
