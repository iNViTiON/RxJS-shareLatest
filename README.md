# RxJS-shareLatest
An RxJS operator designed to limit source invocation and guarantee a swift initial response.

This operator enables the sharing of a source observable across all subscribers, caching and immediately emitting any values to new subscribers unless the cache has expired. Should the source observable complete, behavior varies based on subscriber needs: single-value subscribers receive only the cached value without re-subscribing the source, while multi-value subscribers get both the cached value and future emissions upon source re-subscribe.

Examples of shareLatest can be found in the unit-test file.