export interface WellInfo {
  id: number;
  // dateCreated: Date;
  // dateLastModified: Date;
  // edition: number;
  userIdCreatedBy?: number | null;
  userIdModifiedBy?: number | null;
  isActive?: boolean | null;
  wellNumber?: number | null;
  wellTypeId?: number | null;
  wellType?: string | null;
  wellName?: string | null;
  wellDesc?: string | null;
  planningEngineerId?: number | null;
  rig?: string | null;
  p10StartDate?: Date | null;
  p50StartDate?: Date | null;
  cloneNumber?: number | null;
  wbs?: string | null;
  isExported?: boolean | null;
  plantCode?: string | null;
  planningEngineer?: string | null;
  completionsRelevance?: boolean | null;
  appId?: number | null;
  projectId?: number | null;
  functionId?: number | null;
  planningEngineerName?: string | null;
  wellCoordinatorId?: number | null;
  wellCoordinatorName?: string | null;
  cai?: string | null;
  phone?: string | null;
  filledAndBlock?: string | null;
  ocsg?: string | null;
  schematicId?: number | null;
  kitType?: string | null;
  plantId ?:number | null,
  wellHeadKitId ?:number | null,

}

