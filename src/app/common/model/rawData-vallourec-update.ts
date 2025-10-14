export interface UpdateVallourec {
  id: number;
  materialId?: string;
  productType?: string;
  orderQty?: number;
  orderComments?: string;
  orderStatus?: string;
  shipmentForeCastQty: number;
  expectedDeliveryDate?: string;
  connection?: string;
  pricePerFoot: number;
  longDescription?: string;
  userIdModifiedBy: number;
}
