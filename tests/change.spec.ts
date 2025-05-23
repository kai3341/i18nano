import { describe, expect, it } from 'vitest';

import * as React from 'react';
import * as renderer from 'react-test-renderer';

import { waitForSuspense } from './suspense.js';

import {
  Module,
  NOOP,
  SUSPENSE,
  TRANSLATIONS_KEYS,
  createDefaultProps,
  createTranslations,
} from './shared.js';

describe('change', () => {
  it.each([
    [TRANSLATIONS_KEYS[0], TRANSLATIONS_KEYS[0]],
    [TRANSLATIONS_KEYS[0], TRANSLATIONS_KEYS[1]],
    [TRANSLATIONS_KEYS[1], TRANSLATIONS_KEYS[0]],
    [TRANSLATIONS_KEYS[1], TRANSLATIONS_KEYS[1]],
  ])('switch lang correctly from "%s" to "%s"', async (from, to) => {
    expect.assertions(2);

    const component = renderer.create(
      React.createElement(
        Module.TranslationProvider,
        {
          language: from,
          translations: createTranslations(),
        },

        React.createElement(() => {
          const translation = Module.useTranslationChange();

          React.useEffect(() => {
            translation.change(to);
          }, []);

          return translation.lang;
        })
      )
    );

    expect(component.toJSON()).toBe(from);

    await renderer.act(NOOP);
    await waitForSuspense(NOOP);

    expect(component.toJSON()).toBe(to);
  });

  it.each([
    [
      TRANSLATIONS_KEYS[0],
      TRANSLATIONS_KEYS[0],
      [
        [TRANSLATIONS_KEYS[0], SUSPENSE],
        [TRANSLATIONS_KEYS[0], TRANSLATIONS_KEYS[0]],
        [TRANSLATIONS_KEYS[0], TRANSLATIONS_KEYS[0]],
        [TRANSLATIONS_KEYS[0], TRANSLATIONS_KEYS[0]],
      ],
    ],
    [
      TRANSLATIONS_KEYS[0],
      TRANSLATIONS_KEYS[1],
      [
        [TRANSLATIONS_KEYS[0], SUSPENSE],
        [TRANSLATIONS_KEYS[0], TRANSLATIONS_KEYS[0]],
        TRANSLATIONS_KEYS[1],
        TRANSLATIONS_KEYS[1],
      ],
    ],
    [
      TRANSLATIONS_KEYS[1],
      TRANSLATIONS_KEYS[0],
      [
        [TRANSLATIONS_KEYS[1], SUSPENSE],
        [TRANSLATIONS_KEYS[1], TRANSLATIONS_KEYS[1]],
        TRANSLATIONS_KEYS[0],
        TRANSLATIONS_KEYS[0],
      ],
    ],
    [
      TRANSLATIONS_KEYS[1],
      TRANSLATIONS_KEYS[1],
      [
        [TRANSLATIONS_KEYS[1], SUSPENSE],
        [TRANSLATIONS_KEYS[1], TRANSLATIONS_KEYS[1]],
        [TRANSLATIONS_KEYS[1], TRANSLATIONS_KEYS[1]],
        [TRANSLATIONS_KEYS[1], TRANSLATIONS_KEYS[1]],
      ],
    ],
  ])('suspend correctly from "%s" to "%s"', async (from, to, cases) => {
    expect.assertions(4);

    let change: (lang: string) => void;

    const component = renderer.create(
      React.createElement(
        Module.TranslationProvider,
        {
          language: from,

          // Prevent fallback
          fallback: 'fallback',
          translations: createTranslations(),
        },

        React.createElement(() => {
          const translation = Module.useTranslationChange();

          change = translation.change;

          return translation.lang;
        }),
        React.createElement(
          Module.Translation,
          {
            path: from,
          },
          SUSPENSE
        )
      )
    );

    expect(component.toJSON()).toStrictEqual(cases[0]);

    await renderer.act(NOOP);
    await waitForSuspense(NOOP);

    expect(component.toJSON()).toStrictEqual(cases[1]);

    await renderer.act(() => change(to));

    expect(component.toJSON()).toStrictEqual(cases[2]);

    await waitForSuspense(NOOP);

    expect(component.toJSON()).toStrictEqual(cases[3]);
  });

  it('changes side providers correctly', async () => {
    expect.assertions(4);

    let changeParent: (lang: string) => void;
    let changeLeft: (lang: string) => void;
    let changeRight: (lang: string) => void;

    const component = renderer.create(
      React.createElement(
        Module.TranslationProvider,
        createDefaultProps(),

        React.createElement(() => {
          const translation = Module.useTranslationChange();

          changeParent = translation.change;

          return translation.lang;
        }),
        React.createElement(
          Module.TranslationProvider,
          createDefaultProps(),

          React.createElement(() => {
            const translation = Module.useTranslationChange();

            changeLeft = translation.change;

            return translation.lang;
          })
        ),
        React.createElement(
          Module.TranslationProvider,
          createDefaultProps(),

          React.createElement(() => {
            const translation = Module.useTranslationChange();

            changeRight = translation.change;

            return translation.lang;
          })
        )
      )
    );

    expect(component.toJSON()).toStrictEqual([
      TRANSLATIONS_KEYS[0],
      TRANSLATIONS_KEYS[0],
      TRANSLATIONS_KEYS[0],
    ]);

    await renderer.act(() => changeLeft(TRANSLATIONS_KEYS[1]));

    expect(component.toJSON()).toStrictEqual([
      TRANSLATIONS_KEYS[1],
      TRANSLATIONS_KEYS[1],
      TRANSLATIONS_KEYS[1],
    ]);

    await renderer.act(() => changeRight(TRANSLATIONS_KEYS[0]));

    expect(component.toJSON()).toStrictEqual([
      TRANSLATIONS_KEYS[0],
      TRANSLATIONS_KEYS[0],
      TRANSLATIONS_KEYS[0],
    ]);

    await renderer.act(() => changeParent(TRANSLATIONS_KEYS[1]));

    expect(component.toJSON()).toStrictEqual([
      TRANSLATIONS_KEYS[1],
      TRANSLATIONS_KEYS[1],
      TRANSLATIONS_KEYS[1],
    ]);
  });
});
