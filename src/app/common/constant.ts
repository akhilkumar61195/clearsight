import { CookieSetOptions } from "universal-cookie";
import { AuthenticationSession } from "./enum/common-enum";

export const cookieOption: CookieSetOptions = {
  path: AuthenticationSession.COOKIES_PATH,
  sameSite: "strict",
  secure: true
} as CookieSetOptions;

export const EMAILPATTERN = "^[A-Za-z0-9._%+\\-]+@[A-Za-z0-9.\\-]+\\.[A-Za-z]{2,4}$";

export const USA_PHONENUMBER_PATTERN = "^[(][0-9]{3}[)] [0-9]{3}-[0-9]{4}$";

export const paginationRowDD = [
  { label: 10, value: 10 },
  { label: 20, value: 20 },
  { label: 30, value: 30 },
  { label: 50, value: 50 },
  { label: 100, value: 100 },
  { label: 500, value: 500 }
];

export const Actions = {
  BREADCRUMB_CHANGE_PARENT: "BREADCRUMB_CHANGE_PARENT",
  BREADCRUMB_CHANGE_CHILD: "BREADCRUMB_CHANGE_CHILD",
  BREADCRUMB_CHANGE_TEXT: "BREADCRUMB_CHANGE_TEXT",
  BREADCRUMB_REMOVE_ELEMENT: "BREADCRUMB_REMOVE_ELEMENT",
  BREADCRUMB_REBUILD: "BREADCRUMB_REBUILD",
  ELEMENT_LAST: "ELEMENT_LAST"
}

export const defaultRowNumber = 10;

export const getPhoneNumberInUSA = (newVal: string) => {
    if (newVal) {
        if (newVal.length === 0) {
            newVal = '';
        } else if (newVal.length <= 3) {
            newVal = newVal.replace(/^(\d{0,3})/, '($1)');
        } else if (newVal.length <= 6) {
            newVal = newVal.replace(/^(\d{0,3})(\d{0,3})/, '($1) $2');
        } else if (newVal.length <= 10) {
            newVal = newVal.replace(/^(\d{0,3})(\d{0,3})(\d{0,4})/, '($1) $2-$3');
        } else {
            newVal = newVal.substring(0, 10);
            newVal = newVal.replace(/^(\d{0,3})(\d{0,3})(\d{0,4})/, '($1) $2-$3');
        }
    } else {
        newVal = '';
    }
    return newVal;
}

export function omit_special_char(event: any, isSpecial?: boolean, restrictNumberSpecialChar?: boolean) {
  let k: any = event.charCode;
  let checkKeyCodeCharacters = [65, 67, 86, 88, 65, 67, 86, 88];
  if (restrictNumberSpecialChar) {
    const keychar = String.fromCharCode(k);
    const specialCharacters = ["'", "`", "!", "@", "#", "$", "%", "^", "&", "*", "(", ")", "-", "_", "+", "=", "/", "~", "<", ">", ",", ";", ":", "|", "?", "{", "}", "[", "]", "¬", "£", '"', "\\", "."];
    let isSpecialCharacter = specialCharacters.includes(keychar);
    if (isSpecialCharacter) {
      return false;
    }
    return ([46, 8, 9, 27, 13].indexOf(k) !== -1 ||
      (checkKeyCodeCharacters.includes(k) && event.ctrlKey === true) ||
      (k >= 48 && k <= 57) ||
      (k >= 35 && k <= 39));;
  }

  if (isSpecial) {
    return ([46, 8, 9, 27, 13].indexOf(k) !== -1 ||
      (checkKeyCodeCharacters.includes(k) && event.ctrlKey === true) ||
      (k >= 65 && k <= 90) || (k >= 97 && k <= 122) || (k >= 48 && k <= 57));
  } else
    return ([46, 8, 9, 27, 13].indexOf(k) !== -1 ||
      (checkKeyCodeCharacters.includes(k) && event.ctrlKey === true) ||
      (k >= 48 && k <= 57) ||
      (k >= 35 && k <= 39)); // Home, End, Left, Right)
}

