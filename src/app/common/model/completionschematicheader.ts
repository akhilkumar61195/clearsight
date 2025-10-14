export interface Completionschematicheader {
  schematicsID: number;
  schematicsName: string;
  projectId?:number|null;
  project?: string|null;
  lease: string;
  wellName: string;
  wellLocation: string;
  chevronEngineer: string;
  chevronWBS: string;
  userIdCreatedBy: string;
  wellId?: number | null;
  backupEngineer?: string | null;  
  statusId?:number|null;
  userIdModifiedBy: string;
  chevronEngineerId?:number|null;
  backupEngineerId?:number|null;
  wellFeaturesId?:number|null;
  noOfZones?:number|null;
  completionDesignId?:number|null;
}

