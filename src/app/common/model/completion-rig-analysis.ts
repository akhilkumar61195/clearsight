export interface WellMaterial{
    "materialId": string;
    "primaryDemand"?: number;
    "contingencyDemand"?: number;
    "orderQuantity"?: number;
    "remainder": number;
    "id":number
  }
  
   export interface RigScheduleWell{
    id:number;
    wellName: string;
    p10StartDate: string;
    p50StartDate: string;
    wellMaterials: WellMaterial[];
    wellOrders?:WellOrder[];
    wellNumber:number;
    wellId:number
    }
  
   export interface WellOrder{
    "materialId": string;
    "orderQuantity": number;
   }
  
  
    export interface InputData {
      wellName: string;
      p10StartDate: string;
      p50StartDate: string;
      wellMaterials: WellMaterial[];
      wellOrders?:WellOrder[];
    }
    export interface RigScheduleAnalysis {
      wellName: string;
      p10StartDate: string;
      p50StartDate: string;
      measure: string;
      [materialId: string]: any; // Dynamic keys for material IDs
    }
  
    export interface RigScheduleMaterial {
       "vendor": string;
       "materialId"?: string;
       "sapMM"?: string;
       "materialShortDesc": string;
       "inventory": number;
       "inventoryMinusBackup": number;
       "requiredBackup": number;
    }     
    export interface RigScheduleFooter {
      materialId: string;
      noRemainderDate?: string;
      noRemainderWellName: string;
   }
   export interface RigMaterialDemands {
    id: number;
    materialNumber: string;
    primaryDemand: number;
    contingencyDemand: number;
   } 
   
   export interface WellData{
     wellName: string;
     p10StartDate: string;
     p50StartDate: string;
     primaryDemand: number;
     contingencyDemand: number | string;
     orderQuantity: number;
     remainder: number;
   }
export interface RigScheduleFooterRow {
  measure: string;
  [materialId: string]: string; // dynamic keys like sapMM
}