export const setFormattedContact = (value: any, backspace: any) => {
  if (!value) {
    return "";
  }

  let newVal = value.replace(/\D/g, '');

  if (newVal) {
    newVal = newVal.trim();
  }

  if (backspace && newVal.length <= 6) {
    newVal = newVal.substring(0, newVal.length - 1);
  }

  newVal = getPhoneNumberInUSA(newVal);
  return newVal;
}
export const masterDataChangeLogTable='MaterialMaster'; //added enrity name to get mdl correct data
export const bulkUploadOdinDrilling='bulkUploadOdinDrilling'; //added enrity name to get mdl correct data
export const bulkUploadSchematicClamp='bulkUploadSchematicClamp'; //added enrity name to get mdl correct data
export const schematicDataChangeLogTable='completionSchematicsHeader';
export const schematicDetailsDataChangeLogTable='p2_schematicsDetailInfoTable';
export const thorCompletionHeaders='thorCompletionHeaders';
export const thorDrillingHeaders='thorDrillingHeaders';
export const NOTASSIGNED='Not Assigned';
export const vallorecDataBulkUploadTemplate=`DefaultTemplates/VallourecDataTemplate.xlsx`; // template for vallorec
export const tenarisDataBulkUploadTemplate=`DefaultTemplates/TenarisDataTemplate.xlsx`; //template for tenaris
export const rawDataBulkUploadTemplate=`DefaultTemplates/RawDataTemplate.xlsx`; //template for raw data
export const lhandWellHeadBulkUploadTemplate=`DefaultTemplates/LHAndWellHeadDataTemplate.xlsx`; // template for lhandwellhead bulk upload in odin raw data; Liner hander and wellhead using same template
export const inventoryBulkUploadTemplate=`DefaultTemplates/InventoryDataTemplate.xlsx`; // template for inventory bulk upload in odin raw data; Liner hander and wellhead using same template
export const mitiBulkUploadTemplate=`DefaultTemplates/MitiDataTemplate.xlsx`; // template for inventory bulk upload in odin raw data; Liner hander and wellhead using same template
export const wellHeadBulkUploadTemplate=`DefaultTemplates/WelllHeadDataTemplate.xlsx`; // template for inventory bulk upload in odin raw data; Liner hander and wellhead using same template
export const yardInventoryinventoryBulkUploadTemplate=`DefaultTemplates/YardInventoryDataTemplate.xlsx`; // template for yardInventory bulk upload in odin raw data; Liner hander and wellhead using same template
export const ClampTemplate=`DefaultTemplates/ClampTemplate.xlsx`; // template for schematic clamp
export const MDLDrillingTemplate=`DefaultTemplates/MDLDrillingTemplate.xlsx`; // template for MDL drilling
export const MDLCompletionTemplate=`DefaultTemplates/MDLCompletionTemplate.xlsx`; // template for MDL completion

export const tenarisScreen='Tenaris';
export const vallorecScreen='Vallourec';
export const LhScreen='Liner Hanger';
export const wellHeadScreen='Wellhead';
export const inventoryScreen='Inventory';  // declare inventory 
export const yardInventoryScreen='Yard Inventory';  // declare yadinventory 
export const mitiScreen='Miti';  // declare miti 
export const SYSTEM='SYSTEM'; // system for admin module
export const radioSummary = [
  // { LOOKUPTEXT: "All", LOOKUPDISPLAYTEXT: "All"},
  { LOOKUPTEXT: "P", LOOKUPDISPLAYTEXT: "Prim",checked:true },
  { LOOKUPTEXT: "C", LOOKUPDISPLAYTEXT:"Cont",checked:false },
  { LOOKUPTEXT: "S", LOOKUPDISPLAYTEXT:"Sec",checked:false },
  
];

export const radioSummaryDrilling = [
  
  { LOOKUPTEXT: "P", LOOKUPDISPLAYTEXT: "Prim",checked:true },
  { LOOKUPTEXT: "C", LOOKUPDISPLAYTEXT:"Cont",checked:false },
 
  
];

