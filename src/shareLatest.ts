import type { MonoTypeOperatorFunction, Observable } from 'rxjs';
import { EMPTY, asapScheduler, ignoreElements, observeOn, share, takeUntil, tap, timer } from 'rxjs';
import { ReuseSubject } from './reuseSubject';

export function shareLatest<T>(bufferLifetime?: number, bufferReset?: Observable<unknown>): MonoTypeOperatorFunction<T> {
  let previousBuffer: (number | T)[]
  let subject: ReuseSubject<T>;
  const connector = (): ReuseSubject<T> => subject = new ReuseSubject<T>(previousBuffer, bufferLifetime);
  return (source$: Observable<T>) =>
    source$.pipe(
      observeOn(asapScheduler),
      takeUntil(bufferReset?.pipe(
        // Reset the buffer when the lifetime observable emits.
        tap(() => subject.resetBuffer()),
        // Ignore all emissions from the lifetime observable to prevent it from completing the source.
        // This make takeUntil sit here as a noop but just manage subscriber for bufferLifetimeObs.
        ignoreElements(),
      ) ?? EMPTY),
      share({
        connector,
        resetOnComplete: true,
        resetOnError: true,
        resetOnRefCountZero: () => (previousBuffer = subject.getBuffer(), timer(bufferLifetime ?? 0)),
      })
    );
}
