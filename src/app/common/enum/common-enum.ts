export enum AuthenticationSession {
  USER_ID = 'userId',
  EMAIL = 'email',
  TOKEN = 'token',
  COOKIES_PATH = '/',
  PERSONA_SETTING='userPersonaSettings',
  LOGGEDINUSER_APPLICATION_PERSMISSION='userApplicationPermissions'
}

export enum TaskTypes {
  CONTROLLINECLAMPS = 'clamps',
  DEPTHTABLE = 'depthtable',
  MDLDrilling = 'MDL Drilling',
  MDLCompletions = 'MDL Completions',
  DRILLINGRAWDATA = 'drillingRawData',
  COMPLETIONRAWDATA = 'completionRawData',
}

export enum routeLinks {
  appSelector = "app-selector",
  login = "login",

  mdlDashboard = "mdl",

  odinDashboard = "odin",
  odinLandingDashboard = "odin/landing",
  odinCompletionLandingDashboard = "odin/completionlanding",
  completiontimelineview = "odin/completiontimelineview",
  whatIf = "odin/whatif",
  timeLineView = "odin/timelineview",
  inventoryRead = "odin/inventoryread",
  demandConsumption = "odin/demandconsumption",
  demandValuation = "odin/demandvaluation",
  riganalysis = "odin/timelineview/riganalysis",
  rawdata = "odin/rawdata",
  wellhead = "odin/wellhead",
  odin2Dashboard = "odin2",
  odin2CompletionLandingDashboard = "odin2/completionlanding",
  completiontimelineviewV2 = "odin2/completiontimelineview",
  odin2LandingDashboard = "odin2/landing",
  odin2Timelineview = "odin2/timelineview",
  odin2Assembly = "odin2/assembly",
  rigSchudeleAnalysisDrilling = "odin2/timelineview/riganalysis",
  odin2WhatIf = "odin2/whatif",
  demandConsumptionV2 = "odin2/demandconsumption",
  demandValuationV2 = "odin2/demandvaluation",
  riganalysisCompletion = "odin2/completiontimelineview/riganalysiscompletion",
  rawdataV2 = "odin2/rawdata",

  odin3 = "odin",
  odinDashboard3 = "odin/dashboard",
  odinDrillingDashboard3 = "odin/dashboard/dashboarddrilling",
  odinCompletionDashboard3 = "odin/dashboard/dashboardcompletion",
  odinRigAnalysis3 = "odin/riganalysis",
  odinRigAnalysisDrilling3 = "odin/riganalysis/riganalysisdrilling",
  odinRigAnalysisCompletion3 = "odin/riganalysis/riganalysiscompletion",
  odinRawdata3 = "odin/rawdata",
  odinCompletionRawdata3 = "odin/completionrawdata",
  odinwhatIf3 = "odin/whatif",
  odin3Assembly = "odin/assembly",
  demandConsumptionV3 = "odin/demandconsumptionvaluation",

  thorDashboard = "thor",
  thor2Dashboard = "thor",
  thorLandingDashboard = "thor/dashboard",
  thor2LandingDashboard = "thor/thordashboard",
  thor2Drilling = "thor/thordashboard/drilling",
  thor2Completions = "thor/thordashboard/completions",
  tyr1Dashboard = "tyr1",
  tyrDashboard = "tyr",
  tyrLandingDashboard = 'tyr/tyr2Dashboard',
  tyrWorkQueue = "tyr/workqueue",
  tyrDetail = "tyr/workqueue/detail",
  tyr2Dashboard = "tyr",
  tyr2Invoice = "tyr/invoice",
  tyr2Inbox = "tyr/inbox",
  tyr2Detail = "tyr/invoice/detail",

  schematicDashboard = "schematic",
  schematicLanding = "schematic/schematiclanding",
  schematicDetail = "schematic/schematicdetail",

  adminDashboard = "admin",

  tyrListEditor = 'tyr/tyr-list-editor',

  tyrListEditorLabel = 'tyr-list-editor',
  invoice = 'invoice',
  inbox = 'inbox',

  // thor2LandingDashboard = "thor2/thordashboard",
  // thor2Drilling = "thor2/thordashboard/drilling",
  // thor2Completions = "thor2/thordashboard/completions",

}

