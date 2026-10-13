/**
 * CivicFlow Client Health Helper
 *
 * Direct database access and anon client instances have been removed in compliance
 * with the institutional security review. All database operations and health checks
 * are mediated exclusively through the trusted Express backend (/api/v1/health),
 * preventing exposure of sensitive municipal data or service-role credentials.
 */

export const checkSupabaseHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch('/api/v1/health');
    if (!response.ok) return false;
    const data = await response.json();
    return data?.status === 'HEALTHY' || data?.status === 'OK';
  } catch {
    return false;
  }
};
