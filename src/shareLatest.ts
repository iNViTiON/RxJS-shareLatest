import type { MonoTypeOperatorFunction, Observable } from 'rxjs';
import { asapScheduler, observeOn, share, timer } from 'rxjs';
import { ReuseSubject } from './reuseSubject';

export function shareLatest<T>(bufferLifetime?: number): MonoTypeOperatorFunction<T> {
  let previousBuffer: (number | T)[]
  let subject: ReuseSubject<T>;
  const connector = (): ReuseSubject<T> => subject = new ReuseSubject<T>(previousBuffer, bufferLifetime);
  return (source$: Observable<T>) =>
    source$.pipe(
      observeOn(asapScheduler),
      share({
        connector,
        resetOnComplete: true,
        resetOnError: true,
        resetOnRefCountZero: () => (previousBuffer = subject.getBuffer(), timer(bufferLifetime ?? 0)),
      })
    );
}
