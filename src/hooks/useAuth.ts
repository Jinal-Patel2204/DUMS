'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setUser, setCurrentStore, setLoading } from '@/store/slices/authSlice';
import type { UserProfile, Store, UserRole } from '@/types/database';

export function useAuth() {
  const dispatch = useAppDispatch();
  const { user, currentStore, isLoading } = useAppSelector((s) => s.auth);

  useEffect(() => {
    const supabase = createClient();

    const fetchProfile = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        
        if (!authUser) {
          dispatch(setUser(null));
          dispatch(setLoading(false));
          return;
        }

        // Try to fetch profile
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (profile && !profileError) {
          dispatch(setUser(profile as UserProfile));
        } else {
          // Profile not found - use auth metadata
          console.warn('Profile not found, using auth metadata:', profileError?.message);
          dispatch(setUser({
            id: authUser.id,
            full_name: authUser.user_metadata?.full_name || authUser.email || 'User',
            phone: authUser.user_metadata?.phone || '',
            role: 'store_owner' as UserRole,
            avatar_url: null,
            must_change_password: false,
            is_active: true,
            created_at: authUser.created_at,
            updated_at: authUser.created_at,
          }));
        }

        // Try to fetch store
        const { data: stores, error: storeError } = await supabase
          .from('stores')
          .select('*')
          .eq('owner_id', authUser.id)
          .eq('is_deleted', false)
          .limit(1);

        if (stores && stores.length > 0 && !storeError) {
          dispatch(setCurrentStore(stores[0] as Store));
        } else {
          console.warn('Store not found:', storeError?.message);
          // Set a fallback store so dashboard doesn't stay on skeleton
          dispatch(setCurrentStore(null));
        }
      } catch (err) {
        console.error('Auth fetch error:', err);
      } finally {
        dispatch(setLoading(false));
      }
    };

    fetchProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        dispatch(setUser(null));
        dispatch(setCurrentStore(null));
      }
    });

    return () => subscription.unsubscribe();
  }, [dispatch]);

  return { user, currentStore, isLoading };
}
