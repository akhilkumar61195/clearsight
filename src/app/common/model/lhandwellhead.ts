export interface Lhandwellhead {
  orderNumber?: string; // Optional
  productType?: string; // Optional
  supplier: string;
  materialId?: number;
  description: string;
  quantity?: string; // Optional
  shipmentForecastedQuantity?: number; // Optional
  expectedDeliveryDate?: Date; // Optional
  pricePerFoot?: string; // Optional
}
