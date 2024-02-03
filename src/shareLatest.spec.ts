import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import type { Observable, Subscription } from 'rxjs';
import { Subject, firstValueFrom, map, tap, timer } from 'rxjs';
import { shareLatest } from './shareLatest';

describe('RxJS shareLatest operator', () => {
  let count: number;
  let subject: Subject<number>;
  let value: number | undefined;
  let randomNumber: number;
  let observable: Observable<number>;
  let subscription: Subscription;

  beforeEach(() => {
    count = 0;
    value = undefined;
    randomNumber = Math.random() * 1000;
    subject = new Subject();
    observable = subject.pipe(
      tap(() => ++count),
      map(v => v * 2),
      shareLatest()
    );
    subscription = observable.subscribe(newValue => (value = newValue));
  });

  afterEach(async () => {
    subscription?.unsubscribe();
    await firstValueFrom(timer(0));
  });

  it(`should't emit value if no value`, () => {
    expect(count).toBe(0);
  });

  it('should emit value when get new', async () => {
    expect(count).toBe(0);
    expect(value).toBeUndefined();
    subject.next(randomNumber);
    await firstValueFrom(timer(0));
    expect(count).toBe(1);
    expect(value).toBe(randomNumber * 2);
    subject.next((randomNumber = Math.random() * 1000));
    await firstValueFrom(timer(0));
    expect(count).toBe(2);
    expect(value).toBe(randomNumber * 2);
  });

  it('should emit latest value immedietly when subscribe after emit value', async () => {
    expect(count).toBe(0);
    expect(value).toBeUndefined();
    subject.next(Math.random() * 1000);
    subject.next(Math.random() * 1000);
    subject.next(Math.random() * 1000);
    subject.next((randomNumber = Math.random() * 1000));
    let another: number | undefined;
    const anotherSubscription = observable.subscribe(v => (another = v));
    await firstValueFrom(timer(0));
    anotherSubscription.unsubscribe();
    const expectOutput = randomNumber * 2;
    expect(count).toBe(4);
    expect(value).toBe(expectOutput);
    expect(another).toBe(expectOutput);
  });

  it('should do everything once even when having multiple subscribe', async () => {
    expect(count).toBe(0);
    expect(value).toBeUndefined();
    let v1: number | undefined;
    let v2: number | undefined;
    let v3: number | undefined;
    subscription.add(observable.subscribe(v => (v1 = v)));
    subscription.add(observable.subscribe(v => (v2 = v)));
    subscription.add(observable.subscribe(v => (v3 = v)));
    for (let i = 1; i <= 10; i++) {
      subject.next((randomNumber = Math.random() * 1000));
      const expectOutput = randomNumber * 2;
      // eslint-disable-next-line no-await-in-loop
      await firstValueFrom(timer(0));
      expect(count).toBe(i);
      expect(value).toBe(expectOutput);
      expect(v1).toBe(expectOutput);
      expect(v2).toBe(expectOutput);
      expect(v3).toBe(expectOutput);
    }
  });

  it(`should't do anything after all subscriber unsubscribe`, async () => {
    expect(count).toBe(0);
    expect(value).toBeUndefined();
    subject.next(Math.random() * 1000);
    subject.next(Math.random() * 1000);
    subject.next(Math.random() * 1000);
    subject.next((randomNumber = Math.random() * 1000));
    await firstValueFrom(timer(0));
    subscription.unsubscribe();
    await firstValueFrom(timer(0));
    subject.next(Math.random() * 1000);
    subject.next(Math.random() * 1000);
    subject.next(Math.random() * 1000);
    subject.next(Math.random() * 1000);
    const expectOutput = randomNumber * 2;
    await firstValueFrom(timer(0));
    expect(count).toBe(4);
    expect(value).toBe(expectOutput);
  });

  it('should emit latest value even after all old subscriber was unsubscribe', async () => {
    expect(count).toBe(0);
    expect(value).toBeUndefined();
    subject.next(Math.random() * 1000);
    subject.next(Math.random() * 1000);
    subject.next(Math.random() * 1000);
    subject.next(Math.random() * 1000);
    subject.next((randomNumber = Math.random() * 1000));
    count = 0;
    await firstValueFrom(timer(0));
    subscription.unsubscribe();
    await firstValueFrom(timer(0));
    subject.next(Math.random() * 1000);
    subject.next(Math.random() * 1000);
    subject.next(Math.random() * 1000);
    const anotherRandomNumber = Math.random() * 1000;
    subject.next(anotherRandomNumber);
    let another: number | undefined;
    const anotherSubscription = observable.subscribe(v => (another = v));
    await firstValueFrom(timer(0));
    anotherSubscription.unsubscribe();
    const expectOutput = randomNumber * 2;
    expect(count).toBe(0);
    expect(value).toBe(expectOutput);
    expect(another).not.toBe(anotherRandomNumber * 2);
    expect(another).toBe(expectOutput);
  });
});
