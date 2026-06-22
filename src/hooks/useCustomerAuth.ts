'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface CustomerContext {
  userId: string;
  customerId: string;
  storeId: string;
  name: string;
  phone: string;
}

export function useCustomerAuth() {
  const [customer, setCustomer] = useState<CustomerContext | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      // Find customer record linked to this user
      const { data: customerData } = await supabase
        .from('customers')
        .select('id, store_id, name, phone')
        .eq('linked_user_id', user.id)
        .eq('is_deleted', false)
        .limit(1)
        .single();

      if (customerData) {
        setCustomer({
          userId: user.id,
          customerId: customerData.id,
          storeId: customerData.store_id,
          name: customerData.name,
          phone: customerData.phone,
        });
      }
      setLoading(false);
    };
    fetch();
  }, []);

  return { customer, loading };
}
