import { useEffect } from 'react';
import { useSailingStore } from '@/store';
import { useToastStore } from '@/store';

export function useOfflineDetector() {
  const { setOffline } = useSailingStore();
  const toast = useToastStore();

  useEffect(() => {
    const handleOffline = () => {
      setOffline(true);
      toast.warning('You are offline — showing cached data');
    };

    const handleOnline = () => {
      setOffline(false);
      toast.success('Back online — refreshing conditions');
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    // Set initial state
    setOffline(!navigator.onLine);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, [setOffline, toast]);
}
