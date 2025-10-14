export interface Valluorec {
  productType?: string; // Optional
  materialId?: number;
  description: string;
  quantity?: string; // Optional
  orderComments?: string; // Optional
  orderStatus?: string; // Optional
  shipmentForecastedQuantity?: number; // Optional
  expectedDeliveryDate?: Date; // Optional
  connection?: string; // Optional
  pricePerFoot?: string; // Optional
  isEdited?: boolean; // Optional, to indicate if the row has been edited
}
