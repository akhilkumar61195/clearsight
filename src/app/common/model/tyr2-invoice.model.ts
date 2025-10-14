import { DocumentInfo } from "./Document/DocumentInfo";

export interface Tyr2Invoice {
	id: number;
	wellId: number;
	supplierId: number;
	statusId: number;
	assignTo: number;
	projectId: number;
	rigId: number;
	reasonCodeId: number;
	buId: number;
	sender: string;
	invoiceNumber: string;
	comments: string;
	userIdCreatedBy: number;
	userIdLastModifiedBy: number;
	lastStatusUpdated: string;
	dateCreated: string;
	dateLastModified: string;
	isDeleted: number;
	isThresholdReached: boolean;
	wellName: string;
	supplierName: string;
	statusName: string;
	rigName: string;
	reasonCodeValue: string;
	buValue: string;
	projectValue: string;
    documents: DocumentInfo[];
}
