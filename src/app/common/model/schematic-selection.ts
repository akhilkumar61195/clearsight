export interface SchematicSelection {
  schematicId: number;
  schematicName: string;
  project: string;
  lease: string;
  wellName: string;
  wellLocation: string;
  chevronEngineer: string;
  rkbtoMsl?: number;
  waterDepth?: number;
  rkbtoMl?: number;
  rkbto1834Hpwh?: number;
  tol?: number;
  tiebackGap?: number;
  cflex?: string;
  sumpPackerFactor?: string;
  sumpPackerTop?: number;
  sumpPackerMuleShoeEoa?: number;
  twentyMbridgePlugEoa?: number;
  endofLiner?: number;
  ratholeLength?: number;
  ratholeLengthLcinstalled?: number;
  userIdCreatedBy?: string;
  userIdModifiedBy?: string;
}
