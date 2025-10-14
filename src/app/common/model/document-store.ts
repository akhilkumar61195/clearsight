export interface DocumentStore {
  id: number;
  name?: string;
  bucketName?: string;
  prefix?: string;
}

export interface S3Files {
  key?: string;
  url?: string;
  sizeMB?: string;
  lastModified?: string;
  contentType?: string;
}
