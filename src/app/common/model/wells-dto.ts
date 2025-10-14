export interface WellsDto {
  id: number;
  wellNumber: number;
  wellName?: string;
  WELLID: number;
  ISHIDDEN: boolean;
  FUNCTIONID: number;
  PROJECTID: number;
  WELLNAME: string;
}

export interface ProjectsDto {
  appId: number;
  application?: string;
  functionId: number;
  function?: string;
  projectId: number;
  project?: string;
  totalWells: number;
  wells?: WellsDto[];
  originalWells?: WellsDto[];
}

