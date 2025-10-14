export interface WellsByRig {
  appId?: number;
  applicationName: string;
  functionId?: number;
  functionName: string;
  rig: string;
  cnt?: number;
  wells: RigWells[];
}

export interface RigWells {
  id: number;
  wellName: string;
  materialCoordinator: string;
}
