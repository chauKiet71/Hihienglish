# Background page data

`AppDataPrefetch` mounts once above the routes. Any entry URL starts the same
read-only warmup without awaiting requests before rendering. Authentication is
resolved before account data is requested. Page components use the same cache as
the warmup, including requests still in flight.

| Data | Cache lifetime | Available to |
| --- | --- | --- |
| Active visible packages | 5 minutes | Everyone |
| Lesson access map | 5 minutes | Everyone |
| Video list and quota | 30 seconds | Current account or guest identity |
| Saved vocabulary (default library) | 1 minute | Signed-in account |
| Lesson statistics | 5 minutes | Signed-in account |

Podcast/Explore catalogs and local history already load from local application
data. Individual video transcripts, word lookups and review sessions stay on
demand. Warmup never submits uploads, creates translation jobs, generates AI
transcripts, submits reviews or creates payment orders.

Saved vocabulary search/status queries have canonical independent cache keys.
Saving, reviewing and removing a word invalidate every cached vocabulary query.
Video create/upload/delete and job polling invalidate video list/quota data.
Changing lesson access invalidates the cached access map.

Logging in/out clears account data; an invalidated in-flight response cannot put
old account data back in the cache. Aborting one vocabulary component's wait does
not cancel a shared background request. Failed requests leave the cache retryable
and never prevent unrelated warmup requests from finishing.

Run `npm run test:prefetch` for cache, startup, authentication, invalidation and
actual page consumption tests. `npx tsc -p test/prefetch/tsconfig.json --noEmit`
checks the changed data layer and consumer pages.
