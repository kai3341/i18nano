import { EMPTY } from './const';
import { lookup } from './lookup';
import type { TranslationValues } from './types';

/**
 * @param path - property path like 'a.b.c'
 * @param values - object for mustache templates
 * @param source - object translation dictionary
 * @returns string from values if found otherwise undefined
 */
export const interpolate = (
  path: string,
  values: TranslationValues,
  source: TranslationValues
) => {
  const template = lookup(path, source);
  if (template === undefined) return;

  return template.replace(/{{(.+?)}}/g, (_, key) => {
    let result;

    if ((result = lookup(key, values)) !== undefined) return result;
    if ((result = lookup(key, source)) !== undefined) return result;

    return EMPTY;
  });
};
