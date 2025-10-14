export interface LhAndWellHeadOrders {
  id: number;
  supplier?: string;
  materialType?: string;
  materialNumber?: string;
  description?: string;
  plantCode?: string;
  supplierPartNumber?: string;
  poNumber?: string;
  heatNumber?: string;
  orderDate?: Date;
  wbs?: string;
  project?: string;
  unitCost?: number;
  quantity?: number;
  estimatedDeliveryDate?: Date;
  newOrderLeadTimeDays?: number;
  comments?: string;
  userId?: number;
}

