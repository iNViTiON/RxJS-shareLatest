import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import { BehaviorSubject, firstValueFrom, map, Observable, of, pipe, Subject, Subscription, tap, timeout, timer } from 'rxjs';
import { shareLatest } from './shareLatest';

describe('RxJS shareLatest operator with bufferLifetime', () => {
  let count: number;
  let subject: Subject<number>;
  let value: number | undefined;
  let randomNumber: number;
  let observable: Observable<number>;
  let subscription: Subscription;
  let bufferReset: BehaviorSubject<boolean>;

  beforeEach(() => {
    count = 0;
    value = undefined;
    randomNumber = Math.random() * 1000;
    subject = new Subject();
    bufferReset = new BehaviorSubject(false);
    observable = subject.pipe(
      tap(() => ++count),
      map(v => v * 2),
      shareLatest(undefined, bufferReset),
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
    bufferReset.next(true);
    value2 = await firstValueFrom(observable.pipe(timeoutWithMagic));
    expect(count).toBe(1);
    expect(value2).toBe(InvSqrtMagic);

    // buffer should reset just one time
    subject.next(randomNumber);
    value2 = await firstValueFrom(observable.pipe(timeoutWithMagic));
    expect(count).toBe(2);
    expect(value2).toBe(randomNumber * 2);
    value2 = await firstValueFrom(observable.pipe(timeoutWithMagic));
    expect(count).toBe(2);
    expect(value2).toBe(randomNumber * 2);
    await firstValueFrom(timer(0));
    bufferReset.next(true);
    await firstValueFrom(timer(0));
    value2 = await firstValueFrom(observable.pipe(timeoutWithMagic));
    expect(count).toBe(2);
    expect(value2).toBe(InvSqrtMagic);
    subject.next(randomNumber);
    value2 = await firstValueFrom(observable.pipe(timeoutWithMagic));
    expect(count).toBe(3);
    expect(value2).toBe(randomNumber * 2);
  });
});
