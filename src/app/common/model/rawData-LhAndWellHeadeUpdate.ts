export interface LHAndWellHeadUpdate {
  id: number;
  supplier?: string;
  materialType?: string;
  materialNumber?: string;
  description?: string;
  plantCode?: string;
  supplierPartNumber?: string;
  poNumber?: string;
  heatNumber?: string;
  orderDate?: string | Date;
  wbs?: string;
  project?: string;
  unitCost?: number;
  quantity?: number;
  estimatedDeliveryDate?: string | Date;
  newOrderLeadTimeDays?: number;
  comments?: string;
  userId?: number;
}