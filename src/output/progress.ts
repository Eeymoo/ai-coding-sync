/**
 * Progress event payload.
 *
 * @since 0.1.0
 * @category Output
 */
export interface ProgressEvent {
  current: number;
  total: number;
  file: string;
}

/**
 * Renders synchronization progress for TTY and non-TTY terminals.
 *
 * @param {string} mappingName - Mapping currently being synchronized
 * @param {ProgressEvent} event - Progress event data
 * @returns {void} No return value
 * @example
 * renderProgress('claude', { current: 1, total: 4, file: 'settings.json' });
 * @since 0.1.0
 * @category Output
 */
export function renderProgress(
  mappingName: string,
  event: ProgressEvent
): void {
  const percentage = Math.round((event.current / event.total) * 100);

  if (process.stdout.isTTY) {
    console.log(
      `Syncing ${mappingName}... [${event.current}/${event.total}] ${event.file} (${percentage}%)`
    );
    return;
  }

  console.log(
    JSON.stringify({
      type: 'progress',
      mapping: mappingName,
      current: event.current,
      total: event.total,
      file: event.file,
    })
  );
}
