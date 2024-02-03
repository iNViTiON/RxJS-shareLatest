import { beforeEach, describe, expect, it } from '@jest/globals';
import type { Observable } from 'rxjs';
import { defer, firstValueFrom, map, tap, timer, toArray } from 'rxjs';
import { shareLatest } from './shareLatest';

describe('RxJS shareLatest operator', () => {
  let subscribeCount: number;
  let resultCount: number;
  const fetchMock: Observable<symbol> = defer(() => timer(Math.random() * 100)).pipe(
    map(() => Symbol()),
    tap({
      next: () => ++resultCount,
      subscribe: () => ++subscribeCount,
    })
  );

  beforeEach(() => {
    subscribeCount = 0;
    resultCount = 0;
  });

  it(`fetch only once`, async () => {
    // If subscriber only want single value. After the first value is cached, every new subscriber can use only that cached value.
    const sharedSource = fetchMock.pipe(shareLatest());
    const values = new Set<symbol>();
    values.add(await firstValueFrom(sharedSource));
    values.add(await firstValueFrom(sharedSource));
    await firstValueFrom(timer(200));
    values.add(await firstValueFrom(sharedSource));
    values.add(await firstValueFrom(sharedSource));
    await firstValueFrom(timer(0));

    expect(subscribeCount).toBe(1);
    expect(resultCount).toBe(1);
    expect(values.size).toBe(1);
  });

  it(`emit from cache first, then fetch the new value`, async () => {
    // If subscriber want multiple values. After the first value is cached, another will get quick value from cache first, then fetch the new value.
    const sharedSource = fetchMock.pipe(shareLatest());
    const valuesFromFirst = await firstValueFrom(sharedSource.pipe(toArray()));
    await firstValueFrom(timer(50));
    const valuesFromSecond = await firstValueFrom(sharedSource.pipe(toArray()));
    await firstValueFrom(timer(150));

    expect(subscribeCount).toBe(2);
    expect(resultCount).toBe(2);
    expect(valuesFromFirst.length).toBe(1);
    expect(valuesFromSecond.length).toBe(2);
    expect(valuesFromFirst[0]).toBe(valuesFromSecond[0]);
    expect(valuesFromFirst[0]).not.toBe(valuesFromSecond[1]);
  });

  it(`with bufferLifetime, fetch only once, except when the cache has expired`, async () => {
    // If we set bufferLifetime, the cache will expire after the specified time.
    // The new subscriber will have to wait for the new value to be fetched without using the cache.
    const sharedSource = fetchMock.pipe(shareLatest(400));
    const valueFromFirst = await firstValueFrom(sharedSource);
    await firstValueFrom(timer(50));
    const valueFromSecond = await firstValueFrom(sharedSource);
    await firstValueFrom(timer(150));

    // wait for cache to expire
    await firstValueFrom(timer(400));
    const valuesFromThird = await firstValueFrom(sharedSource.pipe(toArray()));
    await firstValueFrom(timer(0));

    expect(subscribeCount).toBe(2);
    expect(resultCount).toBe(2);
    expect(valueFromFirst).toBe(valueFromSecond);
    expect(valuesFromThird.length).toBe(1);
    expect(valueFromSecond).not.toBe(valuesFromThird[0]);
  });
});
