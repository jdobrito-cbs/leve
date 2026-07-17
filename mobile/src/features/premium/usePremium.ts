import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { db } from '@/db/client';
import { Entitlement, getEntitlement, isPremium } from './entitlement';

export function usePremium() {
  const [loading, setLoading] = useState(true);
  const [entitlement, setEnt] = useState<Entitlement>({ plan: 'free' });

  const refresh = useCallback(async () => {
    setEnt(await getEntitlement(db));
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  return { loading, entitlement, premium: isPremium(entitlement), refresh };
}
