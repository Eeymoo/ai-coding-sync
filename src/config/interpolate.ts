/**
 * Variables available for template interpolation.
 *
 * @since 0.1.0
 * @category Config
 */
export interface TemplateVariables {
  syncId: string;
  hostname: string;
  username: string;
  profile: string;
  date: string;
  time: string;
}

const SUPPORTED_VARIABLE_PATTERN =
  /\$\{(syncId|hostname|username|profile|date|time)\}/g;

/**
 * Interpolates supported template variables in a string value.
 *
 * @param {string} template - Template string containing supported placeholders
 * @param {TemplateVariables} variables - Values used for interpolation
 * @returns {string} Interpolated string
 * @example
 * interpolateTemplate('/ai-sync/${syncId}', { syncId: 'mac', hostname: 'host', username: 'u', profile: 'default', date: '2026-04-03', time: '2026-04-03T11:00:00' });
 * @since 0.1.0
 * @category Config
 */
export function interpolateTemplate(
  template: string,
  variables: TemplateVariables
): string {
  return template.replace(
    SUPPORTED_VARIABLE_PATTERN,
    (_, key: keyof TemplateVariables) => variables[key]
  );
}
