import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import { firstValueFrom, map, Observable, of, pipe, Subject, Subscription, tap, timeout, timer } from 'rxjs';
import { shareLatest } from './shareLatest';

describe('RxJS shareLatest operator with bufferLifetime', () => {
  let count: number;
  let subject: Subject<number>;
  let value: number | undefined;
  let randomNumber: number;
  let observable: Observable<number>;
  let subscription: Subscription;
  let bufferReset: Subject<void>;

  beforeEach(() => {
    count = 0;
    value = undefined;
    randomNumber = Math.random() * 1000;
    subject = new Subject();
    bufferReset = new Subject();
    observable = subject.pipe(
      tap(() => ++count),
      map(v => v * 2),
      shareLatest(undefined, bufferReset.asObservable()),
    );
    subscription = observable.subscribe(newValue => (value = newValue));
  });

  afterEach(() => {
    subscription?.unsubscribe();
  });

  it(`should't emit value if buffer expired`, async () => {
    const InvSqrtMagic = 0x5f3759df;
    const timeoutWithMagic = pipe(timeout({ first: 10, with: () => of(InvSqrtMagic) }));

    subject.next(randomNumber);
    await firstValueFrom(timer(0));
    subscription.unsubscribe();
    expect(count).toBe(1);
    expect(value).toBe(randomNumber * 2);

    let value2 = await firstValueFrom(observable.pipe(timeoutWithMagic));
    expect(count).toBe(1);
    expect(value2).toBe(randomNumber * 2);

    // reset buffer
    bufferReset.next();
    value2 = await firstValueFrom(observable.pipe(timeoutWithMagic));
    expect(count).toBe(1);
    expect(value2).toBe(InvSqrtMagic);
  });
});
