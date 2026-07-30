export function useArchiveEvents() {
  const uploadRequest = useState('archive:upload-request', () => 0);
  const revision = useState('archive:revision', () => 0);

  function requestUpload() {
    uploadRequest.value += 1;
  }

  function notifyArchiveChanged() {
    revision.value += 1;
  }

  return {
    notifyArchiveChanged,
    requestUpload,
    revision: readonly(revision),
    uploadRequest: readonly(uploadRequest),
  };
}
