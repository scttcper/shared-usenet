# @ctrl/shared-usenet

> shared types and interfaces between usenet clients

### Overview

Using the shared surface gives you:

- the same queue/history/status shapes across clients
- the same lookup methods across clients
- the same mutation return types across clients
- the same strict not-found error for normalized lookups

### Normalized Surface

Core normalized methods:

- [`getAllData()`](#getalldata)
- [`getQueue()`](#getqueue)
- [`getHistory()`](#gethistory)
- [`getQueueJob(id)`](#getqueuejobid)
- [`getHistoryJob(id)`](#gethistoryjobid)
- [`findJob(id)`](#findjobid)
- [`pauseQueue()` / `resumeQueue()`](#pausequeue--resumequeue)
- [`pauseJob(id)` / `resumeJob(id)`](#pausejobid--resumejobid)
- [`removeJob(id, removeData?)`](#removejobid-removedata)
- [`moveJob(id, position)`](#movejobid-position)
- [`setCategory(id, category)`](#setcategoryid-category)
- [`setPriority(id, priority)`](#setpriorityid-priority)
- [`addNzbFile(nzb, options?)`](#addnzbfilenzb-options)
- [`addNzbUrl(url, options?)`](#addnzburlurl-options)
- [`normalizedAddNzb(input, options?)`](#normalizedaddnzbinput-options)

Normalized behavior:

- queue control methods resolve to `boolean`
- `addNzbFile` and `addNzbUrl` resolve to a normalized queue id `string`
- `getQueueJob` and `getHistoryJob` throw `UsenetNotFoundError` when missing
- `findJob` returns `{ source, job }` or `null`

### Example

The same normalized code works with either client:

```ts
import { UsenetPriority } from '@ctrl/shared-usenet';
import { Sabnzbd } from '@ctrl/sabnzbd';
// import { Nzbget } from '@ctrl/nzbget';

const client = new Sabnzbd({
  baseUrl: 'http://localhost:8080/',
  apiKey: 'api-key',
});

async function main() {
  const id = await client.addNzbUrl('https://example.test/release.nzb', {
    category: 'movies',
    priority: UsenetPriority.high,
  });

  const job = await client.getQueueJob(id);
  console.log(job.state, job.progress);
}
```

Swap the client construction and keep the rest of the flow the same.

### Normalized Methods

#### `getAllData()`

Returns queue, history, categories, scripts, and status in one normalized payload.
It is the broadest normalized read and usually the best fit for dashboards or initial page loads. If you only need one slice of data, the narrower reads are usually cheaper and easier to reason about.

#### `getQueue()`

Returns the active queue as `NormalizedUsenetJob[]`.
This is the straightforward read for active jobs and is usually the right choice when you do not need the rest of the downloader state.

#### `getHistory()`

Returns completed, failed, or deleted jobs as `NormalizedUsenetHistoryItem[]`.
This is the history-side equivalent to `getQueue()`. It keeps finished-job reads separate from active queue reads so callers do not have to fetch both by default.

#### `getQueueJob(id)`

Looks up one active queue item and returns a `NormalizedUsenetJob`.
This is the strict queue lookup. If the id is missing it throws `UsenetNotFoundError`, which makes it useful when a missing job is genuinely exceptional.

#### `getHistoryJob(id)`

Looks up one history item and returns a `NormalizedUsenetHistoryItem`.
This is the strict history lookup. It has the same error behavior as `getQueueJob(id)`, just against the history side instead of the active queue.

#### `findJob(id)`

Searches queue first, then history, and returns `{ source, job }` or `null`.
This is the convenience lookup when you do not know whether a job is still active or already finished. It can be a little more expensive than `getQueueJob(id)` or `getHistoryJob(id)` because it may need to check more than one source, so it is best used when that ambiguity is real.

#### `pauseQueue()` / `resumeQueue()`

Pause or resume the download queue.
These are the normalized client-wide queue controls and resolve to `boolean` across implementations.

#### `pauseJob(id)` / `resumeJob(id)`

Pause or resume a specific active queue item.
These are the per-job versions of the queue controls. They assume the id still refers to an active queue item.

#### `removeJob(id, removeData?)`

Remove an active queue item, optionally deleting downloaded data too.
This keeps removal behavior aligned across clients. The `removeData` flag is worth treating carefully because it changes whether client data is deleted, not just whether the queue entry disappears.

#### `moveJob(id, position)`

Move an active queue item to a specific queue position.
This gives you one normalized way to reorder the active queue. Like the other queue mutation methods, it assumes the job is still active.

#### `setCategory(id, category)`

Assign a normalized category name to an active queue item.
This is mainly useful when your automation or UI already works in normalized category names and should not need to care how a given client stores them internally.

#### `setPriority(id, priority)`

Assign a normalized `UsenetPriority` to an active queue item.
This is one of the clearest normalization wins in the suite because callers never need to deal with client-specific numeric priority scales.

#### `addNzbFile(nzb, options?)`

Adds an NZB from file content and returns the normalized queue id as a `string`.
This is the simpler add path when you already have NZB content locally. It is a good fit when you only need the created id and do not need to immediately reload the normalized job.

#### `addNzbUrl(url, options?)`

Adds an NZB by URL and returns the normalized queue id as a `string`.
This is the URL-based version of `addNzbFile(...)`. It has the same normalized return shape and is the lighter option when an id is enough.

#### `normalizedAddNzb(input, options?)`

Adds an NZB from either a URL or file and returns the created `NormalizedUsenetJob`.
This is the higher-level add helper. It is useful when you want the created normalized queue item immediately and do not want to do a separate follow-up lookup yourself. It is more expensive than `addNzbFile(...)` or `addNzbUrl(...)` because it adds first and then polls the queue to load the created job.

Key normalized concepts:

- explicit lookup methods: `getQueueJob`, `getHistoryJob`, `findJob`
- normalized queue/history/status payloads
- normalized mutation return types: booleans for control operations, string ids for add operations
- normalized not-found errors via `UsenetNotFoundError` for strict lookup methods
- normalized state labels via `UsenetStateMessage`
- semantic post-processing options via `UsenetPostProcess`
- normalized post-processing script field via `postProcessScript`
- raw client payloads kept in `raw` as `unknown`

#### Normalized Usenet Clients

- sabnzbd - `@ctrl/sabnzbd`
- nzbget - `@ctrl/nzbget`
