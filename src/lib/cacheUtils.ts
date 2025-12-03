/**
 * Utilitários para gerenciar cache do frontend e backend
 */
import { frontendCache } from './cache';
import { apiClient } from './api';

/**
 * Limpa todo o cache (frontend + backend)
 * Útil quando os CSVs de alocação são atualizados
 */
export async function clearAllCache(): Promise<{
  frontend: { cleared: number };
  backend: { success: boolean; entries_cleared: number };
}> {
  // Limpar cache do frontend
  const frontendCleared = frontendCache.clearWithStats();

  // Limpar cache do backend
  let backendResult;
  try {
    backendResult = await apiClient.clearBackendCache();
  } catch (error) {
    console.error('Erro ao limpar cache do backend:', error);
    backendResult = {
      success: false,
      entries_cleared: 0,
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }

  return {
    frontend: { cleared: frontendCleared },
    backend: {
      success: backendResult.success,
      entries_cleared: backendResult.entries_cleared
    }
  };
}

/**
 * Limpa apenas o cache do frontend
 */
export function clearFrontendCache(): number {
  return frontendCache.clearWithStats();
}

/**
 * Limpa apenas o cache do backend
 */
export async function clearBackendCache(): Promise<{
  success: boolean;
  entries_cleared: number;
}> {
  try {
    const result = await apiClient.clearBackendCache();
    return {
      success: result.success,
      entries_cleared: result.entries_cleared
    };
  } catch (error) {
    console.error('Erro ao limpar cache do backend:', error);
    throw error;
  }
}

/**
 * Obtém estatísticas do cache do backend
 */
export async function getBackendCacheStats() {
  try {
    return await apiClient.getCacheStats();
  } catch (error) {
    console.error('Erro ao obter estatísticas do cache:', error);
    throw error;
  }
}

