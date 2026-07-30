interface ImagePreloadJob {
  priority: boolean;
  promise: Promise<boolean>;
  resolve: (loaded: boolean) => void;
  state: 'active' | 'loaded' | 'queued';
  url: string;
}

const MAX_CONCURRENT_PRELOADS = 2;
const jobs = new Map<string, ImagePreloadJob>();
const loadedUrls = new Set<string>();
const queue: ImagePreloadJob[] = [];
let activePreloads = 0;
let preloadingPaused = false;

function promote(job: ImagePreloadJob) {
  if (job.state !== 'queued')
    return;

  const index = queue.indexOf(job);
  if (index >= 0)
    queue.splice(index, 1);
  queue.unshift(job);
  job.priority = true;
}

function runQueue() {
  if (!import.meta.client || preloadingPaused)
    return;

  while (activePreloads < MAX_CONCURRENT_PRELOADS && queue.length) {
    const job = queue.shift();
    if (!job)
      return;

    job.state = 'active';
    activePreloads += 1;

    const image = new Image();
    image.decoding = 'async';
    image.fetchPriority = job.priority ? 'high' : 'low';

    const finish = (loaded: boolean) => {
      activePreloads -= 1;
      if (loaded) {
        job.state = 'loaded';
        loadedUrls.add(job.url);
      }
      else {
        jobs.delete(job.url);
      }
      job.resolve(loaded);
      runQueue();
    };

    image.onload = () => finish(true);
    image.onerror = () => finish(false);
    image.src = job.url;
  }
}

export function isArchiveImagePreloaded(url: string) {
  return loadedUrls.has(url);
}

export function markArchiveImagePreloaded(url: string) {
  if (url)
    loadedUrls.add(url);
}

export function setArchiveImagePreloadingPaused(paused: boolean) {
  preloadingPaused = paused;
  if (!paused)
    runQueue();
}

export function preloadArchiveImage(url: string, priority = false) {
  if (!import.meta.client)
    return Promise.resolve(false);

  const existing = jobs.get(url);
  if (existing) {
    if (priority)
      promote(existing);
    runQueue();
    return existing.promise;
  }

  let resolve!: (loaded: boolean) => void;
  const promise = new Promise<boolean>((done) => {
    resolve = done;
  });
  const job: ImagePreloadJob = {
    priority,
    promise,
    resolve,
    state: 'queued',
    url,
  };

  jobs.set(url, job);
  if (priority)
    queue.unshift(job);
  else
    queue.push(job);
  runQueue();

  return promise;
}
