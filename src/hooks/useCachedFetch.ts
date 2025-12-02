import { useState, useEffect } from 'react';
import { frontendCache } from '../lib/cache';

interface UseCachedFetchOptions {
  endpoint: string;
  params: Record<string, any>;
  enabled?: boolean;
}

export function useCachedFetch<T>({ endpoint, params, enabled = true }: UseCachedFetchOptions) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        // Check cache first
        const cacheKey = frontendCache.generateKey(endpoint, params);
        const cachedData = frontendCache.get<T>(cacheKey);
        
        if (cachedData) {
          setData(cachedData);
          setLoading(false);
          return;
        }

        setLoading(true);
        setError(null);
        
        // Build URL with params
        const queryString = Object.keys(params)
          .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
          .join('&');
        const url = `http://localhost:8000${endpoint}${queryString ? `?${queryString}` : ''}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`Erro na API: ${response.status}`);
        }
        
        const result = await response.json();
        frontendCache.set(cacheKey, result);
        setData(result);
        
      } catch (err) {
        console.error(`Erro ao buscar dados de ${endpoint}:`, err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [endpoint, JSON.stringify(params), enabled]);

  return { data, loading, error };
}

