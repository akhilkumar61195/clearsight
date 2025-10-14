import { SchematicAssemblyDto } from "./schematic-assembly-dto";

export interface SchematicDetailDto {
  schematicsDetailID: number;
  schematicAssemblyID: number;
  schematicsID: number;
  cvX_CRW_ID?: number | null;
  componentTypeName: string;
  materialNumber: string;
  assemblyLengthinft?: number | null;
  schematicsNotes: string;
  schematicsDetailDescription: string;
  itemNumber: number;
  subItemNumber: string;
  userId: string;
  sectionID?: number | null;
  isDeleted?: number | 0;
  copyComponentId?: number | 0;
  zoneID?: number | 0;
  designType?: string | null;
  designTypeID?: number | 0;
  supplierPartNumber?: string | null;
  legacyRefNumber?: string | null;
  serialNumber?: string | null;
  uniqueId?: number | null;
  groupName?:string|null;
  vendorSAPNumber?:string|null;
}

export interface SchematicsRequest {
  AssemblyDtos: SchematicAssemblyDto[];
  DetailDtos: SchematicDetailDto[];
}
