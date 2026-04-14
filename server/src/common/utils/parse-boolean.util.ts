/**
 * Преобразует строку (часто из `process.env` / `.env`) в `boolean`.
 * Учитываются только литералы `true` и `false` без учёта регистра; пробелы по краям обрезаются.
 * Любое другое значение приводит к ошибке — чтобы не получить «тихий» `true` от неожиданных строк.
 *
 * @example
 * parseBoolean('true')       // true
 * parseBoolean('FALSE')      // false
 * parseBoolean('  true  ')   // true
 * // parseBoolean('1')      // Error
 */
export function parseBoolean(value: string): boolean {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const lowerValue = value.trim().toLowerCase();
    if (lowerValue === 'true') {
      return true;
    }
    if (lowerValue === 'false') {
      return false;
    }
  }

  throw new Error(
    `Не удалось преобразовать значение "${value}" в логическое значение.`,
  );
}
