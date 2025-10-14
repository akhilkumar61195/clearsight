 export interface WhatIfCol {
  field: string;
  header: string;
  width: string;
  headerColor: string;
  isEditable: boolean;
  isFrozenColumn?: boolean;
  display?: string;
  left?: string;
  textColor?: string;
  sortable?: boolean;
}
export interface WhatIfRow {
  id?: number;
  wellName?: string;
  rig?: string;
  p10StartDate?: Date | string;
  p50StartDate?: Date | string;
  includeOrExclude?: string;
  duplicated?: string;
  [key: string]: any; // 👈 keep this only for grid flexibility
}