export enum NotificationGroup {
  Thor = "Thor",
  Odin = "Odin",
  Tyr = "Tyr",
  Mdl = "Mdl",
  Schematic = "Schematic"
}

export enum UserRoleEnum {
  Odin = 'odin',
  Thor = 'thor',
  // Thor2 = 'thor2',
  TYR = 'tyr',
  Mdl = 'mdl',
  Schematic = 'schematic',
  Admin = 'admin'
}

export enum PersonaEnum {
  DE = "DE",
  PU = "PU",
  SME = "SME",
  VDR = "VDR"
}

export enum storeFilters {
  OdinAdvanceFilter = "readOdinAdvanceFilterData",
  ThorAdvanceFilter = "readThorAdvanceFilterData"
}

export enum SortOrder {
  DESC = "DESC",
  ASC = "ASC"
}

export enum OdinMenuType {
  Dashboard = "dashboard",
  WhatIf = "whatif",
  TimeLineView = "timelineview",
  InventoryRead = "inventoryread",
  DemandConsumption = "demandconsumption",
  DemandValuation = "demandvaluation",
  RawData = "rawdata",
  Wellhead = "wellhead",
  CompletionDashboard = "completionlanding",
  CompletionDemandValuation = "demandvaluation",
  CompletionRawData = "rawdata",
  CompletionTimeLineView = "completiontimelineview",

  Odin2Dashboard = "odin2dashboard",
  Odin3Dashboard = "odin3dashboard",
  Odin3CompletionDashboard = "odin3CompletionDashboard",
  Odin3Assembly = "odin3Assembly",
  odinRawdata3 = "odinRawdata3",
  odinCompletionRawdata3 = "odinCompletionRawdata3",
  Odin2WhatIf = "odin2whatif",
  Odin2TimeLineView = "odin2timelineview",
  Odin2Assembly = "odin2Assembly",
  Odin2InventoryRead = "odin2inventoryread",
  Odin2DemandConsumption = "odin2demandconsumption",
  Odin2DemandValuation = "odin2demandvaluation",
  Odin2RawData = "odin2rawdata",
  Odin2CompletionDashboard = "odin2completionlanding",
  Odin2CompletionDemandValuation = "odin2demandvaluation",
  Odin2CompletionRawData = "odin2rawdata",
  Odin2CompletionTimeLineView = "odin2completiontimelineview",
  Odin3DemandConsumption = "odin3demandconsumption",
}
 export enum TYRMenuType {
  TYR2Dashboard = "tyr2Dashboard",
  Invoice = "invoice",
  Inbox = "inbox",
  ListEditor = 'tyrlisteditor'
}
export enum SchematicText {
  SchematicMasterTable = "Schematic-MasterTable"
}

export enum TyrDisplayStatusCaseType {
  New = "New",
  Assigned = "Assigned",
  UnderReview = "Under Review",
  Reconciled = "Reconciled",
  Resolved = "Resolved",
}

export enum TyrFilterStatusCaseType {
  New = "New",
  Assigned = "Assigned",
  UnderReview = "UnderReview",
  Reconciled = "Reconciled",
  Resolved = "Resolved",
}

export enum MediaTypes {
  xlsx = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;"
}

export enum RawDataVisualizations {
  UnitCost = 'SAP Unit Cost',
  GroupedInventory = 'Grouped Inventory',
  Inventory = 'Automatic Read Inventory',
  Tenaris = 'Tenaris Orders',
  Valluorec = 'Valluorec Orders',
  Lhandwellhead = 'Liner Hanger Orders',
  Wellhead = 'Wellhead Orders',
  YardInventory = 'Yard Inventory', // New enum for Yard Inventory
  Miti = 'MITI',
}

export enum ColDefTables {
  Perforations = 'perforation'
}

export enum WellHeadKit {
Kits = 'KITS',
deleteComponents = 'Delete Components',
deleteKit = 'Delete Kit',
}
// bulk upload sheetname
export enum SheetNames {
  Vallourec = 'Open Orders',
  Tenaris="CVX Orders",
  LHWellHead="Orders",
  InventorySheet="",
  WellHeadSheet="Chevron",
  YardInventorySheet="Detailed",
}
// Document Store Enum
export enum DocumentStoreEnum {
  Rawdata = 'Rawdata',
  Schematic = 'Schematic',
  Thor = 'Thor',
  Odin = 'Odin',
  SharedFiles = 'SharedFiles',
  DefaultTemplates = 'DefaultTemplates'
}

