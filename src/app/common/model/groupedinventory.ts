export interface Groupedinventory {
  materialId: string | null;               // varchar, length 256, nullable
  generalAccountTotal: number;             // decimal, precision 17, scale 38, not nullable
  jackandStMaloTotal: number;              // decimal, precision 17, scale 38, not nullable
  tahitiTotal: number;                     // decimal, precision 17, scale 38, not nullable
  bigFootTotal: number;                    // decimal, precision 17, scale 38, not nullable
  blindFaithTotal: number;                 // decimal, precision 17, scale 38, not nullable
  anchorTotal: number;                     // decimal, precision 17, scale 38, not nullable
  ballymoreTotal: number;                  // decimal, precision 17, scale 38, not nullable
  surplusTotal: number;                    // decimal, precision 17, scale 38, not nullable
}
