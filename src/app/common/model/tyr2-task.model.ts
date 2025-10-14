import { DocumentInfo } from "./Document/DocumentInfo";

export interface Ty2Tasks {
  id: number;
  wellId: number;
  supplierId: number;
  statusId: number;
  taskTypeId: number;
  // lastStatusId: number;
  lastStatusChangeDate: string;
  reportNoType: string;
  batchFrom: string;
  batchTo: string;
  wbsfrom: string;
  wbsto: string;
  slocfrom: string;
  slocto: string;
  quantity: number;
  comments: string;
  dateCompleted: string;
  md: string;
  projectFrom: string;
  daysinSubmittedStatus: number;
  daysinPendingStatus: number;
  userIdCreatedBy: number;
  dateCreated: string;
  userIdLastModifiedBy: number;
  dateLastModified: string;
  assignedTo?: number;
  wellName: string;
  supplierName: string;
  statusName?: string;
  // lastStatusName: string;
  attachment?: string;
  documents: DocumentInfo[]
}
