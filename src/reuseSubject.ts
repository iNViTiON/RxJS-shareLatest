import { ReplaySubject } from 'rxjs';

/**
 * A variant of ReplaySubject that does not reset its buffer when it completes.
 * This is useful for sharing a stream that may complete, but you still want to
 * replay the last value.
 * @see {@link ReplaySubject}
 * @see {@link shareReplay}
 * @class ReuseSubject
 * @extends {ReplaySubject<T>}
 */
export class ReuseSubject<T> extends ReplaySubject<T> {
  /**
   * @param __buffer A buffer to use instead of the default buffer.
   * @param _windowTime The amount of time the buffered items will stay buffered
   * @param _timestampProvider An object with a `now()` method that provides the current timestamp. This is used to
   * calculate the amount of time something has been buffered.
   */
  constructor(
    __buffer: (T | number)[] = [],
    _windowTime = Infinity,
    _timestampProvider?: ConstructorParameters<typeof ReplaySubject<T>>[2],
  ) {
    super(1, _windowTime, _timestampProvider);
    this['_buffer'] = __buffer;
  }

  public getBuffer = (): (T | number)[] => (this['_buffer'] as (T | number)[]).slice();

  public resetBuffer = (): void => void (this['_buffer'].length = 0);
}