export enum StateKeys {
    OdinInventory = 'odin-inventory',
    OdinYardInventory = 'odin-yardInventory',
}

export enum Tyr2TaskStatus {
  Submitted = 'Submitted',
  Pending = 'Pending',
  Completed = 'Completed',
}

export enum Tyr2InvoiceStatus {
  Submitted = 'Submitted',
  Pending = 'Pending',
  ReadyToProcess = 'Ready to Process',
  UnderReview = 'Under Review',
  Rejected = 'Rejected',
  Completed = 'Completed',
}

// export const AppHeaderDropdownList = [
//   { label: 'Demand Planning', value: routeLinks.odinDrillingDashboard3 },
//   { label: 'Operations Portal', value: routeLinks.thor2LandingDashboard },
//   // { label: 'Old TYR', value: routeLinks.tyr1Dashboard },
//   // { label: 'TYR', value: routeLinks.tyrLandingDashboard },
//   { label: 'Master Data Management', value: routeLinks.mdlDashboard },
//   { label: 'Schematic Designer', value: routeLinks.schematicDashboard },
//   { label: 'ADMIN', value: routeLinks.adminDashboard }
// ];

export const AppHeaderDropdownList = [
  { label: 'Demand Planning', value: routeLinks.odinDrillingDashboard3, permissionKey: 'ODIN' },
  { label: 'Operations Portal', value: routeLinks.thor2LandingDashboard, permissionKey: 'THOR' },
  { label: 'Master Data Management', value: routeLinks.mdlDashboard, permissionKey: 'MDL' },
  { label: 'Schematic Designer', value: routeLinks.schematicDashboard, permissionKey: 'SCHEMATIC' },
  { label: 'ADMIN', value: routeLinks.adminDashboard, permissionKey: 'ADMIN' }
];

// Adding enums for all applications getting from getApplicationPermissionList api
export enum AllApplications {
  admin = 'ADMIN',
  thor = 'THOR',
  schematic = 'SCHEMATIC',
  tyr = 'TYR',
  mdl = 'MDL',
  system = 'SYSTEM',
  odin = 'ODIN'
}

// Added common display messages enum
export enum CommonDisplayMessages {
  wellHeaderConfirmationTitle = 'Confirm Edit',
  tyrConfirmationTitle = 'Confirm Draft Well/s',
  wellHeaderConfirmation = 'The changes made will not be reflected in the What If Analysis. To display your changes in the What If Analysis module you will need to reset the scenario. To save your changes, click continue. Otherwise, click Cancel',
  tyrCreateDraftConfirmation = 'Are you sure you want to continue?',
  draftWells = 'Draft Wells',
  success = 'Success',
  error = 'Error',
  info = 'Info',
  commonErrorMessage = 'Something went wrong.',
  tyrDraftWellSucess = 'Included in TYR successfully.',
  tyrDraftWellFailure = 'An error occurred while adding the well to TYR.',
  moveToTasksHeader = 'Move to New or Existing Task',
  moveToTaskConfirmation = 'Are you attempting to move an email to a New Task, one or more Existing Tasks, or Both? Please choose from below',
  moveEmailContent = 'You are attempting to move [EmailSubject] from [EmailSender]. If you wish to move this message to both a new/existing task and an invoice, please click All. Otherwise select your destination.',
  MoveTypeHeader = 'Select Move Type'
}

// Enums for Message Severity
export enum MessageSeverityTypes {
  Success = 'success',
  Error = 'error',
  Info = 'info',
  Warn = 'warn'
}

// Document type names for use in code
export enum DocumentTypeEnum {
  Invoice = 'Invoice',
}

export enum LocaleTypeEnum {
  enUS = 'en-US',
}

export enum ConfigValuesEnum {
  ConfigValue = 'configvalue',
}

export enum ConfigValuesDropdownEnum {
  Status = 'status',
  Supplier = 'supplier',
  Project = 'project',
  Rig = 'rig',
  ReasonCode = 'reasoncode',
}

