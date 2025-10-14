export class OdinAssemblyModel {
  type: string;
  vendor: string;
  assemblyNames: string;
  assemblyIds: string;
  warehouseLocation: string;
  name: string;
  description: string;
  tagIdentification: string;
  supplierPartNumber: string;
  supplierSerialNumber: string;
  length?: number; // Nullable (Optional)
  grade: string;
  project: string;
  assignedWell: string;
  wbsNumber: string;
  vendorSapNumber: string;
  unitCost?: number; // Nullable (Optional)
  equipmentCategory: string;
  chevronMmr: string;
  containedItemsTotalPrice: number;
  location: string;

  constructor(data?: Partial<OdinAssemblyModel>) {
    this.type = data?.type || '';
    this.vendor = data?.vendor || '';
    this.assemblyNames = data?.assemblyNames || '';
    this.assemblyIds = data?.assemblyIds || '';
    this.warehouseLocation = data?.warehouseLocation || '';
    this.name = data?.name || '';
    this.description = data?.description || '';
    this.tagIdentification = data?.tagIdentification || '';
    this.supplierPartNumber = data?.supplierPartNumber || '';
    this.supplierSerialNumber = data?.supplierSerialNumber || '';
    this.length = data?.length;
    this.grade = data?.grade || '';
    this.project = data?.project || '';
    this.assignedWell = data?.assignedWell || '';
    this.wbsNumber = data?.wbsNumber || '';
    this.vendorSapNumber = data?.vendorSapNumber || '';
    this.unitCost = data?.unitCost;
    this.equipmentCategory = data?.equipmentCategory || '';
    this.chevronMmr = data?.chevronMmr || '';
    this.containedItemsTotalPrice = data?.containedItemsTotalPrice;
    this.location = data?.location || '';
  }
};
