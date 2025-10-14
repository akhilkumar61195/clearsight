export interface BatchFileUpload {
  file?: File;
  jsonData?: string;
  userId: number;
  organizationId?: number;
  isOverride?: string;
  schematicId?: number;
  IsFirstChunk?: boolean;
  IsEndOfFile?: boolean;
  ClientId?: string;
  uploadType?: string;
  invalidThreshold?: number;
  fileName?: string;
  fileHash?: string;
  context?: any;
}


export interface BatchUpload {
  data?: string;
  userId: number;
  IsFirstChunk?: boolean;
  IsEndOfFile?: boolean;
  ClientId?: string;
  uploadType?: string;
  fileName?: string;
  fileHash: string;
  context?: any;
}