import type { TranslationValues } from './types.js';

import { plain } from './utils.js';

/**
 * @param path - property path like 'a.b.c'
 * @param values - object for mustache templates
 * @returns string from values if found otherwise undefined
 */
export const lookup = (
  path: string | number,
  values: TranslationValues
): string | undefined => {
  let key = String(path);
  let inner;

  if (key in values) {
    if (typeof (inner = values[key as any]) === 'string') return inner;

    return;
  }

  if (plain(values)) return;

  const parts = key.split('.');

  for (
    let i = 0, length = parts.length;
    i < length && typeof values === 'object';
    ++i
  ) {
    key = parts[i];

    if (key in values) {
      if (typeof (inner = values[key as any]) === 'string') return inner;

      values = inner;
    }
  }
};
