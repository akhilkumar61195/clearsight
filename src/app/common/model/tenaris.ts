export interface Tenaris {
  materialId?: number;
  description: string;
  transactionType: string;  
  quantity?: string; // Optional
  expectedDeliveryDate?: Date; // Optional  
}
