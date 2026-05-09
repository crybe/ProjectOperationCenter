import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

export function useApi() {
  const navigate = useNavigate();

  const apiFetch = useCallback(async (url: string, options?: RequestInit) => {
    const res = await fetch(url, options);
    if (res.redirected && new URL(res.url).pathname.includes('/login')) {
      navigate('/login');
      throw new Error('Session abgelaufen');
    }
    if (res.status === 401) {
      navigate('/login');
      throw new Error('Session abgelaufen');
    }
    if (res.status === 403) {
      throw new Error('Zugriff verweigert (403)');
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }, [navigate]);

  return apiFetch;
}
