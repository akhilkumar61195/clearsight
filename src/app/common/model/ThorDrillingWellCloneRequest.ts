export interface ThorDrillingWellCloneRequest {
  wellId: number;
  userId: number;
  wellTypeId: number;
  wellType: string;
  wellName: string;
  rig: string;
  p10StartDate: Date;   
  p50StartDate: Date;
  wbs: string;
  plantCodeId: number;
  plantCode: string;
  planningEngineerId: number;
  planningEngineer: string;
  projectId: number;
  functionId: number;
  // cai: string;
  phone: string;
  filledAndBlock: string;
  ocsg: string;
  wellheadkitId: number;
  wellCoordinatorId: number;
  wellCoordinatorName: string;
}

export interface CloneThorDrillingWell_Other {
  fromWellId: number;
  toWellId: number;
  userId: number;
}
