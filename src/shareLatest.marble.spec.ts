import { beforeEach, describe, expect, it } from '@jest/globals';
import { TestScheduler } from 'rxjs/testing';
import { shareLatest } from './shareLatest';

describe('shareLatest', () => {
  let testScheduler: TestScheduler;

  beforeEach(() => {
    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });
  });

  it('should share the latest value', () => {
    testScheduler.run(({ cold, expectObservable, expectSubscriptions }) => {
      const values = { a: 1, b: 2, c: 3 };
      const source = cold('-a---b---c-|', values);
      const sub1 = '       ^----------!';
      const subIn1 = '     ^';
      const expected1 = '  ^a---b---c-|';

      const subIn2 = '     -----^------!';
      const expected2 = '  ^----(ab)c-|';
      const subIn3 = '     ----------^-!';
      const expected3 = '  ^---------c|';
      const subIn4 = '     ------------------^';
      // subscribe after source complete
      // source were reset but buffer will serving the latest value
      const expected4 = '  ^-----------------ca---b---c-|';
      const sub4 = '       ------------------^----------!';

      const shared = source.pipe(shareLatest());

      expectObservable(shared, subIn1).toBe(expected1, values);
      expectObservable(shared, subIn2).toBe(expected2, values);
      expectObservable(shared, subIn3).toBe(expected3, values);
      expectObservable(shared, subIn4).toBe(expected4, values);
      expectSubscriptions(source.subscriptions).toBe([sub1, sub4]);
    });
  });

  // TODO: add test for bufferLifetime
});
