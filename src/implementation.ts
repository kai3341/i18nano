import type { FC, FCC } from './react.js';
import type {
  TranslationChange,
  TranslationFunction,
  TranslationProps,
  TranslationProviderProps,
  TranslationValues,
} from './types.js';

import { React, useContext } from './react.js';

import { EMPTY, PLAIN } from './const.js';
import { invoke, noop, notranslate } from './utils.js';
import { cached, suspend } from './suspend.js';
import { interpolate } from './interpolate.js';

export const TranslationContext =
  React.createContext<TranslationFunction>(notranslate);
export const TranslationChangeContext = React.createContext<TranslationChange>({
  all: [],
  lang: EMPTY,
  change: noop,
  preload: noop,
});

export const TranslationProvider: FCC<TranslationProviderProps> = ({
  language = EMPTY,
  preloadLanguage = true,

  fallback = language,
  preloadFallback = false,

  translations,

  transition = false,

  children,
}) => {
  const parentTranslate = useContext(TranslationContext);
  const parentTranslateChange = useContext(TranslationChangeContext);

  const parentLanguage = parentTranslateChange.lang;
  const hasParentLanguage = parentLanguage.length > 0;

  const initialLanguage = hasParentLanguage ? parentLanguage : language;

  /**
   * Two states are needed depending on usage:
   * - `lang` for transition feature
   * - `current` for immediate update
   */
  const [lang, setLanguage] = React.useState(initialLanguage);
  const [current, setCurrent] = React.useState(initialLanguage);

  const withTransition = transition ? React.startTransition : invoke;

  const preload = (next: string) => {
    if (next in translations) cached(translations[next]);
  };

  const preloadRecursive = (next: string) => {
    preload(next);
    parentTranslateChange.preload(next);
  };

  if (preloadLanguage) preload(current);
  if (preloadFallback) preload(fallback);

  const change = (next: string) => {
    if (next in translations) {
      setCurrent(next);
      withTransition(() => setLanguage(next));
    }
  };

  const changeRecursive = (next: string) => {
    change(next);
    parentTranslateChange.change(next);
  };

  if (hasParentLanguage && current !== parentLanguage) change(parentLanguage);

  const translate: TranslationFunction = (path, values = PLAIN) => {
    let result;

    if (
      lang in translations &&
      (result = interpolate(path, values, suspend(translations[lang]))) !==
        undefined
    )
      return result;

    if (
      lang !== fallback &&
      fallback in translations &&
      (result = interpolate(path, values, suspend(translations[fallback]))) !==
        undefined
    )
      return result;

    if ((result = parentTranslate(path, values)) !== undefined) return result;

    return EMPTY;
  };

  const TranslationContextProps = React.useMemo(
    () => ({ value: translate }),
    [lang]
  );

  const TranslationChangeContextProps = React.useMemo(
    () => ({
      value: {
        all: Object.keys(translations),
        lang: current,
        change: changeRecursive,
        preload: preloadRecursive,
      },
    }),
    [current]
  );

  return React.createElement(
    TranslationChangeContext.Provider,
    TranslationChangeContextProps,
    React.createElement(
      TranslationContext.Provider,
      TranslationContextProps,
      children
    )
  );
};

/**
 * Note: you need to wrap your component in Suspense
 *
 * @see https://reactjs.org/docs/concurrent-mode-suspense.html
 */
export const useTranslation = () => useContext(TranslationContext);

export const useTranslationChange = () => useContext(TranslationChangeContext);

/**
 * Use only if you want to wrap your own Suspense
 *
 * @param props.path - translation property path like `header.title.text`
 * @param props.values - for mustache templates
 *
 * @see {@link Translation}
 */
// @ts-expect-error DefinitelyTyped issue
export const TranslationRender: FC<TranslationProps> = React.memo(
  ({ path, values = PLAIN }) => {
    const translate = useTranslation();

    return translate(path, values);
  }
);

/**
 * Recommended way to use i18nano
 *
 * @param props.children - fallback ReactElement, for example loader or skeleton
 * @param props.path - translation property path like `header.title.text`
 * @param props.values - for mustache templates
 *
 * @see {@link TranslationRender}
 */
export const Translation: FCC<TranslationProps> = ({
  children,
  path,
  values = PLAIN,
}) => {
  return React.createElement(
    React.Suspense,
    { fallback: children },
    React.createElement(TranslationRender, { path, values })
  );
};
