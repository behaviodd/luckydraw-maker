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
    let cancelled = false;

    const check = async () => {
      if (!user) {
        if (!cancelled) {
          setIsAdmin(false);
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);
      const { data } = await supabase.rpc('is_admin');
      if (!cancelled) {
        setIsAdmin(data === true);
        setIsLoading(false);
      }
    };

    queueMicrotask(() => {
      void check();
    });
    return () => { cancelled = true; };
  }, [supabase, user]);

  return { isAdmin, isLoading };
}
