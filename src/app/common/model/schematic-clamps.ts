export interface SchematicClamps {
  id: number;
  schematicId?: number;
  materialKey?: string;
  materialNumber?: string;
  manufacturerPart?: string;
  halliburtonPart?: string;
  primaryDemand?: number;
  totalQty?: number;
  contingencyDemand?: number;
  userId?: number;
  isValid: boolean;
  details?: string;
  type?: string;
  isDeleted?: boolean;
  unitCost?:number;
 asBuiltQuantity?:number;
 consumptionValue?:number;
}