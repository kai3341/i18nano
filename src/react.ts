import * as React from 'react';
export { React };

type PropsWithChildren<P> = P & { children?: React.ReactNode | undefined };

export type FC<P> = (props: P) => React.ReactElement<any, any>;
export type FCC<P> = (
  props: PropsWithChildren<P>
) => React.ReactElement<any, any>;

// TODO: remove when types are updated
type ReactUsePromise<T> = PromiseLike<T> & {
  status?: 'pending' | 'fulfilled' | 'rejected';
  value?: T;
  reason?: unknown;
};

const inline = (str: string) => str.toString();
const ReactNextUse = (React as any)[inline('use')];
const ReactNextPromise = ReactNextUse as <T>(promise: ReactUsePromise<T>) => T;
const ReactNextContext = ReactNextUse as <T>(context: React.Context<T>) => T;

const enum STATUS {
  PENDING = 'pending',
  FULFILLED = 'fulfilled',
  REJECTED = 'rejected',
}

// Polyfill for `React.use` with promise
// It is cached, so it acts like the original
export const use =
  ReactNextPromise ||
  ((promise) => {
    if (promise.status === STATUS.FULFILLED) return promise.value;
    if (promise.status === STATUS.REJECTED) throw promise.reason;
    if (promise.status === STATUS.PENDING) throw promise;

    // WAT? 0_o
    promise.status = STATUS.PENDING;
    promise.then(
      (value) => {
        promise.status = STATUS.FULFILLED;
        promise.value = value;
      },
      (ex) => {
        promise.status = STATUS.REJECTED;
        promise.reason = ex;
      }
    );

    throw promise;
  });

// Allow component-free use
export const useContext = ReactNextContext || React.useContext;
