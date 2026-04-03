/**
 * Standardized application error codes.
 *
 * @since 0.1.0
 * @category Errors
 */
export type ErrorCode =
  | 'E_GIT_DIRTY'
  | 'E_WEBDAV_LOCKED'
  | 'E_CREDENTIAL_NOT_FOUND'
  | 'E_CHECKSUM_MISMATCH'
  | 'E_CONFLICT_UNRESOLVED'
  | 'E_PROFILE_NOT_FOUND';

/**
 * Standard application error with machine-readable code and exit status.
 *
 * @class AppError
 * @since 0.1.0
 * @category Errors
 */
export class AppError extends Error {
  /**
   * Creates an application error instance.
   *
   * @param {ErrorCode} code - Stable machine-readable error code
   * @param {string} message - Human-readable error message
   * @param {number} exitCode - Process exit code
   */
  public constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly exitCode: number
  ) {
    super(message);
    this.name = 'AppError';
  }
}
