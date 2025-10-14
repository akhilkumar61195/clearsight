export interface WellDetails {
  wellNumber: number;
   wellId :number;
   id :number;
   edition:number;
   wellName:string;
   wellDesc:string;
   wellType :string
   wbs:string;
   plantCode:string;
   planningEngineerId :number;
   planningEngineer:string
   p10startDate:Date;
   p50startDate :Date;
   rig :string;
   isActive :boolean;
   isExported :boolean;
   completionsRelevance :boolean;
   appId:number;
   functionId :number;
   projectId:number;
  wellTypeId: number;
  whatIf?: boolean;
  duplicity?: number;
  demand?: number;
  plantId:number;
  wellheadkitId:string ;// added kitType
  wellheadKitType:string // added kit name
  userIdModifiedBy?:number; // added user id modified by
};

export interface CloneWhatIfWell {
 
   id :number;
   edition:number;
   p10StartDate:Date;
   p50StartDate :Date;
   includeOrExclude:string;
   duplicated:string;
   userIdCreatedBy:number;
   duplicity:number;
   clonedIndex?:number;
};