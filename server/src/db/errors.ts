/**
 * CivicFlow Institutional Database Persistence Errors
 *
 * Provides standardized error types for database unavailability (503)
 * and persistence failure (500), guaranteeing zero credential leakage
 * in error descriptions, API responses, or client payloads.
 */

export class DatabaseUnavailableError extends Error {
  public readonly statusCode = 503;
  public readonly code = 'DATABASE_UNAVAILABLE';

  constructor(message = 'Municipal database service is currently unavailable.') {
    super(message);
    this.name = 'DatabaseUnavailableError';
    Object.setPrototypeOf(this, DatabaseUnavailableError.prototype);
  }
}

export class PersistenceError extends Error {
  public readonly statusCode = 500;
  public readonly code = 'PERSISTENCE_FAILURE';

  constructor(message = 'An unexpected persistence failure occurred while committing institutional data.') {
    super(message);
    this.name = 'PersistenceError';
    Object.setPrototypeOf(this, PersistenceError.prototype);
  }
}

/**
 * Maps raw database / network / PostgREST exceptions into standardized
 * institutional error classes without exposing credentials, connection strings,
 * or internal table details.
 */
export function mapDatabaseError(error: any): DatabaseUnavailableError | PersistenceError {
  if (error instanceof DatabaseUnavailableError || error instanceof PersistenceError) {
    return error;
  }

  const msg = String(error?.message || '').toLowerCase();
  const code = String(error?.code || '').toUpperCase();
  const status = Number(error?.status || 0);

  // Network / Connection / Availability indications
  const isUnavailability =
    status === 502 ||
    status === 503 ||
    status === 504 ||
    code === 'ECONNREFUSED' ||
    code === 'ETIMEDOUT' ||
    code === 'ENOTFOUND' ||
    code === 'EHOSTUNREACH' ||
    code === '08000' || // connection_exception
    code === '08003' || // connection_does_not_exist
    code === '08006' || // connection_failure
    code === '08001' || // sqlclient_unable_to_establish_sqlconnection
    code === '08004' || // sqlserver_rejected_establishment_of_sqlconnection
    code === '57P01' || // admin_shutdown
    code === '57P02' || // crash_shutdown
    code === '57P03' || // cannot_connect_now
    msg.includes('fetch failed') ||
    msg.includes('network request failed') ||
    msg.includes('connection refused') ||
    msg.includes('connection reset') ||
    msg.includes('timed out') ||
    msg.includes('timeout') ||
    msg.includes('service unavailable') ||
    msg.includes('bad gateway') ||
    msg.includes('gateway timeout') ||
    msg.includes('cannot connect');

  if (isUnavailability) {
    return new DatabaseUnavailableError('Municipal database persistence layer is currently unavailable.');
  }

  return new PersistenceError('An unexpected persistence failure occurred while recording institutional data.');
}
