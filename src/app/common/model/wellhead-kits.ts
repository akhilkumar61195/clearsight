export interface WellheadKits {
  id: number;
  kitType?: string;
  userId?: number;
  isDeleted?: number;
}

export interface WellheadKitComponents {
  id: number;
  kitTypeId?: number;
  kitType?: string;
  qty?: number;
  materialKey?: number;
  materialId?: string;
  materialShortDesc?: string;
  manufacturerNum?: string;
  isDeleted?: number;
  userId?: number;
  isUpdated: boolean;
  uniqueIdentifier: string;
}

