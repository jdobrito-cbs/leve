import { useCallback, useEffect, useState } from 'react';
import { db } from '@/db/client';
import { acceptDisclaimer, getProfile } from '@/db/profileRepo';

export function useOnboarding() {
  const [loading, setLoading] = useState(true);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    let active = true;
    getProfile(db)
      .then((p) => {
        if (active) setAccepted(Boolean(p?.disclaimerAcceptedAt));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const accept = useCallback(async () => {
    await acceptDisclaimer(db, new Date());
    setAccepted(true);
  }, []);

  return { loading, accepted, accept };
}
