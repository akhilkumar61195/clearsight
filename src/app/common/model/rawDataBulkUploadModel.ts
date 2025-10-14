export interface RawDataUpload{
    materialId:Number,
    description:string,
    transactionType:string
    expectedDeliveryDate:Date,
    quantity:string,
    addtoStartingInventory:string,
    wellNumber:string,
    supplier:string,
    productType:string,
    orderComments:string,
    orderStatus:string,
    shipmentForecastedQuantity:number,
    connection:string,
    pricePerFoot:string,
    orderNumber:string
}
export interface TenarisUpload{
    materialId:string,
    transactionType:string
    expectedDeliveryDate:Date,
    quantity:string,
    description:string,
    userIdCreatedBy:number;
    unitPrice:number;
}

export interface VallourecUpload{
    materialId:number,
    productType:string,
    orderQty:number,
    orderComments:string,
    orderStatus:string,
    shipmentForeCastQty:number,
    expectedDeliveryDate:Date,
    connection:string,
    pricePerFoot:number,
    userIdCreatedBy:number,
    longDescription:string
}

export interface LhAndWellHeadUpload{
    supplier :string,
    materialType :string
    materialNumber:string	
    description:string
    plantCode :string	
    supplierPartNumber:string
    pONumber : string	
    heatNumber:string
    orderDate :Date
    wBS:string
    project:string
    unitCost: number
    quantity:number	
    estimatedDeliveryDate: Date
    newOrderLeadTimeDays :number
    comments:string
    userIdCreatedBy:number
}

export interface InventoryUpload {
  id:number;
  inventoryItemId: string;
  oldInventoryItemId: string;
  sourceSystem: string;
  originalSourceSystem: string;
  businessUnitId: string;
  plantCode: string;
  plantName: string;
  storageLocationDesc: string;
  storageLocationCode: string;
  storageBin: string;
  batch: string;
  wbsElementId: string;
  wbsElementDesc: string;
  asset: string;
  category2Bucket: string;
  category1Asset: string;
  materialId: string;
  serialNumber: string;
  oldMaterialNumber: string;
  materialType: string;
  materialShortDesc: string;
  materialLongDesc: string;
  manufacturingPartNumber: string;
  tier: string;
  od: number;
  wallThickness: number;
  weight: string;
  grade: string;
  connection: string;
  sourService: string;
  uoM: string;
  aUoM: string;
  materialCondition: string;
  enterpriseCategory: string;
  segment: string;
  family: string;
  class: string;
  mrpType: string;
  mrpArea: string;
  mrpTypeAtMrpArea: string;
  mrpTypeAtPlant: string;
  purchaseGroup: string;
  externalMaterialGroup: string;
  materialGroup: string;
  criticalCode: string;
  criticalFlag: string;
  critical: string;
  materialStatus: string;
  valuationType: string;
  specialStockType: string;
  jointVenture: string;
  maxQuantity: number;
  minQuantity: number;
  onHandQuantity: number;
  blockQuantity: number;
  aUoMQuantity: number;
  totalQuantity: number;
  unitPriceLocal: number;
  unitPriceUsd: number;
  amountLocal: number;
  amountUsd: number;
  valuatedAmountUsd: number;
  valuatedAmountLocal: number;
  netBookValue: number;
  openPoQuantity: number;
  openPoValue: number;
  leadTime: number;
  forecastQuantity: number;
  nonMovingLastIssueDate: Date;
  ageingCalculationDate: Date;
  lastUsedDateByBu: Date;
  lastUsedDateByPlant: Date;
  lastMovementDateByPlant: Date;
  assemblyId: string;
  itemType: string;
  supplier: string;
  supplierPartNumber: string;
  vendor: string;
  expectedDate: Date;
  manufacturer: string;
  manufacturerDate: Date;
  size: string;
  length: number;
  documentNumber: string;
  documentLineNumber: string;
  commodityCode: string;
  commodityCodeDesc: string;
  demandFlag: string;
  moveQuantity: number;
  costCenterId: string;
  costCenterName: string;
  surplusFlag: string;
  hashDiff: string;
  deleted: boolean;
  createdTs: Date;
  lastUpdatedTs: Date;
  transferOpportunityFlag: string;
  derivedLastMovementDate: Date;
  ageTimeBucket: string;
  ageByMovementInMonths: number;    
  materialAgeInMonths: number;
  lastUsedByBuInMonths: number;
  proposedStatus: string;
  proposedReason: string;
  investmentRecoveryStatus: string;
  orgFunction: string;
  ageTimeBucketSort: string;
  crateId: string;
  crateName: string;
  tagId: string;
  ageingDate: Date;
  lastUsedDate: Date;
  ageingMovementType: string;
  lastUsedMovementType: string;
  ageingTimeFrame: string;
  lastUsedTimeFrame: string;
  lastMovementTimeFrame: string;
  valuationClass: string;
  mmrLevel1Category: string;
  mmrLevel2Category: string;
  mmrLevel3Category: string;
  chevronMmr: string;
  connectionConfiguration: string;
  qualityPlan: string;
  readyForServiceDate: string;
  userIdCreatedBy:number;
}

export interface MitiUpload {
  contract: string;
  mitiSoNo: string;
  suppplier:string;
  description: string;
  cvxPo: string;
  project: string;
  cvxEngineer: string;
  well: string;
  wbs: string;
  cvxMM: string;
  soonerSNNo: string;
  lineNumber: number;
  comm: string;
  grade: string;
  odin: number;
  wtin: number;
  wtLbsPerFt: number;
  lengthFt: string;
  end: string;
  quantityFt: number;
  quantityPc: number;
  cvxRequiredDeliveryMonthYear: string;
  partial: string;
  vessel: string;
  etd: Date;
  eta: Date;
  deliveryDate: Date;
  receivingReport: string;
  status: string;
  soPriceMatOnly: number;
  userIdCreatedBy:number;
}

export interface WellHeadUpload{
    due :Date;
    orderLine :string;
    pONumber:string	;
    mmnumber:string;
    cpNum :string	;
    customerDistrict:string;
    orderNo:number;
    item:string;
    qtyOpen :number;
    description:string;
    salesValue:number;
    costValue: number;
    netAvail:number	;
    currentNet: number;
    orderDate :Date;
    coord:string;
    typeofWork:string;
    ordStatus:string;
    mTRJob:string;
    jobStatus:string;
    comment:string;
    delivery:string;
    userIdCreatedBy:number;
}

export interface YardInventoryUpload {
  materialId: string | null;
  productName: string | null;
  lotOrSerialNumber: string | null;
  location: string | null;
  stockingLocation: string | null;
  length: number | null;
  heatNumber: number | null;
  class: string | null;
  condition: string | null;
  accessory: string | null;
  sonumber: string | null;
  wellName: string | null;
  wbs: string | null;
  project: string | null;
  plantCode: string | null;
  Sloccode: string | null;
  userIdCreatedBy:number;
}