export const viewOptionsButtons = [
  { label: 'Wellbore Schematic', value: 7 },
  { label: 'Drilling Program', value: 8 },
  { label: 'Bucking Schematic', value: 9 }
];

export const openClose = [
  { label: 'Open', value: 'Open' },
  { label: 'Close', value: 'Close' },
 
];

export const sourService = [
  { text: 'Yes', value: 'Yes' },
  { text: 'No', value: 'No' },
 
];

export const selectedMonthService = [
  { text: '6 Months', value: '6 Months' },
  { text: '12 Months', value: '12 Months' },
  { text: '18 Months', value: '18 Months' },
  { text: '24 Months', value: '24 Months' }
];


export const AccessControls = {
  APPROVED_PERMISSION: "ApprovalReject",
  PUBLISH_PERMISSION: "Publish",
  APPROVED_PERMISSION_VALUE: "X",
  PUBLISH_PERMISSION_VALUE: "PUB",
  PENDING_APPROVAL_PERMISSION:"All",
  APPROVAL_REJECT_PERMISSION:"ExternalEngineer",
  MDL_ACCESS:"MDL_Access",
  READ_PERMISSION:"R",
  WRITE_PERMISSION:"W",
  EXECUTE_PERMISSION:'X',
  PUB_APR:"PUB_APR",
  THOR_DRILLING_ACCESS:'Thor_Drilling_Access',
  THOR_COMPLETION_ACCESS:'Thor_Completion_Access',
  MDL_DRILLING_ACCESS:'MDL_Drilling_Access',
  MDL_COMPLETION_ACCESS:'MDL_Access',
  TENARIS_ORDER_ACCESS:'Tenaris',
  VALLOUREC_ORDER_ACCESS:'Vallourec',
  LINERHANGER_ORDER_ACCESS:'LinerHanger',
  ODIN_DRILLING_ACCESS:'Odin_Drilling',
  ODIN_COMPLETION_ACCESS:'Odin_Completion',
  ODIN_DRILLING_WELLHEADER_ACCESS:'Odin_Drilling_WellHeader',
  ODIN_COMPLETION_WELLHEADER_ACCESS:'Odin_Completion_WellHeader',
  MITI_ORDER_ACCESS:'Miti',
  DRILLING_RIG_SCHEDULE_ACCESS:'DrillingRigSchedule',
  RAW_DATA_COMPLETION_UPLOAD:'RawData_Completion_Upload',
  RAW_DATA_DRILLING_UPLOAD:'RawData_Drilling_Upload',
  WELLHEAD_KIT:'WellHeadKit',
  SCHEMATIC_WELL_FEATURES:'WellFeature',
  SCHEMATIC_LANDING:'SchematicLanding',
  SCHEMATIC_PERFORATIONS:'SchematicPerforations',
  CLAMP_CONTROL:'ClampControl',
  CLONE_SCHEMATIC:'CloneSchematic',
  PUBLISH_SCHEMATIC:'PublishSchematic',
  IMPORT_DEPTHTABLE:'ImportDepthTable',
  COPYZONE_TOGGLE:'CopyZoneToggle',
  ADDSPACE_OUT:'AddSpaceOut',
  ADD_ASSEMBLY:'AddAssembly',
  ADD_COMPONENT:'AddComponent',
  ASSEMBLY_BUILDER:'AssemblyBuilder',
  WELL_HEAD_ORDER:'WellHeadOrders',
  SAP_ORDER:'SAPOrder',
  INVENTORY_ORDER:'Inventory',
  ADMIN_DRILLING_ACCESS: 'Admin_Drilling_Access',
  ADMIN_COMPLETION_ACCESS: 'Admin_Completion_Access',
  TYRWTR:'TYRWTR',
  INVOICE_MANAGEMENT: 'InvoiceManagement',
  TASK_MANAGEMENT: 'TaskManagement'
}
export const FilterValues={
 SUPPLIER:'Supplier',
 ACCESS_SUPPLIER_VALUE:'All'
}
export const WhatIfConfiguration = [
  { label: 'Default', value: 0 },
  { label: 'Scenario 2', value: 1 },
  { label: 'Scenario 3', value: 2 }
];