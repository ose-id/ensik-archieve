import type { ArchiveImage } from '~~/shared/types/images';

export type ArchiveChange
  = | { type: 'added'; image: ArchiveImage }
    | { type: 'removed'; id: string };

type ArchiveChangeListener = (change: ArchiveChange) => void;

/**
 * The shared file input rendered by ImageUpload. The mobile upload button is a
 * `<label for>` pointing at it, so the native picker opens straight from the tap.
 */
export const ARCHIVE_UPLOAD_INPUT_ID = 'archive-upload-input';

const listeners = new Set<ArchiveChangeListener>();

export function useArchiveEvents() {
  const uploadRequest = useState('archive:upload-request', () => 0);

  function requestUpload() {
    uploadRequest.value += 1;
  }

  function notifyArchiveChanged(change: ArchiveChange) {
    for (const listener of listeners)
      listener(change);
  }

  /** Subscribes for the lifetime of the current scope. No-op during SSR, where nothing is emitted. */
  function onArchiveChanged(listener: ArchiveChangeListener) {
    if (!import.meta.client)
      return;

    listeners.add(listener);
    onScopeDispose(() => listeners.delete(listener), true);
  }

  return {
    notifyArchiveChanged,
    onArchiveChanged,
    requestUpload,
    uploadRequest: readonly(uploadRequest),
  };
}
