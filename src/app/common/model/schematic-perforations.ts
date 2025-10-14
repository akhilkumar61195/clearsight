export class SchematicPerforations {
  perforationID: number;
  schematicsID: number;
  zoneID?: number | null;
  perforationDescription?: string | null;
  placement?: string | null;
  perforationDepth?: number | null;
  lengthOfPZone?: number | null;
  perfToPerfLength?: number | null;
  screenCoverage?: number | null;
  userId?: string | null;
  isDeleted?: number | 0;
  topDepthOuter: number | 0;
}
