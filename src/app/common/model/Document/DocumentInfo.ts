export interface DocumentInfo {
  id?: number;
  userIdCreatedBy?: number;
  userIdLastModifiedBy?: number;
  documentTypeId?: number;
  entityId?: string;
  shortDescription?: string;
  contentType?: string;
  url?: string;
  functionId?: number;
  appId?: number;
  folderName?:string;
}
