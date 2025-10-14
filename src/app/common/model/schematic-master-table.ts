export interface SchematicMasterTable {
  schematicID: number | null;
  sectionID: number | null;
  sectionName: string;
  zoneID: number | null;
  type: string;
  itemNumber: number | null;
  subItemNumber: string | null;
  assemblyName: string;
  componentTypeName: string;
  materialDescription: string;
  materialNumber: string;
  supplierPartNumber: string;
  legacyRefNumber: string;
  actualOD1: string;
  actualOD2: string;
  actualOD3: string;
  actualID1: string;
  actualID2: string;
  actualID3: string;
  supplier: string;
  assemblyLengthinft: string;
  topDepthInner: number;
  topDepthOuter: number;
  designNotes: string;
  rowOrder: number;
  designType: string;
  stringType: string;
  vendorSAPNumber: string;
}

export interface DepthTable {
  schematicID: number | null;
  itemNumber: number | null;
  subItemNumber: number | null;
  topDepthInner: number;
  topDepthOuter: number;
  sectionID: number | null;
}
