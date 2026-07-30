export interface ArchiveImage {
  etag: string;
  id: string;
  name: string;
  size: number;
  uploadedAt: string;
}

export interface ArchiveImagePage {
  cursor: string | null;
  hasMore: boolean;
  items: ArchiveImage[];
}

export interface UploadedArchiveImage {
  item: ArchiveImage;
}
