'use client';

import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setUser, setCurrentStore, setLoading } from '@/store/slices/authSlice';
import type { UserProfile, UserRole, Store } from '@/types/database';

/**
 * useAuth HOOK — Development mode: Login bypass + hardcoded store
 * 
 * Production mein yeh backend se data fetch karega
 * Abhi testing ke liye hardcoded values set hain
 */
export function useAuth() {
  const dispatch = useAppDispatch();
  const { user, currentStore, isLoading } = useAppSelector((s) => s.auth);

  useEffect(() => {
    // Development: Hardcoded user + store set karo
    const profile: UserProfile = {
      id: 'dev-user',
      full_name: 'Jinal Patel',
      phone: '9999999999',
      role: 'store_owner' as UserRole,
      avatar_url: null,
      must_change_password: false,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const store: Store = {
      id: 'b1bb1e7a-b378-4d20-90c5-2d385d6a3473',
      owner_id: 'dev-user',
      name: "Jinal Patel's Store",
      address: null,
      city: null,
      state: null,
      pincode: null,
      phone: '9999999999',
      email: null,
      gstin: null,
      logo_url: null,
      currency: 'INR',
      timezone: 'Asia/Kolkata',
      settings: {},
      is_active: true,
      is_deleted: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    dispatch(setUser(profile));
    dispatch(setCurrentStore(store));
    dispatch(setLoading(false));
  }, [dispatch]);

  return { user, currentStore, isLoading };
}
