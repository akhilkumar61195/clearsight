export interface MitiUpdate {
  id: number;
  contract?: string;
  mitisoNo?: string;
  description?: string;
  cvxPo?: string;
  project?: string;
  cvxEngineer?: string;
  well?: string;
  wbs?: string;
  cvxMm?: string;
  soonerSo?: string;
  lineNumber?: number;
  comm?: string;
  grade?: string;
  odIn?: number;
  wtIn?: number;
  wtLbsPerFt?: number;
  lengthFt?: string;
  end?: string;
  quantityFt?: number;
  quantityPc?: number;
  cvxRequiredDeliveryMonthYear?: string;
  partial?: string;
  vessel?: string;
  etd?: string; // Use string to handle date formatting
  eta?: string; // Use string to handle date formatting
  deliveryDate?: string;
  receivingReport?: string;
  status?: string;
  sopriceMatOnly?: number;
  supplier?: string;
  dateLastModified?: string; // Use string to handle date formatting
  userIdModifiedBy?: number;
}