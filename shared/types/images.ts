export type ArchiveSortOrder = 'asc' | 'desc';

export interface ArchiveImage {
  etag: string;
  /** Intrinsic height in pixels, or `null` for legacy uploads without stored dimensions. */
  height: number | null;
  id: string;
  name: string;
  size: number;
  uploadedAt: string;
  /** Intrinsic width in pixels, or `null` for legacy uploads without stored dimensions. */
  width: number | null;
}

export interface ArchiveImagePage {
  cursor: string | null;
  hasMore: boolean;
  items: ArchiveImage[];
  total: number;
  totalSize: number;
}

export interface UploadedArchiveImage {
  item: ArchiveImage;
}
