export interface CreateWell{
    rig?: string | null;
    p10StartDate?: Date | null;
    p50StartDate?: Date | null;
    planningEngineerId?: number | null;
    planningEngineer?: string | null;
    wellTypeId?: number | null;
    wellType?: string | null;
    plantCode?: string | null;
    wellName?: string | null;
    userId?:number|null;
    appId?: number | null;
    projectId?: number | null;
    functionId?: number | null;
    plantId?: number | null;
}
