// One local media store: this module forwards to services/indexedDB.ts
// (IndexedDB "continuum_media_db"), which mediaService and mediaMigration use.
export { mediaStorage } from '$lib/services/indexedDB';
