import type { BehaviorSubject, MonoTypeOperatorFunction, Observable } from 'rxjs';
import { EMPTY, asapScheduler, filter, ignoreElements, observeOn, share, takeUntil, tap, timer } from 'rxjs';
import { ReuseSubject } from './reuseSubject';

export function shareLatest<T>(bufferLifetime?: number, bufferReset?: BehaviorSubject<boolean>): MonoTypeOperatorFunction<T> {
  let previousBuffer: (number | T)[] = [];
  let subject: ReuseSubject<T>;
  const connector = (): ReuseSubject<T> => subject = new ReuseSubject<T>((bufferReset?.value && (previousBuffer.length = 0), previousBuffer), bufferLifetime);
  const resetBufferIfNeeded = () => bufferReset?.value && (subject.resetBuffer(), bufferReset.next(false));
  return (source$: Observable<T>) =>
    source$.pipe(
      observeOn(asapScheduler),
      takeUntil(bufferReset?.asObservable().pipe(
        filter(reset => reset),
        // Reset the buffer when the reset observable emits `true`.
        tap(() => resetBufferIfNeeded()),
        // Ignore all emissions from the reset observable to prevent it from completing the source.
        // This make takeUntil sit here as a noop but just manage subscriber for reset observable.
        ignoreElements(),
      ) ?? EMPTY),
      share({
        connector,
        resetOnComplete: true,
        resetOnError: true,
        resetOnRefCountZero: () => timer(bufferLifetime ?? 0),
      }),
      tap(bufferReset ? { subscribe: resetBufferIfNeeded } : {}),
    );
}
