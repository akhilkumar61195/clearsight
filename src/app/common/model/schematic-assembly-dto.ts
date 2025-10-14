export interface SchematicAssemblyDto {
  schematicAssemblyID: number;
  schematicsID: number;
  itemNumber: number;
  stringType: string;
  zone: SectionZone;
  assemblyTypeID?: number | null;
  assemblyName: string;
  section?: SectionTypes | null;
  // sectionName?: SectionTypes | null;
  schematicsTradeName: string;
  userId: number;
  designTypeID?: number | 1;
  designType?: string;
  isDeleted?: number | 0;
  uniqueId?: number | 0;
  lengthInFt?: number | 0;
  copyAssemblyId?: number | 0;
  groupName?: string | null;
  sectionID: number;
  zoneId: number;
}

export interface SectionTypes {
  sectionId: number;
  sectionName: string
}

export interface SectionZone {
  label: string;
  value: number;
}

export interface cloneAssembly {
  cloneAssambly: string;
  section: string;
  zone: string
}