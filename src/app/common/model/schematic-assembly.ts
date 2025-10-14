export class SchematicAssembly {
  // Assembly Items
  schematicDetailID: number;
  schematicID?: number;
  sectionID?: number;
  zoneID?: number;
  itemNumber?: number;
  isInnerOuter?: string;
  assemblyTradeName?: string;
  assemblyID?: number;
  userIdCreatedBy?:string
  // Sub Items
  assemblyName:string;
  subItemNumber?: number;
  cvxCRWID?: number;
  materialNumber?: string;
  materialDescription?: string;
  lengthInFt?: number;
  specialNotes?: string;
  componentTypeName?: string;
  supplierPartNumber?:string;
  legacyRefNumber?:string;
  serialNumber?: string;
  groupName?:string;
}
