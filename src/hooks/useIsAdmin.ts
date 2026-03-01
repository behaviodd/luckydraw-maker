'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export function useIsAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const check = async () => {
      setIsLoading(true);
      const { data } = await supabase.rpc('is_admin');
      if (!cancelled) {
        setIsAdmin(data === true);
        setIsLoading(false);
      }
    };

    check();
    return () => { cancelled = true; };
  }, [supabase, user]);

  return { isAdmin, isLoading };
}
